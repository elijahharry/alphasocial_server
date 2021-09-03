import fs from "fs";
import request from "request";
import download from "image-downloader";

export const downloadImg = async (url, path, callback, error) => {
  request.head(url, (err, res, body) => {
    request(url)
      .pipe(fs.createWriteStream(path))
      .on("close", callback)
      .on("error", error);
  });
};

export default downloadImg;

// const url = "https://…";
// const path = "./images/image.png";

// download(url, path, () => {
//   console.log("✅ Done!");
// });
