import express from 'express'
import session from 'express-session'
import bcrypt, { hash } from 'bcrypt'
import Mongoose, { Schema } from "mongoose"
import MongoStore from 'connect-mongo'

const userSchema = new Schema({
    username: String,
    password: String,
    
}, {
    timestamps: true
})

const User = Mongoose.model('user', userSchema)

const app = express()

app.use(express.json)
app.use(express.urlencoded())

app.use(session({
    store: MongoStore.create({mongoUrl:"mongodb://localhost:27017/session"}),
    secret: 'una cosa',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 60*1000*5,
        httpOnly: true,
        secure: false
    }
}))

app.post("/login", async (req, res) => {
    const {
        username,
        password 
    } = req.body
    const user = await User.findOne({username: username})
    bcrypt.compareSync(password, user.password)
})

app.post("/register", (req, res) => {
    const {
        username,
        password
    } = req.body;

    const hashed = bcrypt.hashSync(password, 10);
})

app.listen(5000, () => console.log('Server is listening on port 5000'))