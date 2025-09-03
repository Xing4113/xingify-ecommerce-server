const { google } = require("googleapis");
const path = require("path");
const ejs = require("ejs");
const dotenv = require("dotenv");

dotenv.config();

// Setup OAuth2 Client for Gmail API
const oAuth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

// Low-level Gmail API email sender
async function sendEmail(to, subject, htmlContent) {
  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

  const messageParts = [
    `From: "Xingify" <${process.env.GMAIL_USER}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    htmlContent,
  ];
  const message = messageParts.join("\n");

  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodedMessage },
  });

  console.log(`Email sent to ${to} | Subject: ${subject}`);
}

// Wrapper to render EJS templates and send
async function sendTemplateEmail(to, subject, templateName, context = {}) {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      `${templateName}.ejs`
    );

    const htmlContent = await ejs.renderFile(templatePath, context);
    await sendEmail(to, subject, htmlContent);
  } catch (error) {
    console.error("❌ Error sending template email:", error);
  }
}

// OTP email
exports.sendOtpEmail = async (to, otp) => {
  const subject = `Your One-Time Password (OTP) - ${otp}`;
  const context = { otp };
  await sendTemplateEmail(to, subject, "otp-email", context);
};

// Subscription success email
exports.sendSuccessEmailSubscription = async (to) => {
  const subject = "Thanks for Subscribing - Stay Tuned!";
  await sendTemplateEmail(to, subject, "success-subscription-email", {});
};
