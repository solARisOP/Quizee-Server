import "express-async-errors"
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

const app = express()

//middlwares
app.use(cors({
    origin: "http://localhost:5173",
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
}));
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static('public'))
app.use(cookieParser())


// routes import
import userRouter from "./routes/user.routes.js";
import quizRouter from "./routes/quiz.routes.js";
import analysisRouter from "./routes/analysis.routes.js"
import errorHandeler from "./middlewares/errorHandeller.middleware.js"


// routes declaration
app.use("/api/v1/users", userRouter)

app.use("/api/v1/quiz", quizRouter)

app.use("/api/v1/analysis", analysisRouter)


//error handeller
app.use(errorHandeler)


export { app }