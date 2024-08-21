import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

const QuestionSchema = new mongoose.Schema({
    question:{
        type: String,
        trim: true,
        required: [true, "question cannot be empty"],
    },
    timer:{
        type: Number,
        enum: [0, 5, 10],
        default: 0
    },
    questiontype:{
        type: String,
        enum: ['image', 'text', 'both'],
        required: [true, "options of a question should have a type"],
    },
    options:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Option"
    }],
    correct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Option",
    },
    impression: {
        type: Number,
        default: 0
    }
},{
    timestamps: true
});

QuestionSchema.pre('validate', function(next){
    if(this.options.length<2) {
        return next(new ApiError(400, "atleast two options per question is necessary"));
    }
    if(this.options.length>4) {
        return next(new ApiError(400, "maximum of four options is allowed"));
    }
    next();
})

export const Question = mongoose.model('Question', QuestionSchema);