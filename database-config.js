//database config for mongoDB stores the name, password, username, and email of each and every user

// inport and config for using mongoDB
require("dotenv").config()
const mongoose = require("mongoose")
const connect = mongoose.connect("mongodb+srv://Admin:u6WLtfj2lnuokjpO@login.i84jf.mongodb.net/?retryWrites=true&w=majority&appName=Login")

// error handling to tell the admin if the database connected sucessfully or not
connect.then(()=> {
    console.log("Database Connected Sucessfully")
})
.catch(() =>{
    console.log("Database didnt connect properly")
})

// defines a schema for storing user information collected from the sign up process
const LoginSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    username:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    }
})

const User = new mongoose.model("users", LoginSchema)

module.exports = User