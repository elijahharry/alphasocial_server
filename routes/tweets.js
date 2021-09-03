import express from "express";
import { runTwitter } from "../controllers/tweets.js";

const router = express.Router();

router.get("/", runTwitter);

export default router;
