const { EmailSubscription } = require("../models");
const { sendSuccessEmailSubscription } = require("../utils/emailService.utils");

exports.addEmailSubscription = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Normalize email
    email = email.trim().toLowerCase();

    const [subscription, created] = await EmailSubscription.findOrCreate({
      where: { email },
      defaults: { status: true },
    });

    if (!created) {
      if (subscription.status === true) {
        return res.status(200).json({
          message: "This email is already subscribed.",
        });
      }

      // Reactivate subscription
      await subscription.update({ status: true });

      // Send confirmation email
      await sendSuccessEmailSubscription(email);

      return res.status(200).json({
        message: "Your subscription has been reactivated.",
      });
    }

    // New subscription – send welcome email
    await sendSuccessEmailSubscription(email);

    return res.status(200).json({
      message: "You have been successfully subscribed.",
    });
  } catch (err) {
    console.error("addEmailSubscription error:", err);
    return res
      .status(500)
      .json({ message: "Failed to subscribe. Please try again later." });
  }
};
