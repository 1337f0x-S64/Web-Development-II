// Source - https://stackoverflow.com/a/43171719
// Posted by phihag
// Retrieved 2026-02-11, License - CC BY-SA 3.0

const fs = require("fs");
const express = require("express");
const app = express();
const { Sequelize, DataTypes } = require("sequelize");

app.use(express.json()); // parse JSON bodies

// -------------------------
// Sequelize / MySQL setup
// -------------------------
const conn = new Sequelize("products_inventory", "root", "12345678", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

const Category = conn.define("Category", {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
});

const Subcategory = conn.define("Subcategory", {
  name: { type: DataTypes.STRING, allowNull: false },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
});

const Product = conn.define("Product", {
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.DOUBLE.UNSIGNED, allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: "USD" },
  stock: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  rating: { type: DataTypes.FLOAT.UNSIGNED, allowNull: false, defaultValue: 1 },
  subcategory_id: { type: DataTypes.INTEGER, allowNull: false },
});

Product.belongsTo(Subcategory, { foreignKey: "subcategory_id" });
Subcategory.belongsTo(Category, { foreignKey: "category_id" });

// -------------------------
// DB sync (separate, placed right after DB connections/models)
// -------------------------
const PRODUCTS_FILE = "./products.json";

function readProductsFile() {
  const raw = fs.readFileSync(PRODUCTS_FILE, { encoding: "utf8" });
  const parsed = JSON.parse(raw);
  const list = parsed.products || [];
  return { parsed, products: list };
}

function writeProductsFile(parsed) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(parsed, null, 2), {
    encoding: "utf8",
  });
}

function computeNextId(products) {
  const maxId = products.reduce(
    (max, p) => Math.max(max, Number(p.id) || 0),
    0,
  );
  return maxId + 1;
}

async function fillingCategories() {
  const { products: fileProducts } = readProductsFile();

  const categories = Array.from(
    new Set(
      fileProducts
        .map((p) => (p.category ?? "").toString().trim())
        .filter((c) => c.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  if (categories.length === 0) {
    console.log("No categories found in products.json to seed.");
    return;
  }

  await Category.bulkCreate(
    categories.map((name) => ({ name })),
    {
      ignoreDuplicates: true,
    },
  );

  console.log(`Seeded categories: ${categories.length}`);
}

(async () => {
  try {
    await conn.authenticate();
    console.log("DB connected");

    // WARNING: force:true drops and recreates tables every run.
    await conn.sync({ force: true });
    console.log("DB synced");

    await fillingCategories();
  } catch (e) {
    console.error("DB init error:", e);
  }
})();

// -------------------------
// Middlewares
// -------------------------
function validateProductPayload(req, res, next) {
  const body = req.body || {};
  const requiredFields = ["name", "category", "subcategory"];

  const missing = requiredFields.filter((f) => {
    const v = body[f];
    return typeof v !== "string" || v.trim() === "";
  });

  if (missing.length > 0) {
    return res.status(400).json({
      error: "Invalid payload",
      missingFields: missing,
    });
  }

  next();
}

function productExists(req, res, next) {
  const id = Number(req.params.id);
  const { products } = readProductsFile();
  const index = products.findIndex((p) => Number(p.id) === id);

  if (index === -1) return res.redirect("/404");

  req.productId = id;
  req.productIndex = index;
  req.product = products[index];
  next();
}

// -------------------------
// Routes (CRUD + filtering)
// -------------------------
app.get("/products", (req, res) => {
  const { products } = readProductsFile();

  const category = (req.query.category || "").toLowerCase();
  const subcategory = (req.query.subcategory || "").toLowerCase();
  const search = (req.query.search || "").toLowerCase();

  const filtered = products.filter((p) => {
    if (category && (p.category || "").toLowerCase() !== category) return false;
    if (subcategory && (p.subcategory || "").toLowerCase() !== subcategory)
      return false;

    if (search) {
      const text = JSON.stringify(p).toLowerCase();
      if (!text.includes(search)) return false;
    }
    return true;
  });

  res.json({ count: filtered.length, products: filtered });
});

app.get("/products/:id", productExists, (req, res) => {
  res.json(req.product);
});

app.post("/products", validateProductPayload, (req, res) => {
  const { parsed, products } = readProductsFile();

  const id = computeNextId(products);
  const newProduct = { ...req.body, id };

  products.push(newProduct);
  parsed.products = products;
  writeProductsFile(parsed);

  res.status(201).json(newProduct);
});

app.put("/products/:id", productExists, validateProductPayload, (req, res) => {
  const { parsed, products } = readProductsFile();
  const id = req.productId;

  const index = products.findIndex((p) => Number(p.id) === id);
  const updatedProduct = {
    id, // keep id first
    ...req.body,
  };

  products[index] = updatedProduct;
  parsed.products = products;
  writeProductsFile(parsed);

  res.status(200).json({
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

app.delete("/products/:id", productExists, (req, res) => {
  const { parsed, products } = readProductsFile();
  const id = req.productId;

  const index = products.findIndex((p) => Number(p.id) === id);
  products.splice(index, 1);

  parsed.products = products;
  writeProductsFile(parsed);

  res.sendStatus(204);
});

// Error endpoint for non-existing products
app.get("/404", (req, res) => {
  res.status(404).json({ error: "Product not found" });
});

// -------------------------
// Server start (separate, placed after /404)
// -------------------------
app.listen(9000, () => console.log("Server running on port 9000 (FILE CRUD)"));
