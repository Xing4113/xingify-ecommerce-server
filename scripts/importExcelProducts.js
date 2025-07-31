const xlsx = require("xlsx");
const path = require("path");
const sequelize = require("../config/db");
const { Product, ProductImage, ProductVariant } = require("../models");

(async () => {
  try {
    await sequelize.sync();

    const filePath = path.join(__dirname, "/Product.xlsx");
    const workbook = xlsx.readFile(filePath);

    // ---------------------
    // 1. IMPORT PRODUCTS
    // ---------------------
    const productRows = xlsx.utils.sheet_to_json(workbook.Sheets["Product"]);
    const products = productRows.map((row) => ({
      name: row.name,
      brand: row.brand,
      category: row.category,
      style: row.style,
      description: row.description || "",
      price: parseFloat(row.price),
      size: JSON.parse(row.size),
      color: row.color ? JSON.parse(row.color) : null,
      imageUrl: row.imageUrl || null,
      is_new_arrive: row.is_new_arrive === true || row.is_new_arrive === "true",
      isActive: row.isActive === true || row.isActive === "true",
    }));

    const insertedProducts = await Product.bulkCreate(products);

    // ---------------------
    // 2. IMPORT PRODUCT IMAGES
    // ---------------------
    const imageRows = xlsx.utils.sheet_to_json(workbook.Sheets["ProductImage"]);
    const productImages = imageRows.map((row) => ({
      productId: parseInt(row.productId),
      color: row.color,
      imageUrl: row.imageUrl,
      isThumbnail: row.isThumbnail === true || row.isThumbnail === "true",
      sequence: parseInt(row.sequence),
    }));

    await ProductImage.bulkCreate(productImages);
    console.log(`✅ Inserted ${productImages.length} product images`);

    // ---------------------
    // 3. IMPORT PRODUCT VARIANTS
    // ---------------------
    const variantRows = xlsx.utils.sheet_to_json(
      workbook.Sheets["ProductVariant"]
    );
    const productVariants = variantRows.map((row) => ({
      productId: parseInt(row.productId),
      color: row.color,
      size: row.size,
      stock: parseInt(row.stock),
    }));

    await ProductVariant.bulkCreate(productVariants);
    console.log(`✅ Inserted ${productVariants.length} product variants`);

    console.log("🎉 All data imported successfully!");
  } catch (err) {
    console.error("❌ Error during import:", err);
  } finally {
    await sequelize.close();
  }
})();
