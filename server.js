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
const User = require("./database-config.js")

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
            name: req.body.name,
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

app.get('/leaderboard', checkAuthenticated, (req, res) => {
    res.render('leaderboard.ejs', {name: req.user.name, username: req.user.username})
})

app.get('/picks', checkAuthenticated, (req, res) => {
    res.render('picks.ejs', {name: req.user.name, username: req.user.username})
})

/*
app.post('/picks', checkAuthenticated, async(req,res) => {
    //something will be needed here to post the picks once the user makes/changes picks
})
*/

app.get('/weeklyresults', checkAuthenticated, (req, res) => {
    res.render('weeklyresults.ejs', {name: req.user.name, username: req.user.username})
})

app.get('/casino', checkAuthenticated, (req, res) => {
    res.render('casino.ejs', {name: req.user.name, username: req.user.username})
})

app.get('/details', checkAuthenticated, (req, res) => {
    const { homeTeam, awayTeam } = req.query;
    res.render('details.ejs', {name: req.user.name, username: req.user.username, homeTeam, awayTeam})
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

//404 error handling
app.use((req, res) => {
    res.status(404).send("Page Not Found");
})

//starts the server at localhost:3000
app.listen(3000)