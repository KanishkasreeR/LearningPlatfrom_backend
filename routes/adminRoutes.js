const express = require("express");
const router = express.Router();
const { 
    register, 
    login, 
    addCourse, 
    addLesson, 
    updateCourse, 
    updateLesson, 
    deleteCourse, 
    deleteLesson, 
    getAllCourses, 
    getCourseById, 
    getLessonById, 
    getLessonsByCourse 
} = require("../controllers/adminController"); // Adjust path if needed

const auth = require("../middlewares/auth"); // Adjust path if needed

// Authentication Routes
router.post("/register", register);
router.post("/login", login);

// Course Routes
router.post("/addCourse", auth, addCourse);
router.get("/getAllCourses", auth, getAllCourses);
router.get("/getCourse/:id", auth, getCourseById);
router.put("/updateCourse/:id", auth, updateCourse);
router.delete("/deleteCourse/:id", auth, deleteCourse);

// Lesson Routes
router.post("/addLesson", auth, addLesson);
router.get("/getLesson/:id", auth, getLessonById);
router.get("/getLessonsByCourse/:courseId", auth, getLessonsByCourse);
router.put("/updateLesson/:id", auth, updateLesson);
router.delete("/deleteLesson/:id", auth, deleteLesson);

module.exports = router;
