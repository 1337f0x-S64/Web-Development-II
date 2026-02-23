const fs = require("fs");
const express = require("express");
const app = express();
const { Sequelize, DataTypes, Op } = require("sequelize");
require("dotenv").config();
app.use(express.json()); // parse JSON bodies

// Storage selector
// Choose storage with:
// 1) env var: STORAGE=fs  or STORAGE=db
// 2) per-request override: ?store=fs or ?store=db
const DEFAULT_STORE = (process.env.STORAGE || "fs").toLowerCase();
function getStore(req) {
  const q = (req.query.store || "").toLowerCase().trim();
  return q === "db" || q === "fs" ? q : DEFAULT_STORE;
}

// FILE SYSTEM (fs) helpers
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

// DATABASE (db) setup  (replaced code + small init)
const conn = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  },
);
const Category = conn.define(
  "Category",
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {},
);

const SubCategory = conn.define("SubCategory", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

const Product = conn.define("Product", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  price: {
    type: DataTypes.DOUBLE.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "USD",
  },
  stock: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  rating: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
  },
  subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

SubCategory.belongsTo(Category, { foreignKey: "category_id" });
Product.belongsTo(SubCategory, { foreignKey: "subcategory_id" });

// --- Optional seed helpers from your instructions ---
async function fillInCategories() {
  const { products } = JSON.parse(
    fs.readFileSync("products.json", { encoding: "utf8" }),
  );
  const categories = [...new Set(products.map((p) => p.category))];
  categories.sort();
  for (const category of categories) {
    await Category.create({ name: category });
  }
  await fillInSubcategories(products);
}

async function fillInSubcategories(products) {
  if (products === undefined)
    products = JSON.parse(
      fs.readFileSync("products.json", { encoding: "utf8" }),
    ).products;

  const subcategories = new Map();
  for (const product of products) {
    subcategories.set(product.subcategory, product.category);
  }

  for (const subcategory of subcategories) {
    await SubCategory.create({
      name: subcategory[0],
      category_id: (await Category.findOne({ where: { name: subcategory[1] } }))
        ?.id,
    });
  }
}

async function fillInProducts(products) {
  if (!products) {
    products = JSON.parse(
      fs.readFileSync("products.json", { encoding: "utf8" }),
    ).products;
  }

  for (const p of products) {
    // Ensure category + subcategory exist
    const { subcategory } = await dbEnsureCategoryAndSubcategory(
      (p.category || "").trim(),
      (p.subcategory || "").trim(),
    );

    // Create the product (skip if name already exists)
    const existing = await Product.findOne({ where: { name: p.name } });
    if (existing) continue;

    await Product.create({
      name: (p.name || "").trim(),
      price: p.price ?? 0,
      currency: p.currency ?? "USD",
      stock: p.stock ?? 0,
      rating: p.rating ?? 1,
      subcategory_id: subcategory.id,
    });
  }
}

// DB init: create tables if missing (NO force drop by default)
(async () => {
  try {
    await conn.authenticate();
    await conn.sync(); // creates tables if they don't exist
    console.log("DB connected & synced");
    //Test only: fill into database
    //await conn.sync({ force: true }); // wipes and recreates tables
    //await fillInProducts(); // seeds categories/subcategories/products
  } catch (e) {
    console.error("DB init error:", e.message);
  }
})();

// Shared middleware
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

// FS-only: checks if product exists in products.json
function productExistsFS(req, res, next) {
  const id = Number(req.params.id);
  const { products } = readProductsFile();
  const index = products.findIndex((p) => Number(p.id) === id);

  if (index === -1) return res.redirect("/404");

  req.productId = id;
  req.productIndex = index;
  req.product = products[index];
  next();
}

// DB helper functions
async function dbEnsureCategoryAndSubcategory(categoryName, subcategoryName) {
  // Category
  let category = await Category.findOne({ where: { name: categoryName } });
  if (!category) category = await Category.create({ name: categoryName });

  // SubCategory
  let sub = await SubCategory.findOne({ where: { name: subcategoryName } });
  if (!sub) {
    sub = await SubCategory.create({
      name: subcategoryName,
      category_id: category.id,
    });
  }

  return { category, subcategory: sub };
}

function dbProductToApiShape(productInstance) {
  const p = productInstance;
  const sub = p.SubCategory;
  const cat = sub?.Category;

  return {
    id: p.id,
    name: p.name,
    price: p.price,
    currency: p.currency,
    stock: p.stock,
    rating: p.rating,
    subcategory: sub?.name ?? null,
    category: cat?.name ?? null,
  };
}

// Routes (CRUD + filtering)

app.get("/products", async (req, res) => {
  const store = getStore(req);

  // ---------- File System ----------
  if (store === "fs") {
    const { products } = readProductsFile();

    const category = (req.query.category || "").toLowerCase();
    const subcategory = (req.query.subcategory || "").toLowerCase();
    const search = (req.query.search || "").toLowerCase();

    const filtered = products.filter((p) => {
      if (category && (p.category || "").toLowerCase() !== category)
        return false;
      if (subcategory && (p.subcategory || "").toLowerCase() !== subcategory)
        return false;

      if (search) {
        const text = JSON.stringify(p).toLowerCase();
        if (!text.includes(search)) return false;
      }
      return true;
    });

    return res.json({ store, count: filtered.length, products: filtered });
  }

  // ---------- MySQL Database ----------
  try {
    const category = (req.query.category || "").trim();
    const subcategory = (req.query.subcategory || "").trim();
    const search = (req.query.search || "").trim();

    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };

    const include = [
      {
        model: SubCategory,
        required: !!(category || subcategory),
        ...(subcategory ? { where: { name: subcategory } } : {}),
        include: [
          {
            model: Category,
            required: !!category,
            ...(category ? { where: { name: category } } : {}),
          },
        ],
      },
    ];

    const rows = await Product.findAll({ where, include });
    const products = rows.map(dbProductToApiShape);

    return res.json({ store, count: products.length, products });
  } catch (e) {
    return res.status(500).json({ error: "DB error", details: e.message });
  }
});

app.get("/products/:id", async (req, res) => {
  const store = getStore(req);

  // ---------- File System ----------
  if (store === "fs") {
    return productExistsFS(req, res, () => res.json(req.product));
  }

  // ---------- MySQL Database ----------
  try {
    const id = Number(req.params.id);
    const row = await Product.findByPk(id, {
      include: [{ model: SubCategory, include: [Category] }],
    });
    if (!row) return res.status(404).json({ error: "Product not found" });
    return res.json(dbProductToApiShape(row));
  } catch (e) {
    return res.status(500).json({ error: "DB error", details: e.message });
  }
});

app.post("/products", validateProductPayload, async (req, res) => {
  const store = getStore(req);

  // ---------- File System ----------
  if (store === "fs") {
    const { parsed, products } = readProductsFile();

    const id = computeNextId(products);
    const newProduct = { id, ...req.body };

    products.push(newProduct);
    parsed.products = products;
    writeProductsFile(parsed);

    return res.status(201).json(newProduct);
  }

  // ---------- MySQL Database ----------
  try {
    const body = req.body;

    const { subcategory } = await dbEnsureCategoryAndSubcategory(
      body.category.trim(),
      body.subcategory.trim(),
    );

    const created = await Product.create({
      name: body.name.trim(),
      price: body.price ?? 0,
      currency: body.currency ?? "USD",
      stock: body.stock ?? 0,
      rating: body.rating ?? 1,
      subcategory_id: subcategory.id,
    });

    const full = await Product.findByPk(created.id, {
      include: [{ model: SubCategory, include: [Category] }],
    });

    return res.status(201).json(dbProductToApiShape(full));
  } catch (e) {
    return res.status(500).json({ error: "DB error", details: e.message });
  }
});

app.put("/products/:id", validateProductPayload, async (req, res) => {
  const store = getStore(req);

  // ---------- File System ----------
  if (store === "fs") {
    return productExistsFS(req, res, () => {
      const { parsed, products } = readProductsFile();
      const id = req.productId;

      const index = products.findIndex((p) => Number(p.id) === id);
      const updatedProduct = { id, ...req.body };

      products[index] = updatedProduct;
      parsed.products = products;
      writeProductsFile(parsed);

      return res.status(200).json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    });
  }

  // ---------- MySQL Database ----------
  try {
    const id = Number(req.params.id);
    const body = req.body;

    const row = await Product.findByPk(id);
    if (!row) return res.status(404).json({ error: "Product not found" });

    const { subcategory } = await dbEnsureCategoryAndSubcategory(
      body.category.trim(),
      body.subcategory.trim(),
    );

    await row.update({
      name: body.name.trim(),
      price: body.price ?? row.price,
      currency: body.currency ?? row.currency,
      stock: body.stock ?? row.stock,
      rating: body.rating ?? row.rating,
      subcategory_id: subcategory.id,
    });

    const full = await Product.findByPk(id, {
      include: [{ model: SubCategory, include: [Category] }],
    });

    return res.status(200).json({
      message: "Product updated successfully",
      product: dbProductToApiShape(full),
    });
  } catch (e) {
    return res.status(500).json({ error: "DB error", details: e.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  const store = getStore(req);

  // ---------- File System ----------
  if (store === "fs") {
    return productExistsFS(req, res, () => {
      const { parsed, products } = readProductsFile();
      const id = req.productId;

      const index = products.findIndex((p) => Number(p.id) === id);
      products.splice(index, 1);

      parsed.products = products;
      writeProductsFile(parsed);

      return res.sendStatus(204);
    });
  }

  // ---------- MySQL Database ----------
  try {
    const id = Number(req.params.id);
    const deleted = await Product.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    return res.sendStatus(204);
  } catch (e) {
    return res.status(500).json({ error: "DB error", details: e.message });
  }
});

// Error endpoint for non-existing products
app.get("/404", (req, res) => {
  res.status(404).json({ error: "Product not found" });
});

// Server start
app.listen(process.env.PORT || 9000, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
