const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = async (req, res, next) => {
  try {
    // Extract token from Authorization header (Bearer <token>)
    const token = req.header('Authorization')?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    // Verify token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded info based on role
    if (decoded.role === 'student') {
      req.user = {
        userId: decoded.userId,  // Assumes payload includes a userId field
        role: decoded.role,
      };
    } else if (decoded.role === 'tutor') {
      req.user = {
        tutorId: decoded.tutorId,  // Assumes payload includes a tutorId field
        role: decoded.role,
      };
    } else {
      return res.status(401).json({ error: "Invalid role" });
    }

    next();
  } catch (error) {
    console.error("Error in auth middleware:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = auth;
