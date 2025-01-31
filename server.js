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
const crypto = require('crypto')

//imports from files in the rest of the app
const{User,Picks,Score,gamePicksData}= require('./database-config.js')
const {fetchGamesToScore} = require('./pointsCenter.js')
const fbsTeams = require('./fbsTeams.js')
const {sendEmail} = require('./emailVerification.js')


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
    res.render('homepage.ejs', {name: req.user.name, user: req.user})
})

//login route
app.get('/login', checkNotAuthenticated, (req,res)=> {
    res.render('login.ejs')
})

//login submission 
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/homepage', 
    failureRedirect: '/login', 
    failureFlash: true,
    failureMessage: 'Invalid username or password.'
}))

//signup route
app.get('/signup', checkNotAuthenticated, (req,res)=> {
    const fbsTeamsArray = Array.from(fbsTeams)
    
    const flashMessages = {
        errors: req.flash('error'),
        success: req.flash('success')
    }

    res.render('signup.ejs', {fbsTeams: fbsTeamsArray, messages: flashMessages})
})

app.get('/api/fbsTeams', checkNotAuthenticated, (req,res)=> {
    res.json([...fbsTeams])
})

//signup submission
app.post('/signup', checkNotAuthenticated, async(req,res) => {
    if(req.body.password !== req.body['confirm-password']) {
        req.flash('error', 'Passwords do not match')
        return res.redirect('/signup')
    }
    try {
        //error handling if a user already has that username
        const existingUsername = await User.findOne({username: req.body.username})
        if (existingUsername) {
            req.flash('error', 'Username is already taken.')
            return res.redirect('/signup')
        }
        //error handling if a email is already being used
        const existingEmail = await User.findOne({email: req.body.email})
        if (existingEmail) {
            req.flash('error', 'Email is already registered.')
            return res.redirect('/signup')
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        //creates a new user and saves them into the DB
        const newUser = new User({
            firstName: req.body.firstName,
            lastName:req.body.lastName,
            username: req.body.username,
            email: req.body.email,
            favoriteTeam: req.body.favoriteTeam,
            password: hashedPassword,
            verificationToken: crypto.randomBytes(32).toString('hex'),
            verificationStatus: false,
        })
        await newUser.save()

        //sends an email to the new user to allow them to verify their account
        await sendEmail(newUser)

        //redirects the user once they sign up
        res.redirect('/login')
    }
    catch(error) {
        console.error("Error during signup:", error)
        res.redirect('/signup')
    }
})

app.get('/emailVerification', async(req, res) =>{
    const {token} = req.query

    try {
        //finds a users verification token, update the verification status, and save the update
        const user = await User.findOne({verificationToken: token})
        user.verificationStatus = true
        await user.save()

        res.redirect('/login')
    }
    catch (error) {
        console.error("Error in the email verification:", error)
    }

})


// renders pages if authenticated
app.get('/homepage', checkAuthenticated, (req,res) =>{
    res.render('homepage.ejs', {name: req.user.name, username: req.user.username, user: req.user})
})

app.get('/top25', checkAuthenticated, (req, res) => {
    res.render('top25.ejs', {name: req.user.name, username: req.user.username, user: req.user})
})

app.get('/leaderboard', checkAuthenticated, async(req, res) => {
    //fetches data from the score schema
    const leaderboard = await Score.find()
        .populate('userId', 'firstName lastName username favoriteTeam')
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
            userID : user,
            correctPoints,
            incorrectPoints,
            totalPoints,
            correctGames,
            incorrectGames
        }
    })
    res.render('leaderboard.ejs', {name: req.user.name, username: req.user.username, user: req.user, leaderboard: leaderboardInfo})
})

app.get('/api/leaderboard', checkAuthenticated, async(req, res) => {
    //fetches data from the score schema
    const leaderboard = await Score.find()
        .populate('userId', 'firstName lastName username favoriteTeam')
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
            userID : user,
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
    res.render('picks.ejs', {name: req.user.name, username: req.user.username, user: req.user})
})

//api to get the individual users picks in order to display them as they update
app.get('/api/picks', checkAuthenticated, async (req, res) => {

    const userId = req.user._id
    const userPicks = await Picks.find({userId}).lean()

    res.json(userPicks)
})

app.get('/api/gameData', checkAuthenticated, async (req, res) =>{
    
    const games = await gamePicksData.find().lean()

    res.json(games)
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
    res.render('weeklyresults.ejs', {name: req.user.name, username: req.user.username, user: req.user})
})

app.get('/casino', checkAuthenticated, (req, res) => {
    const bettingApiKey = process.env.BETTING_API_KEY
    res.render('casino.ejs', {name: req.user.name, username: req.user.username, user: req.user, bettingApiKey: bettingApiKey})
})

app.get('/details', checkAuthenticated, (req, res) => {
    const { homeTeam, awayTeam } = req.query
    res.render('details.ejs', {name: req.user.name, username: req.user.username, user: req.user, homeTeam, awayTeam})
})

app.post('/api/add-friend', checkAuthenticated, async (req, res) => {
    const {currentUserId, viewingUserId} = req.body

    try {
        if (!currentUserId || !viewingUserId) {
            return res.status(400).json({ error: "Invalid user data." })
        }

        const currentUser = await User.findById(currentUserId)
        const viewingUser = await User.findById(viewingUserId)

        if (!currentUser || !viewingUser) {
            return res.status(404).json({ error: "User not found." })
        }

        if(viewingUser.friendRequests.includes(currentUserId)) {
            return res.status(404).json({ error: "Already sent request" })
        }

        if(viewingUser.friendsList.includes(currentUserId)) {
            return res.status(404).json({ error: "Already friends" })
        }

        if(currentUser.friendRequests.includes(viewingUserId)) {
            currentUser.friendsList.push(viewingUserId)
            viewingUser.friendsList.push(currentUserId)
            currentUser.friendRequests = currentUser.friendRequests.filter(
                id => id.toString() !== viewingUserId
            )
        }
        else {
            viewingUser.friendRequests.push(currentUserId)
        }

        // Save updates to the database
        await currentUser.save()
        await viewingUser.save()

        res.status(200).json({ success: true })
    } 
    catch (error) {
        console.error("Error adding friend:", error)
        res.status(500).json({ error: "Internal server error." })
    }
})

app.post('/api/remove-friend', checkAuthenticated, async (req, res) => {
    const { currentUserId, viewingUserId } = req.body

    try {
        if (!currentUserId || !viewingUserId) {
            return res.status(400).json({ error: "Invalid user data." })
        }

        const currentUser = await User.findById(currentUserId)
        const viewingUser = await User.findById(viewingUserId)

        if (!currentUser || !viewingUser) {
            return res.status(404).json({ error: "User not found." })
        }

        // Remove the friend from both lists if they exist
        currentUser.friendsList = currentUser.friendsList.filter(
            id => id.toString() !== viewingUserId
        )
        viewingUser.friendsList = viewingUser.friendsList.filter(
            id => id.toString() !== currentUserId
        )
        currentUser.friendRequests = currentUser.friendRequests.filter(
            id => id.toString() !== viewingUserId
        )
        viewingUser.friendRequests = viewingUser.friendRequests.filter(
            id => id.toString() !== currentUserId
        )

        await currentUser.save()
        await viewingUser.save()

        res.status(200).json({ success: true })
    } 
    catch (error) {
        console.error("Error removing friend:", error)
        res.status(500).json({ error: "Internal server error." })
    }
})

app.get('/profiles-user-id=:id', checkAuthenticated, async (req, res) => {
    try {
        const userId = req.params.id
        const viewingUser = await User.findById(userId)

        if (!viewingUser) {
            return res.status(404).send("User not found")
        }

        const friendsList = []
        for (const friendId of viewingUser.friendsList) {
            const friend = await getUserById(friendId)
            if (friend) {
                friendsList.push(friend)
            }
        }

        const friendRequests = []
        for (const friendId of viewingUser.friendRequests) {
            const friend = await getUserById(friendId)
            if (friend) {
                friendRequests.push(friend)
            }
        }

        res.render('profile.ejs', {
            user: req.user,
            viewingUser: viewingUser,
            friendsList: friendsList,
            friendRequests: friendRequests
        })
    } catch (error) {
        console.error("Error fetching user profile:", error)
        res.status(500).send("Internal Server Error")
    }
})

app.get('/searchUser', async (req, res) => {
    const {username} = req.query
    
    try {
        const user = await User.findOne({username})
        
        if (!user) {
            return res.status(404).json({message: "User not found"})
        }
        
        // Send the user ID back to the frontend
        res.json({userId: user._id})
    } 
    catch (error) {
        console.error("Error searching user:", error)
        res.status(500).json({message: "Internal Server Error"})
    }
})

app.get('/edit-account', checkAuthenticated, async (req, res) => {
    const user = await User.findById(req.user._id)
    const fbsTeamsArray = Array.from(fbsTeams)
    res.render('edit-account.ejs', { user: user, fbsTeams: fbsTeamsArray })
})

app.post('/edit-account', checkAuthenticated, async (req, res) => {
    const { firstName, lastName, username, favoriteTeam, password, confirmPassword } = req.body

    if (password !== confirmPassword) {
        console.log("Passwords do not match")
        return res.redirect('/edit-account')
    }

    try {
        const user = await User.findById(req.user._id)
        console.log(`user id: ${user._id}`)

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            console.log("Incorrect password entered")
            return res.redirect('/edit-account')  // redirect back with an error message
        }

        user.firstName = firstName
        user.lastName = lastName
        user.username = username
        user.favoriteTeam = favoriteTeam

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10)
            user.password = hashedPassword
        }

        await user.save()
        console.log("Profile updated successfully")
        res.redirect('/edit-account') // redirect after successful save
    } catch (error) {
        console.log("Error updating profile", error)
        res.redirect('/edit-account') // handle the error and show it on the profile page
    }
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
    res.status(404).send("Page Not Found")
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