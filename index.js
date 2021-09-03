import express from "express";

import dotenv from "dotenv";
import * as path from "path";

import tweetRoutes from "./routes/tweets.js";

const app = express();
dotenv.config();

const __dirname = path.resolve(path.dirname(""));
app.use("/images", express.static(__dirname + "/images"));
app.use("/tweets", tweetRoutes);

app.listen(5000, () => console.log(`Server running on port 5000`));
