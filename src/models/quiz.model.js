import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [400, "quiz should belong to a particular user"]
    },
    quiztype:{
        type: String,
        enum: ['poll', 'q&a'],
    },
    questions:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
        required: [true, "Quiz should contain questions"]
    }]
},{
    timestamps: true
});

QuizSchema.pre('validate', function(next){
    if(!this.questions.length) {
        return next(new ApiError(400, "atleast two questions per quiz is necessary"));
    }
    if(this.questions.length>5) {
        return next(new ApiError(400, "maximum of five questions are allowed"));
    } 
    next();
})

export const Quiz = mongoose.model('Quiz', QuizSchema);