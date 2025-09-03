// emailService.js
const nodemailer = require("nodemailer");
const path = require("path");
const ejs = require("ejs"); // For rendering email templates
const dotenv = require("dotenv");

dotenv.config();

// Create a transport instance
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Helper function to send an email
const sendEmail = async (to, subject, templateName, context) => {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      `${templateName}.ejs`
    );

    // Render the HTML content using the provided template and context
    const htmlContent = await ejs.renderFile(templatePath, context);

    const mailOptions = {
      from: process.env.GMAIL_USER, // Sender address
      to, // Receiver address
      subject, // Subject line
      html: htmlContent, // HTML body content
    };

    // Send the email
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Function to send OTP email
exports.sendOtpEmail = async (to, otp) => {
  const subject = `Your One-Time Password (OTP) - ${otp}`;
  const context = { otp };

  // Use EJS template to generate the email content
  await sendEmail(to, subject, "otp-email", context);
};

exports.sendSuccessEmailSubscription = async (to) => {
  const subject = "Thanks for Subscribing - Stay Tuned!";
  const context = {}; // No OTP needed

  await sendEmail(to, subject, "success-subscription-email", context);
};
