const express = require("express");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  APP_PORT,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  WEATHER_API_KEY,
  WEATHER_API_URI,
} = process.env;
mongoose.connect(
  `mongodb://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`,
);

/**
 * API URI TEMPLATE
 * https://api.openweathermap.org/data/2.5/weather?q=(city name)&appid=(API Key)*/

const tempSchema = new Schema(
  {
    value: Number,
    city: String,
    weather: String,
    weather_description: String,
  },
  {
    timestamps: true,
  },
);
const Temp = mongoose.model("Temp", tempSchema);

const app = express();

async function fetchWeather(cityName) {
  let temp;
  try {
    const resp = await fetch(
      `${WEATHER_API_URI}?q=${cityName}&appid=${WEATHER_API_KEY}`,
    );
    const data = await resp.json();
    temp = data;
  } catch (e) {
    temp = null;
  } finally {
    return temp;
  }
}

app.get("/", async (req, res) => {
  //query the last temperature in the database
  const last = await Temp.find().slice("Temp", -1);
  if (last.length == 1) {
    res.json(last[0]);
    return;
  }

  //if no temp was found, query the temperature in the weather api
  const {
    main: { temp },
    name,
    weather,
  } = await fetchWeather("Managua");
  //then store the temperature in the database and return that info
  last = {
    value: temp,
    city: name,
    weather: weather[0],
    weather_description: weather[0].description,
  };
  await Temp.create(last);
  //if there is a temp make sure it is as old as 15 minutes
  //if it is older than 15 minutes, re-query the temperature in the weather api
  //then return the value
  res.json(last);
});

app.get("/dashboard", (req, res) => {});

app.listen(APP_PORT, () =>
  console.log(`Server is listening at port: ${APP_PORT}`),
);
