require("dotenv").config();
const express = require("express");
const app = express();
const { Sequelize, DataTypes, Op } = require("sequelize");

app.use(express.json());

// Storage selector (fs or db)
const DEFAULT_STORE = (process.env.STORAGE || "fs").toLowerCase();

function getStore(req) {
  const q = (req.query.store || "").toLowerCase().trim();
  return q === "db" || q === "fs" ? q : DEFAULT_STORE;
}

// DATABASE SETUP (using .env values)
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

const Category = conn.define("Category", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

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

// Create tables if missing
(async () => {
  try {
    await conn.authenticate();
    await conn.sync();
    console.log("DB connected & synced");
  } catch (e) {
    console.error("DB init error:", e.message);
  }
})();

// IN-MEMORY DATA (FS version)
const { productsJson } = require("./products_mock.js");
const { products } = productsJson;

let { count, nextId } = productsJson;

// Middleware
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

function productExistsFS(req, res, next) {
  const id = Number(req.params.id);
  const index = products.findIndex((p) => Number(p.id) === id);

  if (index === -1) return res.redirect("/404");

  req.productIndex = index;
  req.product = products[index];
  req.productId = id;
  next();
}

// DB Helpers
async function dbEnsureCategoryAndSubcategory(categoryName, subcategoryName) {
  let category = await Category.findOne({ where: { name: categoryName } });
  if (!category) category = await Category.create({ name: categoryName });

  let sub = await SubCategory.findOne({ where: { name: subcategoryName } });
  if (!sub) {
    sub = await SubCategory.create({
      name: subcategoryName,
      category_id: category.id,
    });
  }

  return { category, subcategory: sub };
}

function dbProductToApiShape(row) {
  const sub = row.SubCategory;
  const cat = sub?.Category;

  return {
    id: row.id,
    name: row.name,
    price: row.price,
    currency: row.currency,
    stock: row.stock,
    rating: row.rating,
    subcategory: sub?.name ?? null,
    category: cat?.name ?? null,
  };
}

// ROUTES

app.get("/products", async (req, res) => {
  const store = getStore(req);

  // ---------- File System ----------
  if (store === "fs") {
    const category = (req.query.category || "").toLowerCase();
    const subcategory = (req.query.subcategory || "").toLowerCase();
    const search = (req.query.search || "").toLowerCase();

    const filtered = products.filter((p) => {
      if (category && (p.category || "").toLowerCase() !== category)
        return false;
      if (subcategory && (p.subcategory || "").toLowerCase() !== subcategory)
        return false;
      if (search && !JSON.stringify(p).toLowerCase().includes(search))
        return false;
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
    const out = rows.map(dbProductToApiShape);

    return res.json({ store, count: out.length, products: out });
  } catch (e) {
    return res.status(500).json({ error: "DB error", details: e.message });
  }
});

app.get("/products/:id", async (req, res) => {
  const store = getStore(req);

  if (store === "fs") {
    return productExistsFS(req, res, () => res.json(req.product));
  }

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

  if (store === "fs") {
    const newProduct = { id: nextId++, ...req.body };
    products.push(newProduct);
    count = products.length;
    return res.status(201).json(newProduct);
  }

  try {
    const { subcategory } = await dbEnsureCategoryAndSubcategory(
      req.body.category.trim(),
      req.body.subcategory.trim(),
    );

    const created = await Product.create({
      name: req.body.name.trim(),
      price: req.body.price ?? 0,
      currency: req.body.currency ?? "USD",
      stock: req.body.stock ?? 0,
      rating: req.body.rating ?? 1,
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

  if (store === "fs") {
    return productExistsFS(req, res, () => {
      const updated = { id: req.productId, ...req.body };
      products[req.productIndex] = updated;
      return res.json({ message: "Updated", product: updated });
    });
  }

  try {
    const row = await Product.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: "Product not found" });

    const { subcategory } = await dbEnsureCategoryAndSubcategory(
      req.body.category.trim(),
      req.body.subcategory.trim(),
    );

    await row.update({
      name: req.body.name.trim(),
      price: req.body.price ?? row.price,
      currency: req.body.currency ?? row.currency,
      stock: req.body.stock ?? row.stock,
      rating: req.body.rating ?? row.rating,
      subcategory_id: subcategory.id,
    });

    return res.json({ message: "Updated successfully" });
  } catch (e) {
    return res.status(500).json({ error: "DB error", details: e.message });
  }
});

app.delete("/products/:id", async (req, res) => {
  const store = getStore(req);

  if (store === "fs") {
    return productExistsFS(req, res, () => {
      products.splice(req.productIndex, 1);
      return res.sendStatus(204);
    });
  }

  try {
    const deleted = await Product.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    return res.sendStatus(204);
  } catch (e) {
    return res.status(500).json({ error: "DB error", details: e.message });
  }
});

// 404
app.get("/404", (req, res) => {
  res.status(404).json({ error: "Product not found" });
});

// Start server using PORT from .env
app.listen(process.env.PORT || 9000, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
