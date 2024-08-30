import { Quiz } from "../models/quiz.model.js"
import { Question } from "../models/question.model.js"
import { ApiError } from "../utils/ApiError.js"
import mongoose from "mongoose"

const validateData = (name, type, questions) => {
    if (!name.trim()) {
        throw new ApiError(400, "quiz should contain a name")
    }
    else if(!type.trim()) {
        throw new ApiError(400, "quiz should have a type")
    }
    else if (!["poll", "q&a"].includes(type.trim())) {
        throw new ApiError(400, `${type} is a invalid quiz type`)
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
        else if (question.timer && ![0, 5, 10].includes(question.timer)) {
            throw new ApiError(400, `${question.timer} is a invalid timer for a question`)
        }
        else if (!question.options || question.options.length < 2) {
            throw new ApiError(400, "question should contain atleast two options")
        }
        else if (question.options.length > 4) {
            throw new ApiError(400, "there cannot be more than 4 options per question")
        }

        const qType = question.type.trim();
        if(!qType) {
            throw new ApiError(400, "question should have a type")
        }
        else if (!['image', 'text', 'both'].includes(qType)) {
            throw new ApiError(400, "invalid question type")
        }

        for (const option of question.options) {
            if (qType == 'both') {
                if (!option.image || !option.image.trim() || !option.text || !option.text.trim()) {
                    throw new ApiError(400, "questions with type as both should contain options as image and text")
                }
            }
            else if (qType == 'text') {
                if (!option.text || !option.text.trim()) {
                    throw new ApiError(400, "questions with type as text should contain options as text")
                }
                else if (option.image) {
                    throw new ApiError(400, "questions with type as text should not contain options image")
                }
            }
            else {
                if (!option.image || !option.image.trim()) {
                    throw new ApiError(400, "questions with type as image should contain options as image")
                }
                else if (option.text) {
                    throw new ApiError(400, "questions with type as image should not contain options as text")
                }
            }
        }
    }
}

const validateUpdationData = async(req, key, data) => {

    const quiz = await Quiz.findById(key);

    if (!quiz) {
        throw new ApiError(404, "No quiz exists for this particular id");
    }
    else if (!quiz.owner.equals(req.user._id)) {
        throw new ApiError(403, "Quiz does not belong to the particular user");
    }

    for (const Id in data.questions) {
        if (data.questions[Id].timer && ![0, 5, 10].includes(data.questions[Id].timer)) {
            throw new ApiError(400, `${data.questions[Id].timer} is a invalid timer for a question`)
        }
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
        if (data.options[Id].text && !data.options[Id].text.trim()) {
            throw new ApiError(400, "text cannot be empty for an option")
        }
        else if(data.options[Id].image && !data.options[Id].image.trim()) {
            throw new ApiError(400, "image url cannot be empty for an option")
        }
        const oId = new mongoose.Types.ObjectId(Id)
        if (!optionIds.some(element => element.equals(oId))) {
            throw new ApiError(400, `option ${Id} does not belong to this particular quiz`)
        }
    }
}

export {
    validateData,
    validateUpdationData
}