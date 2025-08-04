const { User } = require("../models");
const { Op } = require("sequelize");
const { setJWTToken } = require("../utils/jwt.utils");
const bcrypt = require("bcryptjs");
const emailUtils = require("../utils/email.utils");
const { getRedisClient } = require("../config/redisClient");
const dotenv = require("dotenv");

dotenv.config();

const compareOTP = async (email, otpEntered) => {
  const redis = await getRedisClient();
  const storedOtpHash = await redis.get(email);

  if (!storedOtpHash) {
    return { success: false, message: "OTP has expired" };
  }

  const isMatch = await bcrypt.compare(otpEntered, storedOtpHash);

  if (!isMatch) {
    return { success: false, message: "Invalid OTP entered" };
  }

  return { success: true };
};

exports.register = async (req, res) => {
  try {
    const { password, otpEntered } = req.body;

    const email = req.body.email.trim().toLowerCase();
    const name = req.body.name.trim();

    const result = await compareOTP(email, otpEntered);

    if (!result.success) {
      return res.status(400).json({ errMsg: result.message });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({ errMsg: "This email has already been registered." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      is_email_verify: true,
    });

    setJWTToken(res, user.user_id, user.email);

    return res
      .status(201)
      .json({ message: "User registered", user_id: user.user_id });
  } catch (e) {
    console.error("register :", e);
    return res.status(500).json({
      errMsg:
        "Something went wrong. Please contact the administrator for assistance.",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();

    // Check if user exists
    const userExist = await User.findOne({ where: { email } });

    if (userExist) {
      return res.status(200).json({ emailFound: true, message: "Email found" });
    }

    return res
      .status(200)
      .json({ emailFound: false, message: "Email not found" });
  } catch (e) {
    console.error("login :", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.passwordLogin = async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email.trim().toLowerCase();

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    setJWTToken(res, user.user_id, user.email);

    return res.status(200).json({
      message: "Login successful",
      user_id: user.user_id,
    });
  } catch (e) {
    console.error("passwordLogin :", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const redis = await getRedisClient();
    await redis.setEx(email, 600, hashedOtp); // expires in 10 min

    emailUtils.sendOtpEmail(email, otp);

    return res.status(200).json({ message: "OTP sent to email" });
  } catch (e) {
    console.error("sendOtp :", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otpEntered } = req.body;

    const result = await compareOTP(email, otpEntered);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    const user = await User.findOne({ where: { email } });

    setJWTToken(res, user.user_id, user.email);

    return res.status(200).json({
      message: "OTP verified successfully",
      user_id: user?.user_id || null,
    });
  } catch (e) {
    console.error("verifyOtp:", e);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Google Login
exports.googleLogin = async (req, res) => {
  try {
    const { google_id, name, email } = req.user;

    let user = await User.findOne({
      where: {
        [Op.or]: [{ google_id }, { email }],
      },
    });

    if (user && !user.google_id) {
      user = await user.update({ google_id });
    }

    if (!user) {
      user = await User.create({
        google_id,
        name,
        email,
        is_email_verify: true,
      });
    }

    setJWTToken(res, user.user_id, user.email);
    res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
  } catch (err) {
    console.error("googleLogin error:", err);
    res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=social`
    );
  }
};

// Facebook Login
exports.facebookLogin = async (req, res) => {
  try {
    const { facebook_id, name, email } = req.user;

    let user = await User.findOne({
      where: {
        [Op.or]: [{ facebook_id }, { email }],
      },
    });

    if (user && !user.facebook_id) {
      user = await user.update({ facebook_id });
    }

    if (!user) {
      user = await User.create({
        facebook_id,
        name,
        email,
        is_email_verify: true,
      });
    }

    setJWTToken(res, user.user_id, user.email);
    res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
  } catch (err) {
    console.error("facebookLogin error:", err);
    res.redirect(
      `${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=social`
    );
  }
};

exports.getJwtToken = async (req, res) => {
  const token = req.cookies.jwtToken;

  if (!token) return res.json({ jwtToken: false });

  try {
    return res
      .status(200)
      .json({ jwtToken: true, message: "JwtToken Detected" });
  } catch {
    return res.json({ jwtToken: false });
  }
};
