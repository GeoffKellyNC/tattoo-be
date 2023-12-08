require("dotenv").config();
const httpServer = require('./server');

const PORT = process.env.PORT || 9001;

// Listen on the HTTP server
httpServer.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
