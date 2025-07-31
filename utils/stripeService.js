// utils/stripe.js
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createStripeCheckoutSession = async (items, deliveryFee, metadata) => {
  const lineItems = items.map((item) => ({
    price_data: {
      currency: "SGD",
      product_data: {
        name: item.product.name,
        images: [item.product.imageUrl],
        metadata: {
          color: item.color,
          size: item.size,
        },
      },
      unit_amount: Math.round(item.product.price * 100), // Stripe uses cents
    },
    quantity: item.quantity,
  }));

  // Add delivery fee as a separate line item
  if (deliveryFee > 0) {
    lineItems.push({
      price_data: {
        currency: "SGD",
        product_data: {
          name: "Delivery Fee",
        },
        unit_amount: Math.round(deliveryFee * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: lineItems,
    metadata,
    success_url:
      "http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url:
      "http://localhost:3000/payment/cancel?session_id={CHECKOUT_SESSION_ID}",
  });

  return session;
};

module.exports = {
  createStripeCheckoutSession,
};
