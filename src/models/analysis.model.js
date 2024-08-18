import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

const AnalysisSchema = new mongoose.Schema({
    question:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
    },
    quiz:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz"
    },
    impressions:{
        type: Number,
        default: 0
    },
    correct:{
        type: Number,
        default: 0
    },
    incorrect:{
        type: Number,
        default: 0
    }
})

AnalysisSchema.pre('validate', function(next) {
    if(this.question && this.quiz) {
        return next(new ApiError("Invalid congiguration, analysis object cannot have both question and quiz"))
    }
    if(this.question && this.impressions != this.correct + this.incorrect) {
        return next(new ApiError("Invalid congiguration, impressions should be equal to sum of correct and incorrect responses for each question"))
    }
    if(this.quiz && (this.correct || this.incorrect)) {
        return next(new ApiError("Invalid congiguration, quiz cannot contain correct and incorrect impressions"))
    }
    next();
})

export const Analysis = mongoose.model('Analysis', AnalysisSchema);