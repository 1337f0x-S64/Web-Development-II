const express = require("express");
const app = express();
app.use(express.json());

const { productsJson } = require("./products_mock");

const { products } = productsJson;

let { count, nextId } = productsJson;

app.get("/products", (req, res) => {
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

app.post("/products", (req, res) => {
  const { body } = req;

  const newProduct = { id: nextId, ...body };

  nextId++;
  count = products.length;

  products.push(newProduct);

  res.status(201).json(newProduct);
});

  app.put("/products/id", (req, res) => {
    //
    //
    //

    res.status(200).json();
  })

app.listen(9000, () => console.log("Server running on port 9000"));
