const { User } = require("../models");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { getRedisClient } = require("../config/redisClient");

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

exports.getUserProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findOne({
      where: { user_id: userId },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const userInfo = {
      userId: user.user_id,
      name: user.name,
      email: user.email,
      address: user.address,
      phone_number: user.phone_number,
      street_address: user.street_address,
      unit_number: user.unit_number,
      postal_code: user.postal_code,
      city: user.city,
      is_email_verify: user.is_email_verify,
      has_password: user.password ? true : false,
    };

    res.status(200).json({ userInfo });
  } catch (err) {
    console.error("getUserProfile error:", err);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
};

// Logout user by clearing JWT cookie
exports.logoutUser = (req, res) => {
  res.clearCookie("jwtToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
  res.status(200).json({ message: "Logged out successfully" });
};

exports.updateEmail = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    const user_id = req.user.id;

    // 1. Check if email is taken by another user
    const emailInUse = await User.findOne({ where: { email } });
    if (emailInUse && emailInUse.user_id !== user_id) {
      return res.status(400).json({ otpError: "Email already in use." });
    }

    // 2. Validate OTP
    const result = await compareOTP(email, otpCode);
    if (!result.success) {
      return res.status(400).json({ otpError: result.message });
    }

    // 3. Update email and verification status
    await User.update(
      { email, is_email_verify: true },
      { where: { user_id: user_id } }
    );

    // 4. Clear OTP from Redis
    await redisClient.del(email);

    res.status(200).json({ message: "Email updated successfully." });
  } catch (e) {
    console.error("updateEmail:", e);
    res.status(500).json({ otpError: "Internal Server Error" });
  }
};

exports.updateNamePhone = async (req, res) => {
  const user_id = req.user.id;
  const { name, phone_number } = req.body;

  try {
    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.name = name;
    user.phone_number = phone_number;
    await user.save();

    res.json({ message: "Name and phone number updated successfully." });
  } catch (err) {
    console.error("updateNamePhone error:", err);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

exports.updateAddress = async (req, res) => {
  const user_id = req.user.id;
  const { street_address, unit_number, postal_code, city } = req.body;

  try {
    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const full_address = `${street_address}, ${
      unit_number ? unit_number + ", " : ""
    }${city} ${postal_code}`;

    user.street_address = street_address;
    user.unit_number = unit_number;
    user.postal_code = postal_code;
    user.city = city;
    user.full_address = full_address;
    await user.save();

    res.json({ message: "Address updated successfully." });
  } catch (error) {
    console.error("Update Address ", error);
    res.status(500).json({ message: "Server error while updating address." });
  }
};

exports.updatePassword = async (req, res) => {
  const user_id = req.user.id;
  const { current_password, new_password } = req.body;

  try {
    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const hasPassword = !!user.password;

    if (hasPassword) {
      const isMatch = await bcrypt.compare(current_password, user.password);

      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });
      }
    }

    const hashed = await bcrypt.hash(new_password, 10);
    user.password = hashed;
    await user.save();

    return res.status(200).json({
      message: hasPassword ? "Password updated." : "Password set successfully.",
    });
  } catch (err) {
    console.error("Update password error:", err);
    return res
      .status(500)
      .json({ message: "Server error while updating password." });
  }
};
