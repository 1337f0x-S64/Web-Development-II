import express from "express";
import mongoose from "mongoose";
import { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { expressjwt } from "express-jwt";
import "dotenv/config.js";
import jwt from "jsonwebtoken";

mongoose.connect("mongodb://127.0.0.1:27017/jwt");

const userSchema = new Schema(
  {
    username: String,
    password: String,
  },
  {
    timestamps: true,
  },
);

const tokenSchema = new Schema(
  {
    token: String,
    blackListed: Boolean,
  },
  { timestamps: true },
);

const Token = mongoose.model("Token", tokenSchema);

const User = mongoose.model("User", userSchema);

const app = express();
app.use(express.json());
app.use(express.urlencoded());

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  let user = await User.findOne({ username }).exec();

  if (user) {
    return res.status(400).json({ error: "sorry :c" });
  }
  const hashed = bcrypt.hashSync(password, 10);
  user = await User.create({ username, password: hashed });

  const payload = {
    username,
  };
  const token = jwt.sign(payload, process.env.SECRET, { expiresIn: 120 });
  await Token.create({ token, blackListed: false });

  res.set("Token", token);

  return res.status(201).json({
    message: "all done :)",
    token,
  });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  const pswdMatch = bcrypt.compare(password, user.password);
  if (!pswdMatch) {
    return res.status(404).json({
      error: "Invalid credentials",
    });
  }
  const payload = { username };
  const token = jwt.sign(payload, process.env.SECRET, { expiresIn: 120 });

  await Token.create({ token, blackListed: false });

  return res.status(201).json({
    message: "Successfull login",
    token,
  });
});

app.get(
  "/account",
  expressjwt({ secret: process.env.SECRET, algorithms: ["HS256"] }),
  (req, res) => {},
);

app.post(
  "/logout",
  expressjwt({ secret: process.env.SECRET, algorithms: ["HS256"] }),
  async (req, res) => {
    //req.headers.authorizations: Bearer fjaufhjuiorhfojfhjkdf
    const token = req.headers.authorization.split(" ")[1];
    const dbToken = await Token.findOne({ token }).exec();

    if (dbToken.blackListed) {
      return res.status(400).json({ err: "Invalid token!" });
    }

    await Token.updateOne({ token }, { blackListed: true });

    res.status(204).json({
      message: "Successful Logout and Token Eliminate!",
    });
  },
);

app.listen(9000, () => console.log("Listening......."));
