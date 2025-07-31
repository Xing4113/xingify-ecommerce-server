// routes/stripe.route.js
const express = require("express");
const router = express.Router();
const stripeController = require("../controllers/stripe.controller");

router.get("/session/:id", stripeController.getSessionDetails);

module.exports = router;
