const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const userRoutes = require("./routes/userRoutes");
app.use("/user", userRoutes);

mongoose
  .connect('mongodb+srv://kanishka:poorani05@cluster05.pgwmpx4.mongodb.net/LearningPlatform?retryWrites=true&w=majority&appName=Cluster05', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));


app.listen(8000, () => {
  console.log('Server running on port 8000');
});
