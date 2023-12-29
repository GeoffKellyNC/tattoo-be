require('dotenv').config()
const nodemailer = require('nodemailer');


const SERVER_URL = process.env.LOCAL_MODE ? 'http://192.168.50.103:9001' : process.env.SERVER_URL



const sendTrialWillEndEmail = async (userEmail, userName) => {
    try {

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        })

        let mailOptions = {
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: "LINK'D Trial Ending Soon",
            text: `Hey ${userName}, your LINK'D trial is ending in 3 days. If you plan to continue using LINK'D your card will be charged $5.99/month. If you do not wish to continue using LINK'D, please cancel your subscription before the trial ends.`
        }

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                console.log('Error Sending Email Trial Ending')
            } else {
                console.log('Email Sent: ' + info.response)
            }
        })

        return


    } catch (error) {
        console.log('Error sending Trial Will end email: ', error) //TODO: Handle this error (LOG)
        return
    }
}


module.exports = sendTrialWillEndEmail