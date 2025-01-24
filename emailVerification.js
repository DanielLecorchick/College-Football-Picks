//this file contains the code to send email verification to each user upon account creation
const {randomBytes} = require('crypto')
const nodemailer = require('nodemailer')
const {User} = require('./database-config')
require("dotenv").config()


const sender = nodemailer.createTransport({
    service: 'Gmail',
    Auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASS
    }
})

const sendEmail = async(user) => {
    try{
        const verificationToken = 
        const verificationURL = `http://localhost:3000/verify-email?token=${verificationToken}` 

        const email = {
            from: process.env.EMAIL_ADDRESS,
            to: User.email,
            subject: 'College Football Picks Email Verification',
            html: `<p>Thank you for signing up for College Football Picks!<br>Please verify your e-mail address by clicking here <a href="${verificationUrl}">here</a>.</p>`
        }
    }

}

sender.sendMail(mailOptions, (error, info) => {
    if(error){
        console.log(error)
    }
    else{
        console.log('Verification e-mail sent to ', info.response)
    }
})