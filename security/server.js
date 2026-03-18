import express from 'express'
import session from 'express-session'
import bcrypt, { hash } from 'bcrypt'
import Mongoose, { Schema } from "mongoose"
import MongoStore from 'connect-mongo'

const userSchema = new Schema({
    username: String,
    password: String,
}, {timestamps: true})

Mongoose.connect("mongodb://localhost:27017/sessiondb")

const User = Mongoose.model('User', userSchema)

const app = express()

app.use(express.json)
app.use(express.urlencoded())

app.use(session({
    store: MongoStore.create({mongoUrl:"mongodb://localhost:27017/sessiondb"}),
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
    const validPass = bcrypt.compareSync(password, user.password)
    if (!validPass){
        return res.status(404).json({error: "Invalid credentials"})
    }

    req.session.user = {username}
    res.status(201).json(req.sessionStore.user)


})

app.post("/register", async (req, res) => {
    const {
        username,
        password
    } = req.body;
    
    const hashed = bcrypt.hashSync(password, 10);
    await User.create({username: username, password: hashed})
    req.session.user = {username}
    res.status(201).json(req.session.user)
})

app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if(err){
            return res.status(500).json({err: "Sorry"})
        }
    })

    res.status(204).json({msg: "Adios!"})
})

app.listen(5000, () => console.log('Server is listening on port 5000'))