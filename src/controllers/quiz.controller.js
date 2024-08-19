import { Quiz } from "../models/quiz.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Question } from "../models/question.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Analysis } from "../models/analysis.model.js";

const createQuiz = async (req, res) => {
    const {name, type, questions} = req.body;
    
    const promiseQuestions = []
    questions.forEach(question => {
        promiseQuestions.push(Question.create({
            name: question.name, 
            questiontype: question.type,
            options: question.options,
            correct: question?.correct || undefined
        }))
    });

    await Promise.all(promiseQuestions)

    const promiseAnalysis = []
    promiseQuestions.forEach(question=>{
        promiseAnalysis.push(Analysis.create({question : question._id}))
    });

    
    const questionIds = []
    promiseQuestions.forEach(element => {
        questionIds.push(element._id)
    });
    
    const quiz = await Quiz.create({user:req.user._id, name, quiztype: type, questions:questionIds});

    promiseAnalysis.push(Analysis.create({quiz: quiz._id}))
    await Promise.all(promiseAnalysis)
    
    return res
    .status(200)
    .json(new ApiResponse(
        201,
        quiz,
        "quiz created succcessfully"
    ))
}

const getQuiz = async (req, res) => {
    const {key} = req.query;

    const quiz = await Quiz.findById(key);

    if(!quiz) {
        throw new ApiError(404, "No quiz exists for this particular id");
    }
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        quiz,
        "quiz retreived successfully"
    ))
}

const deleteQuiz = async (req, res) => {
    const {key} = req.params;

    const quiz = await Quiz.findById(key);

    if(!quiz) {
        throw new ApiError(404, "No quiz exists for this particular id");
    }
    else if(quiz.owner != req.user._id) {
        throw new ApiError(403, "Quiz does not belong to the particular user");
    }

    await Quiz.findByIdAndDelete(key);
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "quiz deleted successfully"
    ))
}

const updateQuiz = async (req, res) => {
    const {key} = req.params;
    const data = req.body

    const quiz = await Quiz.findById(key);

    if(!quiz) {
        throw new ApiError(404, "No quiz exists for this particular id");
    }
    else if(quiz.owner != req.user._id) {
        throw new ApiError(403, "Quiz does not belong to the particular user");
    }

    const questions = await Question.find({quiz : quiz._id})
    data.forEach(quest => {
        quest
    });
}

const getTopQuiz = async(req, res) => {

    const topQuizes = await Quiz.aggregate([
        {
            $match: {
                owner: req.user._id
            }
        },
        {
            $lookup: {
                from: "analysis",
                localField: "_id",
                foreignField: "quiz",
                as: "analysis"
            }
        },
        {
            $filter: {
                
            }
        }

    ])

}

const getAllquizImpressions = async(req, res) => {
    const {key} = req.params

    const quiz = Quiz
}