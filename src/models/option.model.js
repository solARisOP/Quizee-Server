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
    impression: {
        type: Number,
        default: 0
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

export const Option = mongoose.model('Question', OptionSchema);
