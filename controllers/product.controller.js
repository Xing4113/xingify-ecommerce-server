const { Product, ProductImage, ProductVariant } = require("../models");

const { Op, literal, where } = require("sequelize");

const getProductByFilter = async (req, res) => {
  try {
    const {
      category,
      style,
      brand,
      size,
      color,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    } = req.query;

    const andConditions = [];

    // Category (OR values inside)
    if (category) {
      if (category.toLowerCase() === "new-arrival") {
        andConditions.push({ is_new_arrive: true });
      } else {
        andConditions.push({ category: { [Op.eq]: category } });
      }
    }

    // Style (OR values inside)
    if (style) {
      andConditions.push({ style: { [Op.eq]: style } });
    }

    // Brand (OR values inside)
    if (brand) {
      const brandArray = Array.isArray(brand) ? brand : brand.split(",");
      andConditions.push({ brand: { [Op.in]: brandArray } });
    }

    // Price range
    if (minPrice || maxPrice) {
      const priceClause = {};
      if (minPrice) priceClause[Op.gte] = parseFloat(minPrice);
      if (maxPrice) priceClause[Op.lte] = parseFloat(maxPrice);
      andConditions.push({ price: priceClause });
    }

    // Size: matches if any of the sizes are in the JSON array
    if (size) {
      const sizeArray = size.split(",");
      andConditions.push({
        [Op.or]: sizeArray.map((s) =>
          where(literal(`JSON_CONTAINS(size, '${JSON.stringify(s)}')`), true)
        ),
      });
    }

    // Color: matches if any of the colors are in the JSON array
    if (color) {
      const colorArray = color.split(",");
      andConditions.push({
        [Op.or]: colorArray.map((c) =>
          where(
            literal(
              `JSON_SEARCH(color, 'one', ${JSON.stringify(
                `%${c}%`
              )}) IS NOT NULL`
            ),
            true
          )
        ),
      });
    }

    // isActive = true
    andConditions.push({ isActive: true });

    const products = await Product.findAll({
      attributes: [
        "productId",
        "name",
        "price",
        "brand",
        "category",
        "style",
        "price",
        "color",
        "imageUrl",
      ],
      where: {
        [Op.and]: andConditions,
      },
      order: sortBy ? [[sortBy, sortOrder?.toUpperCase()]] : [],
    });

    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching filtered product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getProductByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({
      where: { productId: productId },
      include: [
        {
          model: ProductImage,
          as: "images", //
          attributes: ["id", "color", "imageUrl", "isThumbnail", "sequence"],
        },
        {
          model: ProductVariant,
          as: "variants",
          attributes: ["id", "color", "size", "stock"],
        },
      ],
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (err) {
    console.error("Error fetching product by ID:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getProductByFilter, getProductByProductId };
