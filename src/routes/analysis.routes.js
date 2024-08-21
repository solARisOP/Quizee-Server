import { Router } from "express";
import {
    getTopQuizes,
    getAllquizes,
    getQuizAnalysis,
    calculateScore_AddImpression
} from "../controllers/analysis.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

//routes
router.route('/top-trending-quizes').get(verifyJWT, getTopQuizes)

router.route('/user-quizes').get(verifyJWT, getAllquizes)

router.route('/quiz-analysis').get(verifyJWT, getQuizAnalysis)

router.route('/evaluate-score/:key').patch(calculateScore_AddImpression)

export default router
