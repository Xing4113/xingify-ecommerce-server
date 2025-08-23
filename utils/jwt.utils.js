const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");
dotenv.config();

exports.setJWTToken = (res, user_id, email) => {
  const tokenExpirationInSec = parseInt(process.env.JWT_EXPIRATION) || 86400;

  const token = jwt.sign({ id: user_id, email }, process.env.JWT_SECRET, {
    expiresIn: tokenExpirationInSec,
  });

  res.cookie("jwtToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: tokenExpirationInSec * 1000,
  });
};
