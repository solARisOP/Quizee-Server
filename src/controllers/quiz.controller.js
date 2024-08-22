import { Quiz } from "../models/quiz.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Question } from "../models/question.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Option } from "../models/option.model.js";
import mongoose from "mongoose";

const validateData = (name, type, questions) => {
    if (!name.trim()) {
        throw new ApiError(400, "quiz should contain a name")
    }
    else if (!["poll", "q&a"].includes(type.trim())) {
        throw new ApiError(400, "invalid quiz type")
    }
    else if (!questions || !questions.length) {
        throw new ApiError(400, "quiz should contain atleast one question")
    }
    else if (questions.length > 5) {
        throw new ApiError(400, "there cannot be more than 5 questions per quiz")
    }

    for (const question of questions) {
        if (!question.question.trim()) {
            throw new ApiError(400, "question feild of question object cannot be empty or undefined")
        }
        else if (![0, 5, 10].includes(question.timer)) {
            throw new ApiError(400, "invalid timer for a question")
        }
        else if (!question.options || question.options.length < 2) {
            throw new ApiError(400, "question should contain atleast two options")
        }
        else if (question.options.length > 4) {
            throw new ApiError(400, "there cannot be more than 4 options per question")
        }

        const qType = question.type.trim();
        if (!['image', 'text', 'both'].includes(qType)) {
            throw new ApiError(400, "invalid question type")
        }

        for (const option of question.options) {
            if (qType == 'both') {
                if (!option.image || option.image.trim() == "" || !option.text || option.text.trim() == "") {
                    throw new ApiError(400, "questions with type as both should contain option as image and text")
                }
            }
            else if (qType == 'text') {
                if (!option.text || option.text.trim() == "") {
                    throw new ApiError(400, "questions with type as text should contain option as text")
                }
                else if (option.image) {
                    throw new ApiError(400, "questions with type as text should not contain image option")
                }
            }
            else {
                if (!option.image || option.image.trim() == "") {
                    throw new ApiError(400, "questions with type as text should contain option as image")
                }
                else if (option.image) {
                    throw new ApiError(400, "questions with type as image should not contain text option")
                }
            }
        }
    }
}

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

    const quiz = await Quiz.findById(key);

    if (!quiz) {
        throw new ApiError(404, "No quiz exists for this particular id");
    }
    else if (!quiz.owner.equals(req.user._id)) {
        throw new ApiError(403, "Quiz does not belong to the particular user");
    }

    for (const Id in data.questions) {

        const qId = new mongoose.Types.ObjectId(Id)
        if (!quiz.questions.some(element => element.equals(qId))) {
            throw new ApiError(400, `question ${Id} does not belong to this particular quiz`)
        }
    }

    let questions = []
    for (const question of quiz.questions) {
        questions.push(Question.findById(question))
    }
    questions = await Promise.all(questions)
    const optionIds = []
    questions.forEach(question => { optionIds.push(...question.options) })

    for (const Id in data.options) {

        const oId = new mongoose.Types.ObjectId(Id)
        if (!optionIds.some(element => element.equals(oId))) {
            throw new ApiError(400, `question ${Id} does not belong to this particular quiz`)
        }
    }

    const promise = [];
    for (const Id in data.questions) {

        const question = await Question.findById(Id);
        if (data.questions[Id].question) {
            question.question = data.questions[Id].question;
        }
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