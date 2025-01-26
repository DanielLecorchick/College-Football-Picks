//this file contains the code to send email verification to each user upon account creation
const {randomBytes} = require('crypto')
const nodemailer = require('nodemailer')
const {User} = require('./database-config')
require("dotenv").config()

// Error sending verification email ReferenceError: verificationUrl is not defined
//     at sendEmail (C:\Users\mined\OneDrive\Desktop\Coding\College Football Top 25\emailVerification.js:36:85)
//     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
//     at async C:\Users\mined\OneDrive\Desktop\Coding\College Football Top 25\server.js:93:9



//sets up the logic to send an email
const sender = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASS
    }
})

const sendEmail = async(user) => {
    try{
        //creates a verification token to send to the user
        const verificationToken = randomBytes(32).toString('hex')
        await User.updateOne({_id: user._id}, {verificationToken})

        const verificationURL = `http://localhost:3000/verify-email?token=${verificationToken}`

        //content of the email that is sent to the user when they create account
        const email = {
            from: process.env.EMAIL_ADDRESS,
            to: user.email,
            subject: 'College Football Picks Email Verification',
            html: `<p>Thank you for signing up for College Football Picks!</p>
                   <p>Please verify your e-mail address by clicking here <a href="${verificationURL}">here</a>.</p>`
        }
        await sender.sendMail(email)
        console.log('Verification Email sent to: ', user.email)
    }
    catch(error){
        console.error('Error sending verification email', error)
    }
}

module.exports = {sendEmail}