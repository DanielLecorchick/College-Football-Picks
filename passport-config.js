// sets up passport with local authentication to authenticate users by username and passport by serealizing and deserealizing user information 

// imports modules
const {authenticate} = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

// function to initilize passport within the local strategy
function initalize(passport, getUserByUsername, getUserById) {
    // function to aithenticate user utilizing name and password
    const authenticateUser = async (username, password, done) => {
        try{
            // fetches the username to attempt to login a user by ensuring the username exists, and then by comparing passwords
            const user = await getUserByUsername(username)
            if(user == null){
                return done(null, false, {message: 'No user with that username'})
            }
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
            const user = await getUserById(id)
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