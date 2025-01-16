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
        required: true,
        unique: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    }
})
const User = new mongoose.model("users", LoginSchema)
module.exports = User

// somethings up with this it might be because its not correctly connected yet but this error is showing comenting out the picksSchema seemed to fix it?:
//(node:6712) [DEP0044] DeprecationWarning: The util.isArray API is deprecated. Please use Array.isArray() instead.
//(Use node --trace-deprecation ... to show where the warning was created)


/*
// defines a schema for storing users picks
const PicksSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      gameId: {
        type: String,
        required: true,
      },
      pick: {
        type: String,
        enum: ["homeTeam", "awayTeam"],
        required: true,
      }
})
const Picks = new mongoose.model("picks", PicksSchema)
module.exports = Picks
*/