const express = require("express");
const app = express();
app.use(express.json()); // Added middleware to parse JSON bodies

// In memory data module
const { productsJson } = require("./products_mock");

const { products } = productsJson;

let { count, nextId } = productsJson;

// Improved filtering and search functionality
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

// Added endpoint to create a new product
app.post("/products", (req, res) => {
  const { body } = req;

  const newProduct = { ...body, id: nextId };

  nextId++; // Allows auto incremnting ID for new products
  count = products.length;

  products.push(newProduct);

  res.status(201).json(newProduct); // Responds with the 201 Created status
});

app.put("/products/:id", (req, res) => {
  const id = Number(req.params.id);

  const index = products.findIndex((p) => Number(p.id) === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const updatedProduct = {
    id,
    ...req.body,
  };

  products[index] = updatedProduct;

  count = products.length;

  res.status(200).json({
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

app.delete("/products/:id", (req, res, next) => {
  const id = Number(req.params.id);

  const index = products.findIndex((p) => Number(p.id) === id);
  if (index === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const deletedProduct = {
    id,
    ...req.body,
  };

  
  ///
  ///

  res.status(204).json({
    message: "Product deleted succesfully",
    ///product: deletedProduct,
  })
})

app.listen(9000, () => console.log("Server running on port 9000"));
