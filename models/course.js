const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const courseSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    lessons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    }],
  });

  const Course = mongoose.model('Course', courseSchema);
module.exports = Course; 
  