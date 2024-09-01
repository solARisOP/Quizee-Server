import { Quiz } from "../models/quiz.model.js"
import { Question } from "../models/question.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"
import { Option } from "../models/option.model.js"

const getTopQuizes = async (req, res) => {

    const trendingQuizes = await Quiz.find({ impression: { $gt: 10 }, owner: req.user._id }).select("-quiztype -owner -questions");

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            trendingQuizes,
            "dashboard data fetched successfully"
        ))
}

const getAllquizes = async (req, res) => {

    const quizes = await Quiz.find({ owner: req.user._id }).select("-quiztype -owner");

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            quizes,
            "All quizes fetched successfully"
        ))
}

const getQuizAnalysis = async (req, res) => {
    const { key } = req.query

    const quiz = await Quiz.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(key)
            }
        },
        {
            $lookup: {
                from: "questions",
                localField: "questions",
                foreignField: "_id",
                let: { quizType: "$quiztype" },
                pipeline: [
                    {
                        $lookup: {
                            from: "options",
                            localField: "options",
                            foreignField: "_id",
                            as: "relatedOptions"
                        }
                    },
                    {
                        $lookup: {
                            from: "options",
                            localField: "correct",
                            foreignField: "_id",
                            as: "correctRelatedOption"
                        }
                    },
                    {
                        $addFields: {
                            correctOption: {
                                $cond: [{ $eq: ["$$quizType", "q&a"] }, { $first: "$correctRelatedOption" }, "$$REMOVE"]
                            }
                        }
                    },
                    {
                        $addFields: {
                            correctimpressions: {
                                $cond: [{ $eq: ["$$quizType", "q&a"] }, "$correctOption.impression", "$$REMOVE"]
                            },
                            incorrectimpressions: {
                                $cond: [{ $eq: ["$$quizType", "q&a"] }, { $subtract: ["$impression", "$correctOption.impression"] }, "$$REMOVE"]
                            },
                            relatedOptions: {
                                $cond: [{ $eq: ["$$quizType", "poll"] }, "$relatedOptions", "$$REMOVE"]
                            }
                        }
                    },
                    {
                        $project: {
                            timer: 0,
                            questiontype: 0,
                            options: 0,
                            correct: 0,
                            correctOption: 0,
                            correctRelatedOption: 0
                        }
                    }
                ],
                as: "relatedQuestions"
            }
        },
        {
            $project: {
                questions: 0,
            }
        }
    ])

    if (!quiz.length) {
        throw new ApiError(404, "quiz does not exists")
    }
    else if (!quiz[0].owner.equals(req.user._id)) {
        throw new ApiError(403, "quiz does not belong to the particular user")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            quiz[0],
            "fetched quiz analysis successfully"
        ))
}

const calculateScore_AddImpression = async (req, res) => {
    const questions = req.body?.questions || req.body
    const { key } = req.params  

    var promise = []
    promise.push(Quiz.findByIdAndUpdate(
        key,
        {
            $inc: { impression: 1 }
        }
    ))

    let correctCount = 0;

    for (const question of questions) {
        promise.push(Question.findByIdAndUpdate(
            question.id,
            {
                $inc: { impression: 1 }
            }
        ))
        const retrievedQuestion = await Question.findById(question.id)
        if (question.optionId) {
            promise.push(Option.findByIdAndUpdate(
                question.optionId,
                {
                    $inc: { impression: 1 }
                }
            ))
            if (retrievedQuestion?.correct == question.optionId) correctCount++;
        }
    }

    await Promise.all(promise)

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { score: correctCount },
            "score calculated sucessfully"
        ))
}

export {
    getTopQuizes,
    getAllquizes,
    getQuizAnalysis,
    calculateScore_AddImpression
}

