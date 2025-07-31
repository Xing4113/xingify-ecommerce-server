const {
  Order,
  OrderDetail,
  Product,
  ProductImage,
  ProductVariant,
  Cart,
} = require("../models");
const { Op } = require("sequelize");
const { createStripeCheckoutSession } = require("../utils/stripeService");
const { generateUniqueNo } = require("../utils/uniqueNo.utils");

const { sequelize } = require("../models");

exports.prepareOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      name,
      email,
      phoneNumber,
      streetAddress,
      unitNumber,
      postalCode,
      city,
      deliveryType,
      deliveryFee,
      totalAmount,
      expectedDate,
      items,
    } = req.body;

    // Step 1: Validate stock
    for (const item of items) {
      const variant = await ProductVariant.findOne({
        where: {
          productId: item.productId,
          color: item.color,
          size: item.size,
        },
        transaction: t,
      });

      if (!variant || variant.stock < item.quantity) {
        await t.rollback();
        return res.json({ status: "unavailable" });
      }
    }

    // Step 2: Create order
    const order_no = generateUniqueNo("ORD");
    const fullAddress = `${streetAddress}, ${
      unitNumber ? unitNumber + ", " : ""
    }${city} ${postalCode}`;

    const order = await Order.create(
      {
        order_no,
        user_id: req.user.id,
        name,
        email,
        phone_number: phoneNumber,
        street_address: streetAddress,
        unit_number: unitNumber,
        postal_code: postalCode,
        city,
        full_address: fullAddress,
        delivery_type: deliveryType,
        delivery_fee: deliveryFee,
        expected_date: expectedDate,
        total_amount: totalAmount,
        status: "draft",
        payment_status: "pending",
      },
      { transaction: t }
    );

    // Step 3: Create OrderDetails
    for (const item of items) {
      await OrderDetail.create(
        {
          order_id: order.order_id,
          order_no: order_no,
          productId: item.product.productId,
          product_name: item.product.name,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
          price: item.product.price,
          subtotal: item.product.price * item.quantity,
        },
        { transaction: t }
      );
    }

    // Step 4: Create Stripe session BEFORE committing
    const session = await createStripeCheckoutSession(items, deliveryFee, {
      order_id: order.order_id.toString(), // or order.id if you alias
      order_no: order_no.toString(),
    });

    // Step 5: Commit only after Stripe session succeeds
    await t.commit();

    return res.json({ status: "ok", checkoutUrl: session.url });
  } catch (err) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error("Prepare order failed:", err);
    return res.status(500).json({ error: "Failed to prepare order" });
  }
};

exports.confirmOrder = async (req, res) => {
  const { order_id, order_no } = req.body;
  const user_id = req.user.id;

  try {
    const [updatedCount] = await Order.update(
      {
        status: "confirmed",
        payment_status: "paid",
      },
      {
        where: {
          order_id,
          order_no,
          user_id,
          status: "draft",
          payment_status: "pending",
        },
      }
    );

    if (updatedCount === 0) {
      return res
        .status(404)
        .json({ error: "Order not found or already processed" });
    }

    await Cart.destroy({
      where: { user_id },
    });

    return res.status(200).json({ order_no });
  } catch (err) {
    console.error("Failed to confirm order:", err);
    res.status(500).json({ error: "Failed to confirm order" });
  }
};

exports.cancelOrder = async (req, res) => {
  const { order_id, order_no } = req.body;
  const user_id = req.user.id;

  try {
    const order = await Order.findOne({
      where: {
        order_id,
        order_no,
        user_id,
        status: "draft",
        payment_status: "pending",
      },
    });

    if (!order) {
      return res
        .status(400)
        .json({ error: "Order not found or already processed" });
    }

    await OrderDetail.destroy({
      where: { order_id },
    });

    await Order.destroy({
      where: { order_id, order_no },
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error("Failed to cancel order:", err);
    res.status(500).json({ error: "Failed to cancel order" });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { user_id: userId, status: { [Op.ne]: "draft" } },
      order: [["created_at", "DESC"]],
      include: [
        {
          model: OrderDetail,
          as: "items", // from Order.hasMany(OrderDetail, { as: "items" })
          include: [
            {
              model: Product,
              as: "product", // from OrderDetail.belongsTo(Product, { as: "product" })
              attributes: ["name"],
              include: [
                {
                  model: ProductImage,
                  as: "images", // from Product.hasMany(ProductImage, { as: "images" })
                  attributes: ["imageUrl", "color"],
                },
              ],
            },
          ],
        },
      ],
    });

    const formattedOrders = orders.map((order) => ({
      order_id: order.order_id,
      order_no: order.order_no,
      status: order.status,
      created_at: order.created_at,
      total_amount: order.total_amount,
      expected_date: order.expected_date,
      arrives_date: order.arrives_date,
      delivery_fee: order.delivery_fee,
      cancel_dt: order.cancel_dt,
      items: order.items.map((item) => {
        const product = item.product;

        const matchingImage = product?.images?.find(
          (img) => img.color?.toLowerCase() === item.color?.toLowerCase()
        );

        const fallbackImage = product?.images?.[0];

        return {
          id: item.id,
          name: product?.name,
          product_image:
            matchingImage?.imageUrl || fallbackImage?.imageUrl || "",
          size: item.size,
          color: item.color,
          quantity: item.quantity,
          subtotal: item.subtotal,
        };
      }),
    }));

    res.json({ orders: formattedOrders });
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({ message: "Failed to get user orders" });
  }
};

exports.cancelUserOrder = async (req, res) => {
  const { order_id, order_no } = req.body;
  const user_id = req.user.id;

  if (!order_id || !order_no) {
    return res
      .status(400)
      .json({ success: false, message: "Missing order_id or order_no" });
  }

  try {
    const order = await Order.findOne({
      where: { order_id, order_no, user_id },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order already cancelled",
      });
    }

    order.status = "cancelled";
    order.cancel_dt = new Date();
    order.updated_at = new Date();
    order.expected_date = "N/A";
    await order.save();

    return res
      .status(200)
      .json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.confirmOrderReceived = async (req, res) => {
  const { order_id, order_no } = req.body;
  const user_id = req.user.id;

  if (!order_id || !order_no) {
    return res
      .status(400)
      .json({ success: false, message: "Missing order_id or order_no" });
  }

  try {
    const order = await Order.findOne({
      where: { order_id, order_no, user_id },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Order already completed",
      });
    }

    order.status = "completed";
    order.complete_dt = new Date();
    order.updated_at = new Date();
    order.arrives_date = new Date();
    await order.save();

    return res
      .status(200)
      .json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
