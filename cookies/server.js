import express from "express"
import cookieParser from "cookie-parser"

const app = express()

app.use(cookieParser("1234564789"))

app.get("/", (req, res) => {
    console.log(`Unsigned cookies: ${JSON.stringify(req.cookies)}`)

    console.log(`Signed cookies: ${JSON.stringify(req.signedCookies)}`)

    res.cookie("_first_cookie", "Hello world for cookies.")
    res.cookie("_signed_cookie", "Hello from signed cookies", {
        maxAge: 1000*60*2,
        signed: true,
        httpOnly: true
    })
    res.clearCookie("_first_cookie")
    res.json({msg: "Cookie information was logged in terminal"})
})

app.listen(9000, () => console.log("Server running on port 9000"))