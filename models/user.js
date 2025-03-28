const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const arrayLimit = (val) => val.length <= 10;

const UserSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile_image: { type: String, default: "" }, // URL from Cloudinary
  faceEmbeddings: {
    type: [[Number]],
    required: false, // Initially, no face embeddings
    validate: [arrayLimit, "Cannot store more than 10 embeddings per person"],
  },
  hasFaceEmbeddings: { type: Boolean, default: false }, // Track if user has embeddings
  role: { type: String, enum: ["student", "tutor"], required: true, default: "student" },
  date_of_birth: { type: Date, default: null },
  gender: { type: String, enum: ["male", "female", "other"], default: "other" },
  attendance: [
    {
      date: { type: Date, required: true },
      status: { type: String, enum: ["present", "absent"], required: true },
    },
  ],
  created_at: { type: Date, default: Date.now },
});

// Middleware to update hasFaceEmbeddings based on faceEmbeddings
UserSchema.pre("save", function (next) {
  this.hasFaceEmbeddings = this.faceEmbeddings && this.faceEmbeddings.length > 0;
  next();
});

module.exports = mongoose.model("User", UserSchema);
