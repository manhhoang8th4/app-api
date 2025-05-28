const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());



// MongoDB connection
const URL = process.env.MONGO_URL || "mongodb://localhost:27017/app-mobile";
mongoose.connect(URL);
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));



app.get("/", (req, res) => {
  res.send("Welcome to the Flutter E-commerce API");
});



// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
