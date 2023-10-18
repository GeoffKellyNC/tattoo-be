require("dotenv").config();
const server = require('./server')

const DEBUG = process.env.DEBUG_MODE;

const port = process.env.PORT || 9001;



server.listen(port, () => {
    DEBUG ? console.log("DEBUGGING IS ON!!!") : null;
    console.log(`Server is running on port ${port}....`);
  });


  