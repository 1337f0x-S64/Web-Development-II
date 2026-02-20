const express = require("express")
const mongoose = require("mongoose")
require("dotenv").config()

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
 .then(() => console.log("Database connected"))
 .catch(err => console.log(err));
app.listen(3000, () => console.log("Server running on port 3000"));

const User = require("./models/user");

app.post("/users", async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
        } catch (error) {
        res.status(400).json({ error: error.message });
    }
})

app.get("/users", async (req, res) => {
    const users = await User.find();
    res.json(users);
});

app.get("/users/active", async (req, res) => {
    const activeUsers = await User.find({isActive: true});
    res.json(activeUsers)
});

app.put("/users/:id", async (req, res) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
    );
    res.json(updatedUser);
    } catch (error) {
     res.status(400).json({ error: error.message });
 }
});

app.delete("/users/:id", async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
});