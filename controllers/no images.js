import express from "express";
import dotenv from "dotenv";
import { TwitterClient } from "twitter-api-client";

dotenv.config();

const twitterClient = new TwitterClient({
  apiKey: process.env.TWITTER_API,
  apiSecret: process.env.TWITTER_SECRET,
  accessToken: process.env.TWITTER_ACCESS,
  accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
});

export const runTwitter = async (req, res) => {
  const { id: id } = req.query;
  try {
    const data = await twitterClient.tweets.statusesUserTimeline({
      screen_name: id,
      exclude_replies: true,
      include_rts: false,
      count: 200,
    });

    let tweets = [];
    data.forEach((tweet) => {
      let media;
      if (tweet.entities.media) {
        const mediaRaw = tweet.entities?.media;
        if (mediaRaw[0]) {
          media = mediaRaw[0].media_url_https;
        } else {
          media = false;
        }
      } else {
        media = false;
      }
      let urls = { twitter: "", extra: [] };
      if (tweet.entities.urls) {
        const rawUrls = tweet.entities.urls;
        console.log(rawUrls);
        rawUrls.forEach((url) => {
          const twitterCheck = url.expanded_url.split("https://twitter.com/");
          if (twitterCheck.length > 1) {
            urls.twitter = url.url;
          } else {
            urls.extra.push(url.expanded_url);
          }
        });
      }
      tweets.push({
        content: tweet.text.split("\n"),
        favorites: tweet.favorite_count,
        retweets: tweet.retweet_count,
        media: media,
        urls: urls,
        user: {
          name: tweet.user.name,
          handle: tweet.user.screen_name,
          followers: tweet.user.followers_count,
          pic: tweet.user.profile_image_url_https,
        },
      });
    });
    res.status(200).json(tweets);
  } catch (e) {
    console.log(e.message);
    res.status(500).json({ message: "Something went wrong..." });
  }
};
