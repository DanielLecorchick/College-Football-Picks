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
const{User,Picks,Score,gamePicksData,Leaderboard}= require('./database-config.js')
const {fetchGamesToScore} = require('./pointsCenter.js')
const {sortLeaderboardMembers} = require('./pointsCenter')
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

        // Check for existing friend request or friendship
        if (viewingUser.friendRequests.some(id => id.equals(currentUserId))) {
            return res.status(400).json({ error: "Friend request already sent." })
        }

        if (viewingUser.friendsList.some(id => id.equals(currentUserId))) {
            return res.status(400).json({ error: "Already friends." })
        }

        if (currentUser.friendRequests.some(id => id.equals(viewingUserId))) {
            // Accept the friend request
            currentUser.friendsList.push(viewingUserId)
            viewingUser.friendsList.push(currentUserId)
            currentUser.friendRequests = currentUser.friendRequests.filter(id => !id.equals(viewingUserId))
        } else {
            // Send friend request
            viewingUser.friendRequests.push(currentUserId)
        }

        // Save updates
        await currentUser.save()
        await viewingUser.save()

        return res.status(200).json({ success: true })
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
        currentUser.friendsList = currentUser.friendsList.filter(id => !id.equals(viewingUserId))
        viewingUser.friendsList = viewingUser.friendsList.filter(id => !id.equals(currentUserId))

        // Remove any pending friend requests between the users
        currentUser.friendRequests = currentUser.friendRequests.filter(id => !id.equals(viewingUserId))
        viewingUser.friendRequests = viewingUser.friendRequests.filter(id => !id.equals(currentUserId))

        // Save changes
        await currentUser.save()
        await viewingUser.save()

        return res.status(200).json({ success: true })
    } 
    catch (error) {
        console.error("Error removing friend:", error)
        res.status(500).json({ error: "Internal server error." })
    }
})


app.post('/api/join-leaderboard', checkAuthenticated, async (req, res) => {
    const { userId, leaderboardId } = req.body;

    try {
        if (!userId || !leaderboardId) {
            return res.status(400).json({ error: 'User or leaderboard ID missing.' });
        }

        const user = await User.findById(userId);
        const leaderboard = await Leaderboard.findById(leaderboardId);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (!leaderboard) {
            return res.status(404).json({ error: 'Leaderboard not found.' });
        }

        if (leaderboard.memberRequests.some((id) => id.equals(userId))) {
            return res.status(400).json({ error: 'Request already sent.' });
        }

        if (leaderboard.members.some((id) => id.equals(userId))) {
            return res.status(400).json({ error: 'Already a member.' });
        }

        if (user.leaderboardInvites.some((id) => id.equals(leaderboardId))) {
            leaderboard.members.push(userId);
            user.memberLeaderboards.push(leaderboardId);
            user.leaderboardInvites = user.leaderboardInvites.filter((id) => !id.equals(leaderboardId));
        } 
        else {
            leaderboard.memberRequests.push(userId);
        }

        await user.save();
        await leaderboard.save();

        // Sort leaderboard members after joining
        await sortLeaderboardMembers(leaderboardId);

        res.status(200).json({ success: true });
    } 
    catch (error) {
        console.error('Error joining leaderboard:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.post('/api/invite-to-leaderboard', checkAuthenticated, async (req, res) => {
    const { userId, leaderboardId } = req.body;

    try {
        if (!userId || !leaderboardId) {
            return res.status(400).json({ error: 'User or leaderboard ID missing.' });
        }

        const user = await User.findById(userId);
        const leaderboard = await Leaderboard.findById(leaderboardId);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (!leaderboard) {
            return res.status(404).json({ error: 'Leaderboard not found.' });
        }

        if (user.leaderboardInvites.some((id) => id.equals(leaderboardId))) {
            return res.status(400).json({ error: 'Request already sent.' });
        }

        if (leaderboard.members.some((id) => id.equals(userId))) {
            return res.status(400).json({ error: 'Already a member.' });
        }

        if (leaderboard.memberRequests.some((id) => id.equals(userId))) {
            leaderboard.members.push(userId);
            user.memberLeaderboards.push(leaderboardId);
            user.leaderboardInvites = user.leaderboardInvites.filter((id) => !id.equals(leaderboardId))
            leaderboard.memberRequests = leaderboard.memberRequests.filter((id) => !id.equals(userId))
        } 
        else {
            user.leaderboardInvites.push(leaderboardId);
        }

        await user.save();
        await leaderboard.save();

        // Sort leaderboard members after joining
        await sortLeaderboardMembers(leaderboardId);

        res.status(200).json({ success: true });
    } 
    catch (error) {
        console.error('Error joining leaderboard:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

app.post('/api/leave-leaderboard', checkAuthenticated, async (req, res) => {
    const { userId, leaderboardId } = req.body

    try {
        if (!userId || !leaderboardId) {
            return res.status(400).json({ error: "Invalid user data." })
        }

        const user = await User.findById(userId)
        const leaderboard = await Leaderboard.findById(leaderboardId)

        if (!user || !leaderboard) {
            return res.status(404).json({ error: "User or leaderboard not found." })
        }

        // Ensure the user is currently a member
        if (!leaderboard.members.some(id => id.equals(userId))) {
            return res.status(400).json({ error: "User is not a member of this leaderboard." })
        }

        // Remove the user from the leaderboard's member list
        leaderboard.members = leaderboard.members.filter(id => !id.equals(userId))
        user.memberLeaderboards = user.memberLeaderboards.filter(id => !id.equals(leaderboardId))
        leaderboard.memberRequests = leaderboard.memberRequests.filter(id => !id.equals(userId))
        user.leaderboardInvites = user.leaderboardInvites.filter(id => !id.equals(leaderboardId))

        // Save updates to the database
        await leaderboard.save()
        await user.save()

        return res.status(200).json({ success: true, message: "Successfully left the leaderboard." })
    } 
    catch (error) {
        console.error("Error leaving leaderboard:", error)
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

        const userOwnedLeaderboards = []
        for (const leaderboardId of viewingUser.ownLeaderboards) {
            const leaderboard = await getLeaderboardById(leaderboardId)
            if (leaderboard) {
                userOwnedLeaderboards.push(leaderboard)
            }
        }

        const userMemberLeaderboards = []
        for (const leaderboardId of viewingUser.memberLeaderboards) {
            const leaderboard = await getLeaderboardById(leaderboardId)
            if (leaderboard) {
                userMemberLeaderboards.push(leaderboard)
            }
        }

        const userLeaderboardInvites = []
        for (const leaderboardId of viewingUser.leaderboardInvites) {
            const leaderboard = await getLeaderboardById(leaderboardId)
            if (leaderboard) {
                userLeaderboardInvites.push(leaderboard)
            }
        }

        res.render('profile.ejs', {
            user: req.user,
            viewingUser: viewingUser,
            friendsList: friendsList,
            friendRequests: friendRequests,
            userOwnedLeaderboards: userOwnedLeaderboards,
            userMemberLeaderboards: userMemberLeaderboards,
            userLeaderboardInvites: userLeaderboardInvites
        })
    } catch (error) {
        console.error("Error fetching user profile:", error)
        res.status(500).send("Internal Server Error")
    }
})

app.get('/leaderboards-id=:id', checkAuthenticated, async (req, res) => {
    try {
        const leaderboardId = req.params.id;
        const viewingLeaderboard = await Leaderboard.findById(leaderboardId);

        if (!viewingLeaderboard) {
            return res.status(404).send("Leaderboard not found");
        }

        const members = [];
        const memberScores = [];

        for (const memberId of viewingLeaderboard.members) {
            const member = await User.findById(memberId).select('_id favoriteTeam firstName lastName username');
            if (member) {
                members.push(member);

                const score = await Score.findOne({ userId: memberId });
                memberScores.push(score || null);
            }
        }

        res.render('private-leaderboard.ejs', {
            user: req.user,
            leaderboard: viewingLeaderboard,
            members: members,
            memberScores: memberScores,
        });
    } 
    catch (error) {
        console.error("Error fetching leaderboard data:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.get('/create-leaderboard', checkAuthenticated, async (req, res) => {
    const user = await User.findById(req.user._id)
    const fbsTeamsArray = Array.from(fbsTeams)
    res.render('create-leaderboard.ejs', { user: user, fbsTeams: fbsTeamsArray })
})

app.post('/create-leaderboard', checkAuthenticated, async(req,res) => {
    const {leaderboardName, profileImage} = req.body
    const user = await User.findById(req.user._id)

    try {
        //creates a new leaderboard and saves it into the DB
        const newLeaderboard = new Leaderboard({
            ownerId: req.user._id,
            name: leaderboardName,
            profileImage: profileImage,
            members: [req.user._id],
        })
        await newLeaderboard.save()

        user.ownLeaderboards.push(newLeaderboard._id)

        await user.save()

        console.log("Leaderboard created successfully")

        res.redirect(`/leaderboards-id=${newLeaderboard._id}`)
    }
    catch(error) {
        console.error("Error during leaderboard creation:", error)
        res.redirect('/create-leaderboard')
    }
})

app.post('/delete-leaderboard/:id', checkAuthenticated, async (req, res) => {
    const leaderboardId = req.params.id;

    try {
        // Find the leaderboard by ID and check if the current user is the owner
        const leaderboard = await Leaderboard.findById(leaderboardId);
        const userId = req.user._id

        if (!leaderboard) {
            return res.status(404).send("Leaderboard not found");
        }

        if (!leaderboard.ownerId.equals(userId)) {
            return res.status(403).send("Unauthorized: You can only delete your own leaderboards");
        }

        const user = await User.findById(userId);
        user.ownLeaderboards = user.ownLeaderboards.filter(
            (id) => !id.equals(leaderboardId)
        );
        await user.save();

        // Delete the leaderboard from the database
        await Leaderboard.findByIdAndDelete(leaderboardId);

        console.log("Leaderboard deleted successfully");
        res.redirect(`/profiles-user-id=${userId}`);
    } catch (error) {
        console.error("Error during leaderboard deletion:", error);
        res.status(500).send("Server error");
    }
});

app.get('/edit-leaderboard-id=:id', checkAuthenticated, async (req, res) => {
    const user = await User.findById(req.user._id)
    const leaderboard = await Leaderboard.findById(req.params.id)
    const fbsTeamsArray = Array.from(fbsTeams)

    if (!leaderboard) {
        console.log("Leaderboard not found");
        return res.redirect(`/homepage`);
    }

    // Check if the logged-in user is the owner of the leaderboard
    if (leaderboard.ownerId.toString() !== req.user._id.toString()) {
        console.log("User is not the owner of the leaderboard");
        return res.redirect(`/homepage`); // Redirect to homepage if not owner
    }

    const friendsList = []
    for (const friendId of user.friendsList) {
        const friend = await getUserById(friendId)
        if (friend) {
            friendsList.push(friend)
        }
    }

    const memberRequests = []
    for (const memberId of leaderboard.memberRequests) {
        const member = await getUserById(memberId)
        if (member) {
            memberRequests.push(member)
        }
    }

    const membersList = []
    for (const memberId of leaderboard.members) {
        const member = await getUserById(memberId)
        if (member) {
            membersList.push(member)
        }
    }

    res.render('edit-leaderboard.ejs', { 
        user: user,
        leaderboard: leaderboard,
        fbsTeams: fbsTeamsArray,
        friendsList: friendsList,
        memberRequests: memberRequests,
        membersList: membersList
     })
})

app.post('/edit-leaderboard-id=:id', checkAuthenticated, async (req, res) => {
    const {leaderboardName, profileImage} = req.body

    try {
        const leaderboard = await Leaderboard.findById(req.params.id)
        console.log(`leaderboard id: ${leaderboard._id}`)

        if (!leaderboard) {
            console.log("Leaderboard not found");
            return res.redirect(`/homepage`);
        }

        if (leaderboard.ownerId.toString() !== req.user._id.toString()) {
            console.log("User is not the owner of the leaderboard");
            return res.redirect(`/homepage`); // Redirect to homepage if not owner
        }

        leaderboard.name = leaderboardName
        leaderboard.profileImage = profileImage

        await leaderboard.save()
        console.log("Leaderboard updated successfully")
        res.redirect(`/leaderboards-id=${req.params.id}`) // redirect after successful save
    } 
    catch (error) {
        console.log("Error updating leaderboard", error)
        res.redirect(`/edit-leaderboard-id=${req.params.id}`) // handle the error and show it on the profile page
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
    } 
    catch (error) {
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

const getLeaderboardById = async (id) => {
    const leaderboard = await Leaderboard.findById(id)
    return leaderboard
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