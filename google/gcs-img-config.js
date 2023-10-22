require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS)

const storage = new Storage({
  credentials: credentials,
  projectId: process.env.GOOGLE_IMAGE_PROJECT_ID
});

const bucket = storage.bucket(process.env.GOOGLE_IMAGE_BUCKET_NAME);

module.exports = {
    storage,
    bucket
  };
  