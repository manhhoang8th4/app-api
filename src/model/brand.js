const mongoose = require("mongoose");
const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      unique: true,
    },
    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: [true, "Subcategory ID is required"],
    },
  },
  { timestamps: true }
);
const Brand = mongoose.model("Brand", brandSchema);
module.exports = Brand;
