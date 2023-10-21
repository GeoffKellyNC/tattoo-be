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

        const data = await user.create_user_in_db()
        await user.setUpDatabaseDefaultsClient(data.unxid)
        console.log('User created successfully: ', data.user_name) //TODO: Remove this line
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

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            

            // Save URL to MongoDB
            const imageObj = await User.saveOrUpdateProfileImage(unxid, publicUrl, user_name);
            
            res.status(200).json({ message: 'Uploaded successfully.', data: imageObj });
        });

        blobStream.end(req.file.buffer);
    } catch (error) {
        console.log('Error uploading profile image: ', error); //! REMOVE
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

exports.getActiveProfileImage = async (req, res) => {
    try {
        const user_unxid = req.headers['user_unx_id']


        const activeImage = await User.getActiveProfileImage(user_unxid);

        if (activeImage) {
            res.status(200).json({ message: 'Active profile image found.', data: activeImage });
        } else {
            res.status(200).json({ message: 'No active profile image found.', data: null });
        }
    } catch (error) {
        console.log('Error fetching active profile image:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

exports.updateProfileDetailsClient = async (req, res) => {
    try {
        const data = req.body
        const unxid = req.headers['user_unx_id']


        const updatedUser = await User.setProfileDetailsClient(unxid, data)

        if(!updatedUser){
            res.status(400).json({message: 'Error updating profile details', data: null})
            return
        }

        res.status(200).json({message: 'Profile details updated successfully', data: updatedUser})

    } catch (error) {
        console.log('Error updating profile details: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error updating profile details', data: error})
    }
}

exports.getClientUploadedImages = async (req, res) => {
    try {
        const unxid = req.headers['user_unx_id']

        const images = await User.getClientUploadedImages(unxid)

        if(!images){
            res.status(400).json({message: 'Error fetching client images', data: null})
            return
        }

        res.status(200).json({message: 'Client images fetched successfully', data: images})

    } catch (error) {
        console.log('Error fetching client images: ', error) //TODO: Handle this error
        res.status(500).json({message: 'Error fetching client images', data: error})
    }
}
    

exports.uploadClientImages = async (req, res) => {
    console.log('uploadClientImages function initiated'); //!REMOVE

    try {
        const user_name = req.headers.user_name;
        const unxid = req.headers['user_unx_id']

        
        console.log('Headers processed:', { user_name, unxid }); //!REMOVE

        if (!req.file) {
            console.log('No File Detected in the request'); //!REMOVE
            res.status(400).json({ message: 'Please upload a file', data: null });
            return;
        }

        console.log('File detected, preparing to upload to cloud'); //!REMOVE

        const blob = bucket.file(`client-uploaded-images/${req.file.originalname}-${unxid}`);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        });

        blobStream.on('error', (err) => {
            console.log('Error detected during blob streaming to cloud storage:', err.message); //!REMOVE
            res.status(500).json({ message: 'Error uploading file to cloud storage.', error: err.message });
            return;
        });

        blobStream.on('finish', async () => {
            console.log('File upload to cloud storage finished successfully'); //!REMOVE

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

            // Save URL to MongoDB
            const imageObj = await User.saveClientUploadedImage(unxid, publicUrl, user_name);
            
            console.log('Image URL saved to MongoDB:', imageObj); //!REMOVE

            res.status(200).json({ message: 'Uploaded successfully.', data: imageObj });
        });

        blobStream.end(req.file.buffer);

    } catch (error) {
        console.log('Error Uploading Client Image: ', error); //!REMOVE
        res.status(500).json({ message: "Error Uploading Messages", data: error });
    }
}

exports.fetchPaginatedUsers = async (req, res) => {
    try {
        const { page, limit } = req.query;

        const users = await User.fetchPaginatedUsers(parseInt(page, 10), parseInt(limit, 10));

        if (!users) {
            res.status(500).json({ message: 'Failed to fetch users.' });
            return;
        }

        res.status(200).json({ data: users });
    } catch (error) {
        console.log('Error fetching paginated users:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}


