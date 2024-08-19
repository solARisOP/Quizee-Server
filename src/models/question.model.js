import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

const OptionSchema = new mongoose.Schema({
    image:{
        type: String,
    },
    text:{
        type: String,
        trim: true
    },
},{
    timestamps: true
});

const QuestionSchema = new mongoose.Schema({
    quiz:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
        required: [true, "every question should belong to a particular quiz, quiz cannot be empty"],
    },
    question:{
        type: String,
        required: [true, "question is cannot be empty"],
        trim: true
    },
    timer:{
        type: Number,
        enum: [0, 5, 10],
        default: 0
    },
    questiontype:{
        type: String,
        enum: ['image', 'text', 'both'],
        required: true
    },
    options:[OptionSchema],
    correct: {
        type: Number,
    }
},{
    timestamps: true
});

OptionSchema.pre('validate', function(next){
    const arr = [this.image, this.text].filter(feild => feild != null)
    if(!arr.length) {
        return next(new ApiError(400, "atleast one of the option feilds required for options"));
    } 
    next();
})

QuestionSchema.pre('validate', function(next){
    if(this.options.length<2) {
        return next(new ApiError(400, "atleast two options per question is necessary"));
    }
    if(this.options.length>4) {
        return next(new ApiError(400, "maximum of four options is allowed"));
    }
    if(this.questiontype == 'both' && !this.options.every(feild => feild.image && feild.text)) {
        return next(new ApiError(400, "both text and image are required"));
    }
    next();
})

export const Question = mongoose.model('Question', QuestionSchema);