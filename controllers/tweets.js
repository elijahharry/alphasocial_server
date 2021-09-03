import express from "express";

import { TwitterClient } from "twitter-api-client";
import dotenv from "dotenv";
import ogs from "open-graph-scraper";

import fsExtra from "fs-extra";

import downloadImg from "../middleware/download.js";

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

    fsExtra.emptyDirSync(`./images/${id}`);

    let tweets = [];
    for (let i = 0; i < data.length; i++) {
      const tweet = data[i];
      const singleIteration = new Promise((resolve) => {
        const tweetTemp = {
          content: tweet.text.split("\n"),
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
                    // Callback if download is successfull
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
                    // Callback on error
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
    Promise.all(tweets).then((values) => {
      console.log("finished " + id);
      res.status(200).json(values);
    });
  } catch (e) {
    console.log(e.message);
  }
};
