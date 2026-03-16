import express from "express"
import session from "express-session"

const app = express()

app.use(session({
    secret: "hidden_dog",
    resave: false,
    saveUninitialized: true,
    cookie:{
        maxAge: 1000*60*1,
        httpOnly: true,
        secure: false, //this is when HTTPS is enabled
        path: "/",
    }
}))

app.get("/", (req,res) => {
})

app.get("/login", (req, res) => {//this must be post
    if(!req.session.auth) req.session.auth = true
    res.json({loggedIn: req.session.auth})
})

app.get("/logout", (req,res) => {//this must be post
    if(req.session.auth) req.session.auth = false
    res.json({loggedIn: req.session.auth})
})

app.listen(8000, () => console.log("HTTP Server running on port 8000"))