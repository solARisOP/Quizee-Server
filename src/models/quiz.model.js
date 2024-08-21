import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [400, "quiz should belong to a particular user, user cannot be empty"]
    },
    name:{
        type: String,
        trim: true,
        required: [400, "every quiz should contain a name"]
    },
    quiztype:{
        type: String,
        enum: ['poll', 'q&a'],
        required: [400, "type of a quiz is required to create a quiz"]
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