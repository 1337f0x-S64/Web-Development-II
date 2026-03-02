const express = require("express");
const mongoose = require("mongoose");
const { schema } = mongoose;
const { DATABASE_HOST, DATABASE_PORT, DATABASE_NAME } = process.env;
mongoose.connect(
  `mongodb://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`,
);

const tempSchema = new schema(
  {
    value: Number,
    city: String,
    country: String,
    weather: String,
    weather_description: String,
  },
  {
    timestamps: true,
  },
);
const Temp = (mongoose = model("Temp", tempSchema));

const app = express();

app.get("/", (req, res) => {
  //query the last temperature in the database
  //if no temp was found, query the temperature in the weather api
  //then store the temperature in the database and return that info
  //if there is a temp make sure it is as old as 15 minutes
  //if it is older than 15 minutes, re-query the temperature in the weather api
  //then return the value
  res.json(temp);
});

app.get("/dashboard", (req, res) => {});
