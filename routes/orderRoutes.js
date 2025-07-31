const { Router } = require("express");
const orderController = require("../controllers/order.controller");
const verifyToken = require("../middlewares/authMiddleware");

const router = Router();

router.post("/prepare", verifyToken, orderController.prepareOrder);
router.put("/confirmOrder", verifyToken, orderController.confirmOrder);
router.delete("/cancelOrder", verifyToken, orderController.cancelOrder);
router.get("/orderHistory", verifyToken, orderController.getUserOrders);
router.patch("/cancelUserOrder", verifyToken, orderController.cancelUserOrder);
router.patch(
  "/confirmOrderReceived",
  verifyToken,
  orderController.confirmOrderReceived
);

module.exports = router;
