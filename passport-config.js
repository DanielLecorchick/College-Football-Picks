// sets up passport with local authentication to authenticate users by username and passport by serealizing and deserealizing user information 


//add in logic so the code doesnt crash if someone uses an email that has already been used


// imports modules
const {authenticate} = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const {User} = require('./database-config')

// function to initilize passport within the local strategy
function initalize(passport) {
    // function to aithenticate user utilizing name and password
    const authenticateUser = async (username, password, done) => {
        try{
            // fetches the username to attempt to login a user by ensuring the username exists, and then by comparing passwords
            const user = await User.findOne({username})

            //checks if the user has verified their email
            if(user.verificationStatus === false){
                return done(null, false, {message: 'Please verify your email'})
            }

            //checks if there is a user with that username
            if(user == null){
                return done(null, false, {message: 'No user with that username'})
            }

            //checks if the password is correct according to the DB
            if(await bcrypt.compare(password, user.password)) {
                return done(null, user)
            }
            else{
                return done(null, false, {message: 'Password incorrect'})
            }
        }
        catch(error) {
            console.error('Error during authentication:', error)
            return done(error)
        }
    }
    passport.use(new LocalStrategy({usernameField: 'username'}, authenticateUser))

    // serializes a users information
    passport.serializeUser((user, done) => done(null, user.id))

    // deserealizes the users information 
    passport.deserializeUser(async (id, done) => {
        try{
            const user = await User.findById(id)
            if (!user) {
                console.log('User not found during deserialization')
                return done(new Error('User not found'), null)
            }
            done(null, user)
        }
        catch(error) {
            console.error('Error during deserialization:', error)
            return done(error, null)
        }
    })
}

module.exports = initalize