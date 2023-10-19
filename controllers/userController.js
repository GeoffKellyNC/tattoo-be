const User = require('../models/User')
const { storage, bucket } = require('../google/gcs-img-config');


// Return True if username is taken and false if it is available
exports.checkUserNameExists = async (req, res) => {
    try {
        const username = req.params.user_name

        const doesUserExists = await User.checkIfUserNameExists(username)


        if(!doesUserExists) {
            res.status(200).json({message: false})
            return
        }

        res.status(200).json({message: true})
        
    } catch (error) {
        console.log('Error checking if username is taken: ', error) //TODO: Handle this error
    }
}

exports.createUser = async (req, res) => {
    try {
        const user = new User(req.body)

        const userChecks = await user.create_user_checks()

        if(userChecks){
            res.status(400).json(userChecks)
            return
        }

        user.create_user_in_db()
        res.status(200).json({message: 'User created successfully'})




    } catch (error) {
        console.log('Error creating user: ', error) //TODO: Handle this error
    }
}


exports.uploadProfileImage = async (req, res) => {
    try {
        console.log('Entering uploadProfileImage function. Checking if file exists...'); //! REMOVE

        const user_name = req.headers.user_name
        const unxid = req.headers['user_unx_id']

        if (!req.file) {
            console.log('No file detected in the request.'); //! REMOVE
            res.status(400).json({ message: 'Please upload a file.' });
            return;
        }

        console.log(`File detected. File name: ${req.file.originalname}. Preparing to upload to cloud storage...`); //! REMOVE

        // We use the bucket from the imported configuration
        const blob = bucket.file(`profile-images/${req.file.originalname}-${unxid}`);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        blobStream.on('error', (err) => {
            console.log('Error detected during blob streaming to cloud storage:', err.message); //! REMOVE
            res.status(500).json({ message: 'Error uploading file to cloud storage.', error: err.message });
        });

        blobStream.on('finish', async () => {
            console.log('Blob stream finished. Generating public URL...'); //! REMOVE

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            
            console.log(`Public URL generated: ${publicUrl}. Preparing to save to MongoDB...`); //! REMOVE

            // Save URL to MongoDB
            const imageObj = await User.saveProfileImage(unxid, publicUrl, user_name);
            
            console.log('Image URL saved to MongoDB. Sending response back...'); //! REMOVE
            res.status(200).json({ message: 'Uploaded successfully.', data: imageObj });
        });

        console.log('Ending blob stream...'); //! REMOVE
        blobStream.end(req.file.buffer);
    } catch (error) {
        console.log('Error uploading profile image: ', error); //! REMOVE
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
