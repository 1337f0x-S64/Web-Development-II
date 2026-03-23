import express from 'express'
import Mongoose, { model, Schema } from 'mongoose'
import MongoStore from 'mongo-connect'
import bcrypt from 'bcrypt'
import jwt from 'express-jwt'
import { SECRET } from process.env

const userSchema = new Schema(
    {
        username: String,
        password: String,
    },{
        timestamps: true
    },
);

Mongoose.connect("mongodb://localhost:27017/jwt")

const User = Mongoose.model("User", userSchema)

const app = express()

app.use(express.json())
app.use(express.urlencoded())

app.use("/api", jwt({ secret: SECRET, algorithms: ["HS256"] }));

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    let user = await User.findOne({username}).exec()

    if(user){
        return res.status(400).json({error: "sorry :c"})
    }

    const hashed = bcrypt.hashSync(password, 10);
    user = User.create({username, password: hashed})
    return res.status(201).json({msg: "All done"})
})

app.post("/login", async (req, res) => {
    const { username, password} = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(404).json({error: "User not found"});
    }

    const pswdMatch = bcrypt.compare(password, user.password);
    if(!pswdMatch) {
        return res.status(404).json({error: "Invalid credentials"});
    }

    req.auth.username = username;

    return res.status(201).json({msg: "Successful login :D"})

})

app.post("logout", (req, res) => {

})

app.listen(9000, () => console.log("HTTP Server running on port 9000"))