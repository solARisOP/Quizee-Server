import { Router } from "express";
import {
    createQuiz,
    getQuiz,
    deleteQuiz,
    updateQuiz
} from "../controllers/quiz.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

//routes
router.route('/create-quiz').post(verifyJWT, createQuiz)

router.route('/delete-quiz/:key').delete(verifyJWT, deleteQuiz)

router.route('/update-quiz/:key').patch(verifyJWT, updateQuiz)

router.route('/get-quiz').get(getQuiz)

export default router
