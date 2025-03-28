const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
    lesson_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Lesson", // Reference to the Lesson model
        required: true 
    },
    questions: [
        {
            questionText: { type: String, required: true },
            options: [{ type: String, required: true }], // Multiple-choice options
            correctAnswer: { type: String, required: true } // The correct option
        }
    ],
    createdAt: { type: Date, default: Date.now }, // Auto timestamp
});

module.exports = mongoose.model("Quiz", quizSchema);
