const express = require("express");
const app = express();
const {Sequelize, DataTypes} = require("sequelize")
app.use(express.json()); // Added middleware to parse JSON bodies

const conn = new Sequelize('products_inventory', 'root', '123456', {
  host: 'localhost',
  dialect: 'mysql'
})


const Category = conn.define("Category",{
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
})

const Subcategory = conn.define("Subcategory", {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category_id : {
    type: DataTypes.INTEGER,
    allowNull: false
  }
})

const Product = conn.define("Product",{
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DOUBLE.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "USD"
  },
  stock: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.FLOAT.UNSIGNED,
    allowNull: false,
    defaultValue: 1
  },
  subcategory_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
})

Product.belongsTo(Subcategory, {
  foreignKey:"subcategory_id"
})

Subcategory.belongsTo(Category, {
  foreignKey: "category_id"
})
conn.sync({force:true})

function fillingCategories(){
  /**
   * 1. Retrieving all the catefories from products.json
   * 2. Filtering out only the unique categories
   * 3. Sort categories alphabetically and in ascending order
   * 4. Register the categories in the database
   */
  const {} = JSON.Parse(fs.ReadFileSync("products.json", {encoding: "utf8"}))
  const categories = new Set(products.map(product => product.category))
  console.log(categories)
}

fillingCategories()


/*conn.authenticate().then(() => {
  console.log("Connected")
}).catch(e => console.log(e))
*/

//  const connect = async (callback) => {
//    try{
//      await conn.authenticate()
//      console.log("Connected")
//      callback()
//    }catch(e){
//      console.log(e)
//    }finally{
//      await conn.close()
//       console.log("Connection closed")
//    }
//  }

// connect(() => console.log("We are querying some elements."))

// connect(() => console.log("We are updating other elements."))

// In memory data module
const { productsJson } = require("./products_mock");

const { products } = productsJson;

let { count, nextId } = productsJson;

// Middleware to validate product payload
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

// Middleware to validate a product's existence
function productExists(req, res, next) {
  const id = Number(req.params.id);
  const index = products.findIndex((p) => Number(p.id) === id);

  if (index === -1) return res.redirect("/404");

  req.productIndex = index;
  req.product = products[index];
  req.productId = id;
  next();
}

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

// View a single product using the existence middleware
app.get("/products/:id", productExists, (req, res) => {
  res.json(req.product);
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

// Refactored product update endpoint to use middlewares
app.put("/products/:id", productExists, validateProductPayload, (req, res) => {
  const id = req.productId;

  const updatedProduct = {
    id, // keep id first
    ...req.body,
  };

  products[req.productIndex] = updatedProduct;
  count = products.length;

  res.status(200).json({
    message: "Product updated successfully",
    product: updatedProduct,
  });
});

// Added endpoint to delete a product using existence middleware
app.delete("/products/:id", productExists, (req, res) => {
  products.splice(req.productIndex, 1);
  count = products.length;

  res.sendStatus(204);
});

// Error endpoint for non-existing products
app.get("/404", (req, res) => {
  res.status(404).json({ error: "Product not found" });
});

app.listen(9000, () => console.log("Server running on port 9000"));
