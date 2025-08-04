const {
  Cart,
  Product,
  ProductVariant,
  ProductImage,
  sequelize,
} = require("../models");

exports.showCart = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not logged in" });
  }

  try {
    const cartItems = await Cart.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          as: "product",
          include: [
            {
              model: ProductImage,
              as: "images",
              where: { isThumbnail: true },
              required: false,
            },
          ],
        },
      ],
    });

    return res.status(200).json({ cart: cartItems });
  } catch (err) {
    console.error("showCart error:", err);
    return res.status(500).json({ message: "Failed to retrieve cart" });
  }
};

exports.addToCart = async (req, res) => {
  const userId = req.user?.id;
  const { productId, color, size, quantity = 1 } = req.body;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized: User not logged in" });
  }

  if (!productId || !color || !size) {
    return res
      .status(400)
      .json({ message: "Product ID, color, and size are required" });
  }

  try {
    const existing = await Cart.findOne({
      where: { user_id: userId, productId, color, size },
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Item already in cart with selected variant" });
    }

    await Cart.create({
      user_id: userId,
      productId,
      color,
      size,
      quantity,
    });

    return res.status(200).json({ message: "Item added to cart" });
  } catch (err) {
    console.error("addToCart error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.increaseFromCart = async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.itemId;

  try {
    const item = await Cart.findOne({ where: { id: itemId, user_id: userId } });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.quantity += 1;
    await item.save();

    res.json({ message: "Quantity increased", item });
  } catch (err) {
    console.error("increaseFromCart error:", err);
    res.status(500).json({ message: "Failed to increase item", error: err });
  }
};

exports.decreaseFromCart = async (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.itemId;

  try {
    const item = await Cart.findOne({ where: { id: itemId, user_id: userId } });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.quantity > 1) {
      item.quantity -= 1;
      await item.save();
    } else {
      return res.status(400).json({ message: "Minimum quantity is 1" });
    }

    res.json({ message: "Quantity decreased", item });
  } catch (err) {
    console.error("decreaseFromCart error:", err);
    res.status(500).json({ message: "Failed to decrease item", error: err });
  }
};

exports.deleteFromCart = async (req, res) => {
  const user_id = req.user.id;
  const itemId = req.params.itemId;

  try {
    await Cart.destroy({ where: { id: itemId, user_id } });
    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete item", error: err });
  }
};

exports.getAvailableSizes = async (req, res) => {
  const itemId = req.params.itemId;
  const userId = req.user.id;

  try {
    const item = await Cart.findOne({
      where: { id: itemId, user_id: userId },
      include: [{ model: Product, as: "product" }],
    });

    if (!item) return res.status(404).json({ message: "Item not found" });

    const productId = item.productId;
    const color = item.color;

    if (!color)
      return res.status(400).json({ message: "Color not found in cart item" });

    const allVariants = await ProductVariant.findAll({
      where: { productId, color },
      attributes: ["size", "stock"],
    });

    const sizes = {
      allSize: item.product.size,
      availableSize: allVariants,
    };

    res.json({ sizes });
  } catch (err) {
    console.error("getAvailableSizes error:", err);
    res.status(500).json({ message: "Failed to fetch sizes" });
  }
};

exports.updateCartItemSize = async (req, res) => {
  const userId = req.user.id;
  const { size } = req.body;
  const itemId = req.params.itemId;

  try {
    const item = await Cart.findOne({ where: { id: itemId, user_id: userId } });

    if (!item) return res.status(404).json({ message: "Item not found" });

    item.size = size;
    await item.save();

    res.json({ message: "Size updated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update size", error: err });
  }
};

exports.countCart = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await Cart.findOne({
      where: { user_id: userId },
      attributes: [
        [sequelize.fn("SUM", sequelize.col("quantity")), "totalQuantity"],
      ],
      raw: true,
    });

    const totalQuantity = result.totalQuantity || 0;

    res.json({ count: totalQuantity });
  } catch (err) {
    console.error("countCart error:", err);
    res.status(500).json({ message: "Failed to count cart items" });
  }
};
