const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/user");

const app = express();
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));
app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`),
);

//Create User
app.post("/users", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Get ALL Users
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

//Get User by ID
app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Get Active Users
app.get("/users/active", async (req, res) => {
  const activeUsers = await User.find({ isActive: true });
  res.json(activeUsers);
});

//Update User
app.put("/users/:id", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Delete User
app.delete("/users/:id", async (req, res) => {
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ message: "User deleted" });
});

//Deactivate User
app.patch("/users/:id/deactivate", async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deactivated", user: updatedUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
