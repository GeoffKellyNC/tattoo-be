const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
const mongo = new MongoClient(uri);

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