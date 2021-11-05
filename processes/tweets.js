import { TwitterClient } from "twitter-api-client";
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
    fsExtra.emptyDirSync(`./images/${id}`);
    const sorted = data.sort((a, b) => {
      return b.favorite_count - a.favorite_count;
    });
    const topTweets = sorted.slice(0, 30);
    let tweets = [];
    for (let i = 0; i < topTweets.length; i++) {
      const tweet = topTweets[i];
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
      const singleIteration = new Promise((resolve) => {
        if (tweet.entities.media) {
          const media = tweet.entities.media;
          resolve({
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
            ogs({ url: url })
              .then((data) => {
                const { result } = data;
                let download = false;
                if (result.success === true) {
                  if (result.ogImage) {
                    if (result.ogImage.url && result.ogImage.type) {
                      {
                        if (
                          result.ogImage.type ===
                          ("jpg" || "png" || "jpeg" || "webp")
                        ) {
                          download = true;
                        }
                      }
                    }
                  }
                }
                if (download) {
                  downloadImg(
                    result.ogImage.url,
                    `./images/${id}/${tweet.id}.${result.ogImage.type}`,
                    () => {
                      resolve({
                        ...tweetTemp,
                        url: {
                          url: url,
                          media: `/images/${id}/${tweet.id}.${result.ogImage.type}`,
                          title: result.ogTitle,
                        },
                      });
                    },
                    () => {
                      resolve(tweetTemp);
                    }
                  );
                } else {
                  resolve(tweetTemp);
                }
              })
              .catch((e) => {
                console.log(e);
                resolve(tweetTemp);
              });
          } else {
            resolve(tweetTemp);
          }
        }
      });
      tweets.push(singleIteration);
    }
    const finished = await Promise.all(tweets);

    try {
      const oldTweets = await TweetsModel.find({ account: id });
      if (oldTweets.length > 0) {
        const deletePromises = oldTweets.map((oldTweet) => {
          const { _id } = oldTweet;
          return new Promise(async (resolve) => {
            await TweetsModel.findByIdAndRemove(_id);
            resolve();
          });
        });
        await Promise.all(deletePromises);
      }
    } catch (e) {
      console.log(e.message);
    }

    const newTweets = new TweetsModel({
      account: id,
      tweets: finished,
    });
    await newTweets.save();
    return "Finished!";
  } catch (e) {
    console.log(e.message);
    return "Error!";
  }
};

const fetchAllTweets = async () => {
  try {
    await fetchTweets("cokedupoptions");
    await fetchTweets("redditinvestors");
    await fetchTweets("stonkmarketnews");
    await fetchTweets("thestinkmarket");
    await fetchTweets("watchoutshorts");
    console.log("All finished!");
  } catch (e) {
    console.log("ERRROR");
    console.log(e);
  }
};

export const startTweetFetching = () => {
  fetchAllTweets();
  setInterval(fetchAllTweets, 3600000);
};
