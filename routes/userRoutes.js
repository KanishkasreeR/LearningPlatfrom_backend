const express = require("express");
const router = express.Router();


const { register,login,updateProfile,markAttendance } = require("../controllers/userController"); // adjust path if needed
const  auth  = require("../middlewares/auth"); // adjust path if needed

// Public route: Register a new user
router.post("/register", register);
router.post("/login", login);

router.put("/profile", auth,updateProfile);

// Protected route: Mark attendance (requires authentication middleware)
router.post("/attendance", auth,markAttendance);

module.exports = router;
