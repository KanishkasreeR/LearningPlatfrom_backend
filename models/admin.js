const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const adminSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    email: { type: String, required: true, unique: true },  
    password: { type: String, required: true },
    courses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    }], 
    role: { type: String, default: "admin" },  // ✅ Fixed role definition
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;
