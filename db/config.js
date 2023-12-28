const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.LOCAL_MODE ? process.env.MONGO_URI_LOCAL : process.env.MONGO_URI;
const mongo = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectMongoDB() {
  try {
    await mongo.connect();
    console.log('Connected to Tattoo-Site DB');
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  connectMongoDB,
  mongo
};