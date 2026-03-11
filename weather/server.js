const express = require("express")
const mongoose = require("mongoose")
const { Schema } = mongoose
const { APP_PORT, DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, WEATHER_API_URI, WEATHER_API_KEY, MAX_TEMP_AGE } = process.env
mongoose.connect(`mongodb://${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`)
 
 
 
/**
 * API URI TEMPLATE 
 * https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={API key}
 */
const tempSchema = new Schema({
    value: Number,
    city: String,
    weather: String,
    weather_description: String
}, {
    timestamps: true
})
const Temp = mongoose.model("Temp", tempSchema)
 
 
const app = express()
 
 
async function fetchWeather(cityName) {
    console.log("Server is fetching weather")
    let temp
    try {
 
 
        const resp = await fetch(`${WEATHER_API_URI}?q=${cityName}&appid=${WEATHER_API_KEY}&units=metric`)
        const data = await resp.json()
        temp = data
    } catch (e) {
        temp = null
    } finally {
        return temp
    }
}
 
 
/**
 * 
 * @param {Temp} temp Mongoose Object
 * @param {Number} LIMIT miliseconds 
 */
function isTempWithinRange(temp, LIMIT = MAX_TEMP_AGE * 60 * 1000) {
    return (Date.now() - temp.createdAt.getTime()) <= LIMIT
}
 
 
app.get("/", async (req, res, next) => {
 
 
    //query the last temperature in the database
    let lastTemp = await Temp.findOne().sort({ createdAt: 'desc' })
    if (lastTemp && isTempWithinRange(lastTemp)) {
        res.json(lastTemp)
        return
    }
 
 
    //if no temp was found or temperature is out of range, query the temperature in the weather api
    const { main: { temp }, name, weather } = await fetchWeather("Managua")
    //then store the temperature in the database and return that info
    lastTemp = new Temp({ value: temp, city: name, weather: weather[0].main, weather_description: weather[0].description })
    lastTemp.save().then(() => {
        res.json(lastTemp)
    }).catch(e => next(e))
    
})
 
 
app.get("/dashboard", (req, res) => { })
 
 
app.use((req, res, next) => {
    res.status(404)
    res.json({err:"404 Not Found"})
})
 
 
app.use((err, req, res, next)=> {
    console.log(err)
    res.status(500)
    res.json({err: "500 server error"})
})
 
 
app.listen(APP_PORT, () => console.log(`Server is listening at ${APP_PORT}`))