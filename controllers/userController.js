const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const User = require("../models/user");

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const emailRegex = /^\S+@\S+\.\S+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const register = async (req, res) => {
    try {
        const { name, email, password, role, date_of_birth = null, gender = "other" } = req.body;

        // Check if required fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ msg: "Name, email, and password are required." });
        }

        // Validate email format
        if (!emailRegex.test(email)) {
            return res.status(400).json({ msg: "Invalid email format." });
        }

        // Validate password format
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                msg: "Password must be at least 8 characters long, include 1 uppercase letter, 1 lowercase letter, 1 digit, and 1 special character."
            });
        }

        // Check if email already exists
        if (await User.findOne({ email })) {
            return res.status(400).json({ msg: "Email already registered." });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user with default values
        const newUser = new User({
            _id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            profile_image: "",
            faceEmbeddings: [], // Empty initially
            hasFaceEmbeddings: false, // No embeddings at registration
            role,
            date_of_birth,
            gender,
            attendance: []
        });

        await newUser.save();
        res.status(201).json({ msg: "User registered successfully." });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ msg: "Internal Server Error" });
    }
};

  
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required." });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ msg: "Invalid email format." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ msg: "Invalid password." });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });

    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  // Multer Configuration (Stores images locally before uploading to Cloudinary)
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/"); 
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname); 
    },
  });
  
  // Multer Middleware for Handling File Uploads
  const upload = multer({ storage: storage }).fields([
    { name: "image", maxCount: 1 }, 
    { name: "faceEmbeddings" },
  ]);
  
  const updateProfile = async (req, res) => {
    try {
      upload(req, res, async function (err) {
        if (err) {
            console.log(err);
          return res.status(400).json({ msg: "Error uploading files." });
        }
  
        const userId = req.user.userId;
        const user = await User.findById(userId);
  
        if (!user) {
          return res.status(404).json({ msg: "User not found." });
        }
  
        const { name, date_of_birth, gender} = req.body;
        let faceEmbeddings = req.body.faceEmbeddings ? JSON.parse(req.body.faceEmbeddings) : [];
        let profile_image = user.profile_image;
  
        // Upload Image to Cloudinary
        if (req.files && req.files.image) {
          const imageFile = req.files.image[0].path;
  
          const uploadedImage = await cloudinary.uploader.upload(imageFile, {
            folder: "profile_images",
          });
  
          profile_image = uploadedImage.secure_url;
        }
  
        // Validate Face Embeddings
        if (!Array.isArray(faceEmbeddings) || faceEmbeddings.length > 10) {
          return res.status(400).json({ msg: "Face embeddings must be an array with 1-10 values." });
        }
  
        // Update User Details
        user.name = name || user.name;
        user.date_of_birth = date_of_birth || user.date_of_birth;
        user.gender = gender || user.gender;
        user.profile_image = profile_image;
        user.faceEmbeddings = faceEmbeddings;
        user.hasFaceEmbeddings = faceEmbeddings.length > 0;
  
        await user.save();
  
        res.status(200).json({ msg: "Profile updated successfully.", user });
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ msg: "Internal Server Error" });
    }
  };

  const normalize = (vector) => {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return norm === 0 ? vector : vector.map((val) => val / norm);
  };
  
  // Face matching function
  const isMatch = (inputEmbeddings, storedEmbeddings, threshold = 1.0) => {
    return inputEmbeddings.some((inputEmbedding) => {
      const normalizedInput = normalize(inputEmbedding);
      return storedEmbeddings.some((storedEmbedding) => {
        const normalizedStored = normalize(storedEmbedding);
        const distance = Math.sqrt(
          normalizedInput.reduce((sum, val, i) => sum + Math.pow(val - normalizedStored[i], 2), 0)
        );
        console.log(`Distance: ${distance}`);
        return distance < threshold;
      });
    });
  };
  
  const markAttendance = async (req, res) => {
    try {
      // Assume req.user is populated (e.g., via authentication middleware)
      const userId = req.user._id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: "User not found." });
      }
  
      // Ensure the user has registered face embeddings
      if (!user.hasFaceEmbeddings || !user.faceEmbeddings || user.faceEmbeddings.length === 0) {
        return res.status(400).json({ msg: "User has no registered face embeddings." });
      }
  
      // Parse the input embeddings from the request body.
      // The embeddings should be sent as a JSON string, e.g., '[ [0.1, 0.2, ...], [0.3, 0.4, ...] ]'
      let inputEmbeddings;
      try {
        inputEmbeddings = JSON.parse(req.body.embeddings);
        if (!Array.isArray(inputEmbeddings) || inputEmbeddings.length === 0) {
          return res.status(400).json({ msg: "Input face embeddings are required." });
        }
      } catch (err) {
        return res.status(400).json({ msg: "Invalid face embeddings format." });
      }
  
      // Use the isMatch function to verify that at least one embedding matches
      const matchFound = isMatch(inputEmbeddings, user.faceEmbeddings);
      if (!matchFound) {
        return res.status(401).json({ msg: "Face not recognized. Attendance not marked." });
      }
  
      // Check if attendance for today has already been marked.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const attendanceToday = user.attendance.find((record) => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });
      if (attendanceToday) {
        return res.status(400).json({ msg: "Attendance already marked for today." });
      }
  
      // Mark attendance (set status to "present")
      user.attendance.push({ date: new Date(), status: "present" });
      await user.save();
  
      res.status(200).json({ msg: "Attendance marked successfully." });
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ msg: "Internal Server Error" });
    }
  };  

module.exports = { register, login,updateProfile,markAttendance};
