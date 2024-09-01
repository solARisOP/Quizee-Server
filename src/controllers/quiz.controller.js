import { Quiz } from "../models/quiz.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Question } from "../models/question.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Option } from "../models/option.model.js";
import mongoose from "mongoose";
import { validateData, validateUpdationData } from "../validators/data.validator.js";

const createQuiz = async (req, res) => {

    const { name, type, questions } = req.body;
    validateData(name, type, questions)

    const promiseQuestions = []
    for (const question of questions) {
        const promiseOptions = []

        for (const option of question.options) promiseOptions.push(Option.create(option))

        const newOptions = await Promise.all(promiseOptions)

        promiseQuestions.push(Question.create({
            question: question.question,
            timer: question.timer ? question.timer : 0,
            questiontype: question.type,
            options: newOptions.map(element => element._id),
            correct: type == 'q&a' ? newOptions[question.correct]._id : undefined
        }))
    }

    const newQuestions = await Promise.all(promiseQuestions);

    const quiz = await Quiz.create({ owner: req.user._id, name, quiztype: type, questions: newQuestions.map(element => element._id) });

    return res
        .status(200)
        .json(new ApiResponse(
            201,
            quiz,
            "quiz created succcessfully"
        ))
}

const getQuiz = async (req, res) => {
    const { key } = req.query;

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
                pipeline: [
                    {
                        $lookup: {
                            from: "options",
                            localField: "options",
                            foreignField: "_id",
                            pipeline: [
                                {
                                    $project: {
                                        impressions: 0
                                    }
                                }
                            ],
                            as: "relatedOptions"
                        }
                    },
                    {
                        $project: {
                            impressions: 0,
                            options: 0
                        }
                    }
                ],
                as: "relatedQuestions"
            }
        },
        {
            $project: {
                owner: 0,
                impressions: 0,
                questions: 0
            }
        }
    ])

    if (!quiz.length) {
        throw new ApiError(404, "quiz does not exists")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            quiz[0],
            "quiz retreived successfully"
        ))
}

const deleteQuiz = async (req, res) => {
    const { key } = req.params;
    
    const quiz = await Quiz.findById(key);

    if (!quiz) {
        throw new ApiError(404, "No quiz exists for this particular id");
    }
    else if (!quiz.owner.equals(req.user._id)) {
        throw new ApiError(403, "Quiz does not belong to the particular user");
    }

    for (const qId of quiz.questions) {
        const question = await Question.findByIdAndDelete(qId);

        const optionPromises = [];
        for (const oId of question.options) optionPromises.push(Option.findByIdAndDelete(oId));

        await Promise.all(optionPromises)
    }

    await Quiz.findByIdAndDelete(quiz._id)

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "quiz deleted successfully"
        ))
}

const updateQuiz = async (req, res) => {
    const { key } = req.params;
    const data = req.body

    await validateUpdationData(req, key, data)

    const promise = [];
    for (const Id in data.questions) {

        const question = await Question.findById(Id);
        if (data.questions[Id].timer) {
            question.timer = data.questions[Id].timer;
        }
        promise.push(question.save());
    }

    for (const Id in data.options) {

        const option = await Option.findById(Id);
        if (data.options[Id].text) {
            option.text = data.options[Id].text;
        }
        if (data.options[Id].image) {
            option.image = data.options[Id].image;
        }
        promise.push(option.save());
    }

    await Promise.all(promise)

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "quiz updated sucessfully"
        ))
}

export {
    createQuiz,
    getQuiz,
    deleteQuiz,
    updateQuiz
}