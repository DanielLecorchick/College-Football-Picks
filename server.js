if(process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

// imports required modules
const express = require('express')
const app = express()
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

//imports from files in the rest of the app
const{User,Picks,Score}= require('./database-config.js')
const {fetchGamesToScore} = require('./pointsCenter')

// imports and configures the passport config
const initalizePassport = require('./passport-config')
const {name} = require('ejs')
initalizePassport(
    passport, 
    async(username) => await User.findOne({username}), 
    async(id) => await User.findById(id)
)

//sets up a view engine
app.set('view-engine', 'ejs')

//middleware
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(flash())
app.use(session({secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))
app.use(express.static('public'))

// only allows users to be routed to homepage if authenticated
app.get('/', checkAuthenticated, (req, res)=> {
    res.render('homepage.ejs', {name: req.user.name})
})

//login route
app.get('/login', checkNotAuthenticated, (req,res)=> {
    res.render('login.ejs')
})

//login submission 
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/homepage', 
    failureRedirect: '/login', 
    failureFlash: true
}))

//signup route
app.get('/signup', checkNotAuthenticated, (req,res)=> {
    res.render('signup.ejs')
})

//signup submission
app.post('/signup', checkNotAuthenticated, async(req,res) => {
    if(req.body.password !== req.body['confirm-password']) {
        req.flash('error', 'Passwords do not match')
        return res.redirect('/signup')
    }
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const newUser = new User({
            firstName: req.body.firstName,
            lastName:req.body.lastName,
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        })
        await newUser.save()
        res.redirect('/login')
    }
    catch(error) {
        console.error("Error during signup:", error)
        res.redirect('/signup')
    }
})

// renders pages if authenticated
app.get('/homepage', checkAuthenticated, (req,res) =>{
    res.render('homepage.ejs', {name: req.user.name, username: req.user.username})
})

app.get('/top25', checkAuthenticated, (req, res) => {
    res.render('top25.ejs', {name: req.user.name, username: req.user.username})
})

app.get('/leaderboard', checkAuthenticated, async(req, res) => {
    //fetches data from the score schema
    const leaderboard = await Score.find()
        .populate('userId', 'firstName lastName username')
        .sort({correctPoints: -1})

    //maps all the data from the database
    const leaderboardInfo = leaderboard.map((entry, index) => {
        const user = entry.userId
        const correctPoints = entry.correctPoints
        const incorrectPoints = entry.incorrectPoints
        const totalPoints = entry.totalPoints
        const correctGames = entry.correctGames
        const incorrectGames = entry.incorrectGames

        //returns leaderboard info
        return{
            rank: index + 1,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            correctPoints,
            incorrectPoints,
            totalPoints,
            correctGames,
            incorrectGames
        }
    })
    res.render('leaderboard.ejs', {name: req.user.name, username: req.user.username, leaderboard: leaderboardInfo})
})

app.get('/api/leaderboard', checkAuthenticated, async(req, res) => {
    //fetches data from the score schema
    const leaderboard = await Score.find()
        .populate('userId', 'firstName lastName username')
        .sort({correctPoints: -1})

    //maps all the data from the database
    const leaderboardInfo = leaderboard.map((entry, index) => {
        const user = entry.userId
        const correctPoints = entry.correctPoints
        const incorrectPoints = entry.incorrectPoints
        const totalPoints = entry.totalPoints
        const correctGames = entry.correctGames
        const incorrectGames = entry.incorrectGames

        //returns leaderboard info
        return{
            rank: index + 1,
            name: user.name,
            correctPoints,
            incorrectPoints,
            totalPoints,
            correctGames,
            incorrectGames
        }
    })
    res.json(leaderboardInfo)
})

app.get('/picks', checkAuthenticated, (req, res) => {
    res.render('picks.ejs', {name: req.user.name, username: req.user.username})
})


app.post('/picks', checkAuthenticated, async(req,res) => {
    const {gameId,pick} = req.body

    const userId = req.user._id
    
    try{
        const existingPick = await Picks.findOne({userId, gameId})

        if(existingPick) {
            existingPick.pick = pick
            await existingPick.save()
        }
        else {
            const newPick =new Picks({
                userId,
                gameId,
                pick
            })
            await newPick.save()
        }
        res.redirect('/picks')
    }
    catch(error) {
        console.error("error with picks", error)
    }
})


app.get('/weeklyresults', checkAuthenticated, (req, res) => {
    res.render('weeklyresults.ejs', {name: req.user.name, username: req.user.username})
})

app.get('/casino', checkAuthenticated, (req, res) => {
    const bettingApiKey = process.env.BETTING_API_KEY
    res.render('casino.ejs', {name: req.user.name, username: req.user.username, bettingApiKey: bettingApiKey})
})

app.get('/details', checkAuthenticated, (req, res) => {
    const { homeTeam, awayTeam } = req.query;
    res.render('details.ejs', {name: req.user.name, username: req.user.username, homeTeam, awayTeam})
})

app.get('/profile', checkAuthenticated, (req, res) => {
    res.render('profile.ejs', {name: req.user.name, username: req.user.username})
})
//logout route 
app.delete('/logout', (req, res) => {
    req.logOut()
    res.redirect('/login')
})

//checks if user is authenticated
function checkAuthenticated(req,res,next) {
    if(req.isAuthenticated()){
        return next()
    }
    res.redirect('/login')
}

//checks if user isnt authenticated
function checkNotAuthenticated(req,res,next) {
    if(req.isAuthenticated()){
        return res.redirect('/')
    }
    next()
}

const getUserByUsername = async (username) => {
    const user = await User.findOne({username})
    return user
}

const getUserById = async (id) => {
    const user = await User.findById(id)
    return user
}

//404 error handling
app.use((req, res) => {
    res.status(404).send("Page Not Found");
})

/*
//FIX: the scoring is running dispite it not being 3am rn 
//runs the scoring of games every day at 3am
const timeNow = new Date()
const threeAM = new Date()
threeAM.setHours(3,0,0,0)

if(timeNow > threeAM) threeAM.setDate(threeAM.getDate() + 1)

const delay = threeAM - timeNow
setTimeout(() => {
    fetchGamesToScore()
    setInterval(fetchGamesToScore, 86400000)
}, delay)
*/

//for testing
fetchGamesToScore()
setInterval(fetchGamesToScore,10000)

//starts the server at localhost:3000
app.listen(3000)