const Sequelize = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User.model");
const Product = require("./Product.model");
const ProductImage = require("./ProductImage.model");
const ProductVariant = require("./ProductVariant.model");
const Cart = require("./Cart.model");
const Order = require("./Order.model");
const OrderDetail = require("./OrderDetail.model");
const EmailSubscription = require("./EmailSubscription.model");

// Product associations
Product.hasMany(ProductImage, { foreignKey: "productId", as: "images" });
Product.hasMany(ProductVariant, { foreignKey: "productId", as: "variants" });

ProductImage.belongsTo(Product, { foreignKey: "productId" });
ProductVariant.belongsTo(Product, { foreignKey: "productId" });

// Cart associations
Cart.belongsTo(User, { foreignKey: "user_id", as: "user" });
Cart.belongsTo(Product, { foreignKey: "productId", as: "product" });

User.hasMany(Cart, { foreignKey: "user_id", as: "cartItems" });
Product.hasMany(Cart, { foreignKey: "productId", as: "cartItems" });

// Order associations
Order.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Order, { foreignKey: "user_id", as: "orders" });

Order.hasMany(OrderDetail, { foreignKey: "order_id", as: "items" });
OrderDetail.belongsTo(Order, { foreignKey: "order_id", as: "order" });

OrderDetail.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(OrderDetail, { foreignKey: "productId", as: "orderItems" });

// Export all models
module.exports = {
  Sequelize,
  sequelize,
  User,
  Product,
  ProductImage,
  ProductVariant,
  Cart,
  Order,
  OrderDetail,
  EmailSubscription,
};
