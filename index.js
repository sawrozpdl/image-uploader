const AWS = require("aws-sdk");

const sendRes = (callback, json, statusCode = 200) => {
  const res = {
    isBase64Encoded: false,
    statusCode,
    headers: { Hey: "Vsauce!" },
    body: JSON.stringify(json),
  };

  callback(null, res);
};

exports.handler = (event, context, callback) => {
  if (event.httpMethod === "OPTIONS") {
    return true;
  }
  if (!event.body) {
    sendRes(
      callback,
      {
        message: "Body is empty, what's that supposed to mean?",
      },
      400
    );
  }

  const eventBody = JSON.parse(event.body);

  if (
    !eventBody.namespace ||
    !eventBody.folder ||
    !eventBody.name ||
    !eventBody.image
  ) {
    sendRes(
      callback,
      {
        message:
          "Please specify image upload parameters: namespace, folder, name and image",
      },
      400
    );
  }

  const s3Bucket = new AWS.S3({
    params: { Bucket: `com.uploader.${eventBody.namespace}` },
  });

  const buffer = Buffer.from(
    eventBody.image.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const data = {
    Key: `${eventBody.folder}/${eventBody.name}`,
    Body: buffer,
    ContentEncoding: "base64",
    ContentType: "image/jpeg",
  };

  s3Bucket.putObject(data, function (err, succ) {
    if (err) {
      console.error(err);

      sendRes(
        callback,
        {
          message: "Failed to upload the image!",
        },
        500
      );
    } else {
      sendRes(
        callback,
        {
          message: "Image uploaded!",
          url: getUrlFromBucket(
            s3Bucket,
            `${eventBody.folder}/${eventBody.name}`
          ),
        },
        200
      );
    }
  });
};

function getUrlFromBucket(s3Bucket, fileName) {
  const {
    config: { params, region },
  } = s3Bucket;
  const regionString = region.includes("us-east-1") ? "" : "-" + region;
  return `https://${params.Bucket}.s3${regionString}.amazonaws.com/${fileName}`;
}
