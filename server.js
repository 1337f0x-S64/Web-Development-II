const { Double } = require('bson')
const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/')

const Product = new mongoose.model('Product',{
    name: String,
    category: String,
    subcategory: String,
    price: Double,
    currency: String,
    stock: Number,
    rating: Double
})

const P1 = new Product({

"name":"Vintage Hat 641",
"category":"Apparel",
"subcategory":"Hat",
"price":299.99,
"currency":"USD",
"stock":105,
"rating":4.8,
})

