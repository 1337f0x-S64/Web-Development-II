const express = require("express");
const fs = require("fs");
const app = express();

app.get("/products", (req, res) => {
 try {
const { products = [] } = JSON.parse(
fs.readFileSync("./products.json", "utf-8"),
);

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

res.json({ count: filtered.length, products: filtered });

} catch (err) {

    console.error(err);

    res.status(500).json({ error: "Could not read products.json" });
 }

});

app.post('/products', (req, res) => {
	const {body} = req
})

app.listen(9000, () => console.log("Server running on port 9000"));