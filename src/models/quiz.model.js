import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const QuizSchema = new mongoose.Schema({
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "quiz should belong to a particular user, user cannot be empty"]
    },
    name:{
        type: String,
        trim: true,
        required: [true, "every quiz should contain a name"]
    },
    quiztype:{
        type: String,
        trim: true,
        enum: ['poll', 'q&a'],
        required: [true, "type of a quiz is required to create a quiz"]
    },
    questions:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
    }],
    impression: {
        type: Number,
        default: 0
    }
},{
    timestamps: true
});

QuizSchema.pre('validate', function(next){
    if(!this.questions.length) {
        return next(new ApiError(400, "quiz should contain atleast one question"));
    }
    if(this.questions.length>5) {
        return next(new ApiError(400, "quiz should contain more than five questions"));
    }
    next();
})

export const Quiz = mongoose.model('Quiz', QuizSchema);