import { TwitterClient } from "twitter-api-client";
import cron from "node-cron";
import ogs from "open-graph-scraper";

import fsExtra from "fs-extra";

import downloadImg from "../middleware/download.js";
import TweetsModel from "../models/tweets.js";

const fetchTweets = async (id) => {
  const twitterClient = new TwitterClient({
    apiKey: process.env.TWITTER_API,
    apiSecret: process.env.TWITTER_SECRET,
    accessToken: process.env.TWITTER_ACCESS,
    accessTokenSecret: process.env.TWITTER_ACCESS_SECRET,
  });

  try {
    const data = await twitterClient.tweets.statusesUserTimeline({
      screen_name: id,
      exclude_replies: false,
      include_rts: false,
      count: 200,
      tweet_mode: "extended",
    });

    const sorted = data.sort((a, b) => {
      return b.favorite_count - a.favorite_count;
    });

    const topTweets = sorted.slice(0, 30);

    const finished = [];
    for (const tweet of topTweets) {
      const textRaw = tweet.full_text.split("\n");
      var textFiltered = textRaw.filter((t) => {
        return t != "";
      });
      const tweetTemp = {
        id: tweet.id_str,
        content: textFiltered,
        favorites: tweet.favorite_count,
        retweets: tweet.retweet_count,
        media: false,
        url: false,
        user: {
          name: tweet.user.name,
          handle: tweet.user.screen_name,
          followers: tweet.user.followers_count,
          pic: tweet.user.profile_image_url_https,
          followers: tweet.user.followers_count,
        },
      };
      if (tweet.entities.media) {
        const media = tweet.entities.media;
        finished.push({
          ...tweetTemp,
          media: media[0].media_url_https ? media[0].media_url_https : false,
        });
      } else {
        let url = false;
        if (tweet.entities.urls) {
          if (tweet.entities.urls[0]) {
            if (tweet.entities.urls[0].expanded_url) {
              url = tweet.entities.urls[0].expanded_url;
              const twitterCheck = url.split("twitter.com");
              if (twitterCheck.length > 1) {
                url = false;
              }
            }
          }
        }
        if (url !== false) {
          const result = await fetchOgData(url);
          if (result.success && result.url) {
            finished.push({
              ...tweetTemp,
              media: result.url.includes("https") ? result.url : false,
            });
          } else {
            finished.push(tweetTemp);
          }
        } else {
          finished.push(tweetTemp);
        }
      }
    }
    return finished;
  } catch (e) {
    console.log("error" + e.message);
    return [];
  }
};

export const fetchAllTweets = async (ids) => {
  try {
    if (Array.isArray(ids)) {
      const all = [];
      for (const id of ids) {
        const tweets = await fetchTweets(id);
        tweets.forEach((tweet) => all.push(tweet));
      }
      return all;
    } else {
      const tweets = await fetchTweets(ids);
      return tweets;
    }
  } catch (e) {
    console.log("ERRROR");
    console.log(e);
  }
};

const fetchOgData = async (url) => {
  try {
    const ogData = await ogs({ url: url })
      .then((data) => {
        const { result } = data;
        if (result.success === true) {
          if (result.ogImage) {
            if (result.ogImage.url) {
              return { success: true, url: result.ogImage.url };
            }
          }
        }
        return { success: false };
      })
      .catch((e) => {
        return { success: false };
      });
    return ogData;
  } catch (e) {
    return { success: false };
  }
};
