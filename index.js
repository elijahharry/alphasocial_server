import express from "express";

import dotenv from "dotenv";
import * as path from "path";
import mongoose from "mongoose";

import tweetRoutes from "./routes/tweets.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded());
dotenv.config();

const __dirname = path.resolve(path.dirname(""));
app.use("/images", express.static(__dirname + "/images"));
app.use("/tweets", tweetRoutes);

const PORT = process.env.PORT;
const CONNECTION_URL = process.env.CONNECTION_URL;

mongoose
  .connect(CONNECTION_URL)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((error) => console.log(error.message));
