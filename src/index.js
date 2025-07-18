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

  // Static folders
  // app.use("/image/products", express.static("public/products"));
  // app.use("/image/category", express.static("public/category"));
  // app.use("/image/poster", express.static("public/posters"));

  // MongoDB connection
  const URL = process.env.MONGO_URL;
  mongoose.connect(URL);
  const db = mongoose.connection;
  db.on("error", (error) => console.error(error));
  db.once("open", () => console.log("Connected to Database"));

  app.use("/categories", require("./routes/category"));
  app.use("/subCategories", require("./routes/subCategory"));
  app.use("/brands", require("./routes/brand"));
  app.use("/variantTypes", require("./routes/variantType"));
  app.use("/variants", require("./routes/variant"));
  app.use("/products", require("./routes/product"));
  app.use("/couponCodes", require("./routes/couponCode"));
  app.use("/posters", require("./routes/poster"));
  app.use("/users", require("./routes/user"));
  app.use("/orders", require("./routes/order"));
  app.use("/payment", require("./routes/payment"));
  app.use("/notification", require("./routes/notification"));

  app.get("/", (req, res) => {
    res.send("Welcome to the Flutter E-commerce API");
  });

  app.delete(
    "/users/:id",
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      const deletedUser = await User.findByIdAndDelete(id);
      if (deletedUser) {
        res.json({ success: true, message: "User deleted successfully" });
      } else {
        res.status(404).json({ success: false, message: "User not found" });
      }
    })
  );

  // Global error handler
  app.use((error, req, res, next) => {
    res.status(500).json({ success: false, message: error.message, data: null });
  });

  // Start server
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
