const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
dotenv.config();
const Admin = require('../models/admin');
const Course = require('../models/course');
const Lesson = require('../models/lesson');
const mongoose = require("mongoose");



const register = async (req, res) => {
    const { email, password } = req.body;
  
    // Check if email or password is missing
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
  
    // Email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }
  
    // Password validation: at least 6 characters, including one uppercase letter, one lowercase letter, and one number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long and include at least one uppercase letter, one lowercase letter, and one number.',
      });
    }
  
    try {
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin with this email already exists.' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newAdmin = new Admin({
        _id: uuidv4(),
        email,
        password: hashedPassword,
      });
  
      await newAdmin.save();
      res.status(201).json({ message: 'Admin registered successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
  };

  const login = async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
  
    try {
      const admin = await Admin.findOne({ email });
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }
  
      const token = jwt.sign({ adminId: admin.adminId, role: "admin" }, process.env.JWT_SECRET, {
        expiresIn: '24h',
    });
  
      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ message: 'Server error.', error: error.message });
    }
  };


  const addCourse = async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
    }

    try {
        const existingCourse = await Course.findOne({ title });
        if (existingCourse) {
            return res.status(400).json({ message: 'Course with this title already exists.' });
        }

        const newCourse = new Course({
            _id: uuidv4(),
            title,
            description,
            lessons: []
        });

        console.log(req.user.role);
        await newCourse.save();
        res.status(201).json({ message: 'Course added successfully.', course: newCourse });
    } catch (error) {
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");

// ✅ Multer Storage Configuration (for PDFs only)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save PDFs to "uploads" folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

// ✅ File Filter: Allow only PDFs
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

// ✅ Multer Upload Instance
const upload = multer({ storage, fileFilter }).single("pdf"); // "pdf" is the field name

// ✅ Add Lesson (Handles both PDF Upload & Video URL)
const addLesson = async (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ message: "File upload error.", error: err.message });
        }

        try {
            const { courseId, title, description, videoUrl } = req.body;

            if (!courseId || !title) {
                return res.status(400).json({ message: "Course ID and title are required." });
            }

            const course = await Course.findById(courseId);
            if (!course) {
                return res.status(404).json({ message: "Course not found." });
            }

            // Prepare lesson resources
            const resources = [];
            if (videoUrl) {
                resources.push({ _id: uuidv4(), type: "video", url: videoUrl });
            }
            if (req.file) {
                resources.push({ _id: uuidv4(), type: "pdf", url: `/uploads/${req.file.filename}` });
            }

            // ✅ Use ObjectId for lesson ID
            const newLesson = new Lesson({
                _id: new mongoose.Types.ObjectId(),
                title,
                description,
                resources,
                course: courseId
            });

            await newLesson.save();

            // ✅ Ensure MongoDB gets ObjectId
            course.lessons.push(newLesson._id);
            await course.save();

            res.status(201).json({ message: "Lesson added successfully.", lesson: newLesson });
        } catch (error) {
            res.status(500).json({ message: "Server error.", error: error.message });
        }
    });
};


module.exports = {register,login, addCourse, addLesson};

  
  
