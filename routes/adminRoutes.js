const express = require("express");
const router = express.Router();


const { register,login,addCourse,addLesson } = require("../controllers/adminController"); // adjust path if needed
const  auth  = require("../middlewares/auth"); // adjust path if needed

// Public route: Register a new user
router.post("/register", register);
router.post("/login", login);
router.post('/addCourse', auth, addCourse);
router.post('/addLesson', auth, addLesson);

module.exports = router;
