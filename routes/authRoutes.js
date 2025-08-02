const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const passport = require("passport");

const router = Router();

router.get("/getJwtToken", authController.getJwtToken);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/passwordLogin", authController.passwordLogin);
router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);

// Google OAuth Login
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false,
  }),
  authController.googleLogin
);

router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
    session: false,
  })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: `${process.env.CLIENT_URL}/login`,
    session: false,
  }),
  authController.facebookLogin
);
module.exports = router;
