const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");
dotenv.config();

exports.setJWTToken = (res, user_id, email) => {
  const tokenExpirationInSec = parseInt(process.env.JWT_EXPIRATION) || 86400;
  const isProd = process.env.NODE_ENV === "production";

  const token = jwt.sign({ id: user_id, email }, process.env.JWT_SECRET, {
    expiresIn: tokenExpirationInSec,
  });

  res.cookie("jwtToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "None" : "Lax",
    maxAge: tokenExpirationInSec * 1000,
  });
};
