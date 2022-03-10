import TweetsModel from "../models/tweets.js";

export const getTweets = async (req, res) => {
  try {
    const tweets = await TweetsModel.find();
    res.status(200).json(tweets);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
