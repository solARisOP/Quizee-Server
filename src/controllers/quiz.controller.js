import { Quiz } from "../models/quiz.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Question } from "../models/question.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Option } from "../models/option.model.js";
import mongoose from "mongoose";

const createQuiz = async (req, res) => {
    const {name, type, questions} = req.body;
    if(!questions) {
        throw new ApiError(400, "quiz should contain atleast one question")
    }
    if(questions.length>5) {
        throw new ApiError(400, "there cannot be more than 5 questions per quiz")
    }

    const promiseQuestions = []

    let idx = 0;
    for (const question of questions) {
        if(!question.options || question.options.length<2) {
            throw new ApiError(400, "question should contain atleast two options")
        }
        else if(question.options.length>4) {
            throw new ApiError(400, "there cannot be more than 4 options per question")
        }

        const promiseOptions = []

        for (const option of question.options) promiseOptions.push(Option.create(option))

        await Promise.all(promiseOptions)

        promiseQuestions.push(Question.create({
            question: question.question, 
            timer: question.timer ? question.timer : 0,
            questiontype: question.type,
            options: promiseOptions.map(element=>element._id),
            correct: question.type == 'q&a' ? promiseOptions[idx++]._id : null
        }))
    }

    await Promise.all(promiseQuestions)

    const quiz = await Quiz.create({owner:req.user._id, name, quiztype: type, questions:promiseQuestions.map(element=>element._id)});
    
    return res
    .status(200)
    .json(new ApiResponse(
        201,
        quiz,
        "quiz created succcessfully"
    ))
}

const takeQuiz = async (req, res) => {
    const {key} = req.query;

    const quiz = await Quiz.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(key)
            }
        },
        {
            $lookup: {
                from: "questions",
                localField: "questions",
                foreignField: "_id",
                pipeline:[
                    {
                        $lookup: {
                            from: "options",
                            localField: "options",
                            foreignField: "_id",
                            pipeline:[
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
                            correct: 0,
                            impressions: 0
                        }
                    }
                ],
                as: "relatedQuestions"
            }
        },
        {
            $project: {
                owner: 0,
                impressions: 0
            }
        }
    ])

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
    const {key} = req.params;
    const data = req.body

    const quiz = await Quiz.findById(key);

    if(!quiz) {
        throw new ApiError(404, "No quiz exists for this particular id");
    }
    else if(quiz.owner != req.user._id) {
        throw new ApiError(403, "Quiz does not belong to the particular user");
    }

    const questions = []
    for (const question of quiz.questions) {
        questions.push(Question.findById(question))
    }

    const promise = [];
    for (const Id in data.questions) {
        if(!quiz.questions.includes(Id)) {
            throw new ApiError(400, `question ${Id} does not belong to this particular quiz`)
        }

        const question = await Question.findById(Id);
        if(data.questions[Id].name) {
            question.name = data.questions[Id].name;
        }
        if(data.questions[Id].timer) {
            question.timer = data.questions[Id].timer;
        }
        promise.push(question.save());
    }

    await Promise.all(questions)

    const optionIds = []
    questions.forEach(question =>{ optionIds.push(...question.options)})

    for (const Id in data.options) {
        if(!optionIds.includes(Id)) {
            throw new ApiError(400, `option ${Id} does not belong to this particular quiz`)
        }

        const option = await Option.findById(Id);
        if(data.options[Id].text) {
            option.text = data.options[Id].text;
        }
        if(data.options[Id].image) {
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
    takeQuiz,
    deleteQuiz,
    updateQuiz
}