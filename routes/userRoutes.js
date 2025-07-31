const { Router } = require("express");
const userController = require("../controllers/user.controller");
const verifyToken = require("../middlewares/authMiddleware");

const router = Router();

router.get("/profile", verifyToken, userController.getUserProfile);
router.post("/logoutUser", verifyToken, userController.logoutUser);
router.patch("/updateEmail", verifyToken, userController.updateEmail);
router.patch("/updateNamePhone", verifyToken, userController.updateNamePhone);
router.patch("/updateAddress", verifyToken, userController.updateAddress);
router.patch("/updatePassword", verifyToken, userController.updatePassword);

module.exports = router;
