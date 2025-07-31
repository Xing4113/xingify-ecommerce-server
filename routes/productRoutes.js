const { Router } = require("express");
const productController = require("../controllers/product.controller");

const router = Router();

router.get("/", productController.getProductByFilter);
router.get("/:productId", productController.getProductByProductId);

module.exports = router;
