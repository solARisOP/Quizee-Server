import express from "express";
import cookieParser from "cookie-parser";
import 'express-async-errors';

const app = express()

//middlwares
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static('public'))
app.use(cookieParser())

export { app }