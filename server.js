const express = require("express");
const cors = require("cors");
const urlParse = require("url-parse");
const queryParse = require("querystring");
const bodyParser = require("body-parser");
const request = require("request");
const { query } = require("express");

const axios = require("axios");

const { google } = require("googleapis");
const { oauth2 } = require("googleapis/build/src/apis/oauth2");

const app = express();
const port = 8080;

app.use(cors());
app.use(express.static("./public/"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/test", (req, res) => {
  res.json({ msg: "ok" });
});

app.get("/googleapi", (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    // client id
    "25496487620-se99hmf90qg9hdo0dm2qgdmputt6m7tp.apps.googleusercontent.com",
    // client secret
    "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",
    // link to redirect to
    "http://localhost:8080/googleapi/steps"
  );

  const scopes = [
    "https://www.googleapis.com/auth/fitness.activity.read profile email openid",
    "https://www.googleapis.com/auth/fitness.body.read profile email openid",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: JSON.stringify({
      callbackUrl: req.body.callbackUrl,
      userID: req.body.userID,
    }),
  });

  request(url, (err, response, body) => {
    console.log("error: ", err);
    console.log("status code: ", response && response.statusCode);
    res.send({ url });
  });
});

app.get("/googleapi/steps", async (req, res) => {
  const queryURL = new urlParse(req.url);
  const code = queryParse.parse(queryURL.query).code;

  const oauth2Client = new google.auth.OAuth2(
    // client id
    "25496487620-se99hmf90qg9hdo0dm2qgdmputt6m7tp.apps.googleusercontent.com",
    // client secret
    "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",
    // link to redirect to
    "http://localhost:8080/googleapi/steps"
  );

  const tokens = await oauth2Client.getToken(code);

  let resultArray = [];

  try {
    const result = await axios({
      method: "POST",
      headers: {
        authorization: "Bearer " + tokens.tokens.access_token,
      },
      "Content-Type": "application/json",
      url: `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      data: {
        aggregateBy: [
          {
            dataTypeName: "com.google.step_count.delta",
            dataSourceId:
              "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
          },
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: 1676523600000,
        endTimeMillis: 1676610000000,
      },
    });
    resultArray = result.data.bucket;
  } catch (e) {
    console.log(e);
  }

  let stepArray = [];

  try {
    resultArray.forEach((result) => {
      result.dataset.forEach((dataset) => {
        dataset.point.forEach((point) => {
          stepArray.push({
            startTime: new Date(point.startTimeNanos * Math.pow(10, -6)).toUTCString(),
            endTime: new Date(point.endTimeNanos * Math.pow(10, -6)).toUTCString(),
            steps: point.value.map((obj) => obj.intVal),
          });
        });
      });
    });
  } catch (e) {
    console.log(e);
  }

  console.log(stepArray);

  //res.json({ msg: "ok" });
  res.json(stepArray);
});

app.get("/googleapi/weight", async (req, res) => {
  const queryURL = new urlParse(req.url);
  const code = queryParse.parse(queryURL.query).code;

  const oauth2Client = new google.auth.OAuth2(
    // client id
    "25496487620-se99hmf90qg9hdo0dm2qgdmputt6m7tp.apps.googleusercontent.com",
    // client secret
    "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",
    // link to redirect to
    "http://localhost:8080/googleapi/weight"
  );

  const tokens = await oauth2Client.getToken(code);

  let resultArray = [];

  try {
    const result = await axios({
      method: "POST",
      headers: {
        authorization: "Bearer " + tokens.tokens.access_token,
      },
      "Content-Type": "application/json",
      url: `https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate`,
      data: {
        aggregateBy: [
          {
            dataTypeName: "com.google.weight",
            dataSourceId: "derived:com.google.weight:com.google.android.gms:merge_weight",
          },
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: 1676523600000,
        endTimeMillis: 1676610000000,
      },
    });
    resultArray = result.data.bucket;
  } catch (e) {
    console.log(e);
  }

  let weightArray = [];

  try {
    resultArray.forEach((result) => {
      result.dataset.forEach((dataset) => {
        dataset.point.forEach((point) => {
          weightArray.push({
            startTime: new Date(point.startTimeNanos * Math.pow(10, -6)).toUTCString(),
            endTime: new Date(point.endTimeNanos * Math.pow(10, -6)).toUTCString(),
            weights: point.value.map((obj) => obj.fpVal),
          });
        });
      });
    });
  } catch (e) {
    console.log(e);
  }

  console.log(weightArray);

  //res.json({ msg: "ok" });
  res.json(weightArray);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
