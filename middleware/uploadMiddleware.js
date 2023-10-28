const multer = require('multer');

const storage = multer.memoryStorage(); // This will store the file in memory as Buffer; ideal for multerUploading to cloud storage

const multerUpload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024,  // max file size 100MB
    },
});

module.exports = multerUpload;