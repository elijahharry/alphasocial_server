// import TweetsModel from "../models/tweets.js";
// export const getTweets = async (req, res) => {
//   try {
//     const tweets = await TweetsModel.find();
//     res.status(200).json(tweets);
//   } catch (error) {
//     res.status(404).json({ message: error.message });
//   }
// };

import { TwitterClient } from "twitter-api-client";
import { fetchAllTweets } from "../processes/tweets.js";
import cron from "node-cron";
import ogs from "open-graph-scraper";

import fsExtra from "fs-extra";

import downloadImg from "../middleware/download.js";
import TweetsModel from "../models/tweets.js";

export const getTweets = async (req, res) => {
  // console.log(req);
  if (req.body.ids) {
    try {
      const tweets = await fetchAllTweets(req.body.ids);
      res.status(200).json(tweets);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  } else {
    res.status(404).json({ message: "No account IDs found." });
  }
};
