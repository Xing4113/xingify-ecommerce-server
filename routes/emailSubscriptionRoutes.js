const express = require("express");
const router = express.Router();
const emailSubscriptionController = require("../controllers/emailSubscription.controller");

router.post(
  "/addEmailSubscription",
  emailSubscriptionController.addEmailSubscription
);

module.exports = router;
