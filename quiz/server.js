const express = require("express")
const mongoose = require("mongoose")
const { Schema } = mongoose;

const { APP_PORT, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, MAX_TEMP_AGE, WEATHER_API_KEY, WEATHER_API_URI} = process.env

mongoose.connect(`monggodb://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`)

const tempSchema = new Schema(
    {
        value: Number,
        city: String,
        weather: String,
        weather_description: String,
    },
    {
        timestamps: true
    }
);

const Temp = mongoose.model('Temp', tempSchema)

async function fetchWeather(cityName) {
    console.log("Server is fetching weather")
    let temp
    try
    {
        const resp = await fetch(`${WEATHER_API_URI}?q=${cityName}&appid=${WEATHER_API_KEY}&units=metric`)
        const data = await resp.json()
        temp = data
    }catch(e){
        temp = null
    }finally{
        return temp
    }
}

const app = express();

app.get("/", (req, res) => {
    
    fetchWeather("Managua")
})

app.get("/dashboard", (req, res) => {})

app.get("", (req, res) => {
    res.status(404).json({err: "404 Not Found"})
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send({err: '500 server error'})
})

app.listen(APP_PORT, () => console.log(`Server is listening at ${APP_PORT}`))