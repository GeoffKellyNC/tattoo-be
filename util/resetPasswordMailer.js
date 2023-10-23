require("dotenv").config()

const nodemailer = require('nodemailer')

const SERVER_URL = process.env.LOCAL_MODE ? 'http://192.168.50.103:9001' : process.env.SERVER_URL

const sendResetPassEmail = async (unxid, user_email, token) => {
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        
        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: user_email,
            subject: "LINK'D Password Reset",
            text: `Click here to reset your password with LINK'D APP: ${SERVER_URL}/auth/reset-password?token=${token}&unxid=${unxid}`
        };
        
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Reset Email sent: ' + info.response);
            }
        });

    } catch (error) {
        console.log('Error sending Password reset email: ', error) //TODO: Handle this error (LOG)
    }
}

module.exports = sendResetPassEmail