const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const cartController = require("../controllers/cart.controller");

router.get("/", verifyToken, cartController.showCart);
router.post("/add", verifyToken, cartController.addToCart);
router.patch("/:itemId/increase", verifyToken, cartController.increaseFromCart);
router.patch("/:itemId/decrease", verifyToken, cartController.decreaseFromCart);
router.delete("/:itemId", verifyToken, cartController.deleteFromCart);
router.get("/getInfo/:itemId", verifyToken, cartController.getAvailableSizes);
router.patch(
  "/updateSize/:itemId",
  verifyToken,
  cartController.updateCartItemSize
);
router.get("/countCart", verifyToken, cartController.countCart);

module.exports = router;
