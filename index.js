"use strict";
import bencode from "bencode";
import formidable from "formidable";
import http from "http";

function processTorrentFile(req, res) {
  var form = new formidable.IncomingForm();
  form.onPart = (part) => {
    const encoding = part.transferEncoding === "utf-8" ? "utf8" : "binary";
    let cacheBuffer = Buffer.alloc(0, 0, encoding);
    part.on("data", function (chunk) {
      if (chunk.length > 0) {
        cacheBuffer = Buffer.concat([cacheBuffer, chunk]);
      }
    });
    part.on("end", function () {
      const torrent = bencode.decode(cacheBuffer);
      const announceList = torrent["announce-list"];
      res.write("[");
      for (let i = 0; i < announceList.length; i++) {
        res.write('"' + announceList[i].toString("utf-8") + '"');
        if (i != announceList.length - 1) {
          res.write(",");
        }
      }
      res.write("]");
      res.end();
    });
    part.on("error", function (err) {
      throw err;
    });
  };
  form.parse(req);
}

function writeUploadForm(req, res) {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(
    '<form action="torrent" method="post" enctype="multipart/form-data">'
  );
  res.write('<input type="file" name="filetoupload"><br>');
  res.write('<input type="submit">');
  res.write("</form>");
  return res.end();
}

http
  .createServer(function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
    res.setHeader("Access-Control-Max-Age", 86400);

    if (req.url === "/torrent") {
      processTorrentFile(req, res);
    } else {
      return writeUploadForm(req, res);
    }
  })
  .listen(3000);
