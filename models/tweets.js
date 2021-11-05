import mongoose from "mongoose";

const tweetsSchema = mongoose.Schema({
  account: String,
  tweets: Array,
  last_updated: { type: Date, default: new Date() },
});

const TweetsModel = mongoose.model("TweetsModel", tweetsSchema);

export default TweetsModel;
