import express from "express";
import { getTweets } from "../controllers/tweets.js";

const router = express.Router();

router.post("/", getTweets);

export default router;
