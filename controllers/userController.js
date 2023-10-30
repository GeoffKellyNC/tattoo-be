const User = require('../models/User')
const Auth = require('../models/Auth')
const { storage, bucket } = require('../google/gcs-img-config');
const sendVerificationEmail = require('../util/emailVerifyMailer');


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
        if(data.isArtist){
            console.log('Creating artist defaults') //!REMOVE
            await User.setUpArtistDefaults(data.unxid)
        }

        const verificationCode = await Auth.createVerificationCode(data.unxid)

        await sendVerificationEmail(data.unxid, data.user_email, verificationCode)
        
        res.status(200).json({message: 'User created successfully'})




    } catch (error) {
        console.log('Error creating user: ', error) //TODO: Handle this error
    }
}


exports.uploadProfileImage = async (req, res) => {
    try {

        const user_name = req.headers.user_name
        const unxid = req.headers['user_unx_id']

        if (!req.file) {
            res.status(400).json({ message: 'Please upload a file.' });
            return;
        }


        // We use the bucket from the imported configuration
        const blob = bucket.file(`profile-images/${req.file.originalname}-${unxid}`);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        blobStream.on('error', (err) => {
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
        console.log('Error uploading profile image: ', error); // TODO: HANDLE ERROR (LOG)
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
        console.log('Error fetching active profile image:', error); //TODO: Handle this error (LOG)
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

    try {
        const user_name = req.headers.user_name;
        const unxid = req.headers['user_unx_id']

        

        if (!req.file) {
            res.status(400).json({ message: 'Please upload a file', data: null });
            return;
        }


        const blob = bucket.file(`client-uploaded-images/${req.file.originalname}-${unxid}`);
        const blobStream = blob.createWriteStream({
            metadata: {
                contentType: req.file.mimetype
            }
        });

        blobStream.on('error', (err) => {
            console.log('Error detected during blob streaming to cloud storage:', err.message); //TODO: Handle Error (LOG)
            res.status(500).json({ message: 'Error uploading file to cloud storage.', error: err.message });
            return;
        });

        blobStream.on('finish', async () => {

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

            // Save URL to MongoDB
            const imageObj = await User.saveClientUploadedImage(unxid, publicUrl, user_name);
            

            res.status(200).json({ message: 'Uploaded successfully.', data: imageObj });
        });

        blobStream.end(req.file.buffer);

    } catch (error) {
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

exports.fetchUserProfileByUnxid = async (req, res) => {
    try {
        const unxid = req.params.user_id;


        const user = await User.fetchUserProfileByUnxid(unxid);

        if (!user) {
            res.status(500).json({ message: 'Failed to fetch user.' });
            return;
        }

        res.status(200).json({ data: user });
    } catch (error) {
        console.log('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}

exports.updateUserEmailForVerification = async (req, res) => {
    try {
        const unxid = req.headers['user_unx_id']
        const { email } = req.body;

        const updatedEmail = await User.updateUserEmail(unxid, email);

        if (!updatedEmail) {
            res.status(500).json({ message: 'Failed to update user email.' });
            return;
        }

        const verificationCode = await Auth.createVerificationCode(unxid);

        await sendVerificationEmail(unxid, updatedEmail, verificationCode);

        res.status(200).json({ message: `Updated! New link sent to ${updatedEmail}` });
    } catch (error) {
        console.log('Error updating user email:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}


