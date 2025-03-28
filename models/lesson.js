const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const lessonSchema = new mongoose.Schema({
    _id: { type: String, default: uuidv4 },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    resources: [{
        _id: { type: String, default: uuidv4 },
        type: { type: String, enum: ["video", "pdf", "article", "image", "other"], required: true },
        url: { type: String, required: true }
    }],
    course: { type: String, ref: 'Course', required: true } // Linking lesson to a course
});

const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;
