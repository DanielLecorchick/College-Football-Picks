require("dotenv").config()
const mongoose = require("mongoose")
const connect = mongoose.connect("mongodb+srv://Admin:u6WLtfj2lnuokjpO@login.i84jf.mongodb.net/?retryWrites=true&w=majority&appName=Login")

connect.then(()=> {
    console.log("Database Connected Sucessfully")
})
.catch(() =>{
    console.log("Database didnt connect properly")
})

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