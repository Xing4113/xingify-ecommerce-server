// controllers/stripe.controller.js
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.getSessionDetails = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve session" });
  }
};
