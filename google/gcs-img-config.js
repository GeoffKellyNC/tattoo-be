require('dotenv').config();
const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  keyFilename: '/Users/geoff/Projects/Projects/tattoo/tattoo-be/googlekeys/gcs-credentials.json',
  projectId: process.env.GOOGLE_IMAGE_PROJECT_ID
});

const bucket = storage.bucket(process.env.GOOGLE_IMAGE_BUCKET_NAME);

module.exports = {
    storage,
    bucket
  };
  