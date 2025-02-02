//database config for mongoDB stores the name, password, username, and email of each and every user

// inport and config for using mongoDB
require("dotenv").config()
const mongoURI = process.env.MONGO_URI
const mongoose = require("mongoose")
const connect = mongoose.connect(mongoURI)

// error handling to tell the admin if the database connected sucessfully or not
connect.then(()=> {
    console.log("Database Connected Sucessfully")
})
.catch(() =>{
    console.log("Database didnt connect properly")
})

// defines a schema for storing user information collected from the sign up process
const LoginSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true
    },
    lastName:{
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
    },
    verificationToken: {
        type: String,
        //required: true,
    },
    verificationStatus: {
        type: Boolean,
        //required: true,
        default: false
    },
    favoriteTeam: {
        type: Number,
        //required: true,
    },
    friendsList: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "users",
        default: [],
    },
    friendRequests: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "users",
        default: [],
    },
    ownLeaderboards: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "leaderboards",
        default: [],
    },
    memberLeaderboards: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "leaderboards",
        default: [],
    },
    leaderboardInvites: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "leaderboards",
        default: [],
    }
})


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
    },
    weekNumber: {
        type: String,
        //required: true,
    },
    scored: {
        type: Boolean,
        default: false
    },
    inGameSchema: {
        type: Boolean,
        default: false
    }
})

//defines a schema for the storing the points after scored
const ScoreSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    correctPoints: {
        type: Number,
        default: 0,
        required: true,
    },
    incorrectPoints: {
        type: Number,
        default: 0,
        required: true,
    },
    totalPoints: {
        type: Number,
        default: 0,
        required: true,
    },
    correctGames: {
        type: Number,
        default: 0,
        required: true,
    },
    incorrectGames: {
        type: Number,
        default: 0,
        required: true,
    }
})

const GameSchema = new mongoose.Schema ({
    gameId: {
        type: String,
        required: true,
        unique: true
    },
    homePicks: {
        type: Number,
        default: 0,
        required: true
    },
    awayPicks:{
        type: Number,
        default: 0,
        required: true
    },
    totalPicks: {
        type: Number,
        default: 0,
        required: true
    }
})

const LeaderboardSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
    },
    name:{
        type: String,
        required: true,
    },
    profileImage: {
        type: Number,
        //required: true,
    },
    members: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "users",
        default: [],
    },
    memberRequests: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "users",
        default: [],
    }
})

ScoreSchema.index({ correctPoints: -1 });

const User = new mongoose.model("users", LoginSchema)
const Picks = new mongoose.model("picks", PicksSchema)
const Score = new mongoose.model("score", ScoreSchema)
const gamePicksData = new mongoose.model("gamePicksData", GameSchema)
const Leaderboard = new mongoose.model("leaderboards", LeaderboardSchema)

module.exports = {User, Picks, Score, gamePicksData, Leaderboard}