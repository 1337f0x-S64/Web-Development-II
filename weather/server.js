const express = require("express");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  APP_PORT,
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  WEATHER_API_URI,
  WEATHER_API_KEY,
  MAX_TEMP_AGE,
} = process.env;
mongoose.connect(
  `mongodb://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`,
);

/**
 * API URI TEMPLATE
 * https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={API key}
 */
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
  console.log("Server is fetching weather");
  let temp;
  try {
    const resp = await fetch(
      `${WEATHER_API_URI}?q=${cityName}&appid=${WEATHER_API_KEY}&units=metric`,
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
  let last = await Temp.findOne().sort({ createdAt: "desc" });
  if (last) {
    if (Date.now() - last.createdAt.getTime() <= MAX_TEMP_AGE * 60 * 1000) {
      res.json(last);
      return;
    }
    const {
      main: { temp },
      name,
      weather,
    } = await fetchWeather("Managua");
    last = {
      value: temp,
      city: name,
      weather: weather[0].main,
      weather_description: weather[0].description,
      createdAt,
      updatedAt,
    };
    await Temp.create(last);
  } else {
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
      weather: weather[0].main,
      weather_description: weather[0].description,
      createdAt,
      updatedAt,
    };
    await Temp.create(last);
  }
  //if there is a temp make sure it is as old as 15 minutes
  //if it is older then 15 minutes, re-query the temperature in the weather api
  //then return the value
  res.json(last);
});

app.get("/dashboard", (req, res) => {});

app.listen(APP_PORT, () => console.log(`Server is listening at ${APP_PORT}`));
