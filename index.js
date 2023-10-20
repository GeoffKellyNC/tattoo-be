require("dotenv").config();
const server = require('./server')
const os = require("os");

const DEBUG = process.env.DEBUG_MODE;

const port = process.env.PORT || 9001;



const interfaces = os.networkInterfaces();
const addresses = [];
for (const key in interfaces) {
  for (const address of interfaces[key]) {
    if (address.family === "IPv4" && !address.internal) {
      addresses.push(address.address);
    }
  }
}

server.listen(port, () => {
    DEBUG ? console.log("DEBUGGING IS ON!!!") : null;
    console.log(`Server is running on port ${port}....`);
    console.log(`Server is also running on EXTERNAL ${addresses[0]}:${port}`);
  });

