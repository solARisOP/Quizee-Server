import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const OptionSchema = new mongoose.Schema({
    image:{
        type: String,
        trim: true
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
    if(this.text == "") {
        return next(new ApiError(400, "text feild of option cannot be empty"));
    }
    if(this.image == "") {
        return next(new ApiError(400, "image feild of option cannot be empty"));
    }
    next();
})

export const Option = mongoose.model('Option', OptionSchema);
