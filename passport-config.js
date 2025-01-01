const {authenticate} = require('passport')

const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')


function initalize(passport, getUserByUsername, getUserById) {
    const authenticateUser = async (username, password, done) => {
        try{
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
    passport.serializeUser((user, done) => done(null, user.id))
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