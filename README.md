## College Football Picks
<p align="center">
<img src="https://raw.githubusercontent.com/DanielLecorchick/College-Football-Picks/refs/heads/main/public/images/dj-lagway-lagway.gif" alt="Lagway being the GOAT", class="center">!
</p>

# Table of Contents
- [Table of Contents](#table-of-contents)
- [What is College Football Picks?](#what-is-college-football-picks)
- [More Info](#more-info)
- [Future plans](#future-plans)
- [Creators Contributions](#creators-contributions)

# What is College Football Picks?
College Football Picks is an ejs-based web application utilizing Express.js that allows users to compete against their friends to score points by correctly predicting the outcome of specific College football games, or by gambling their previously earned points in the casino. It is intended to be used in a somewhat similar vein to fantasy football, fostering friendly competition over the subject matter of College football games. Currently, the games that are included are the following:

- All regular season games with a top 25 team
- All Bowl games
- Army vs Navy
- Conference Championships

Points scored for predicting the outcome of games are the following:

- **0.5 points** for a Bowl game with no top 25 teams
- **1 point** for a game with 1 top 25 team
- **1 point** for a Bowl game with 1 top 25 team
- **2 points** for a game with 2 top 25 teams
- **2 points** for a conference championship
- **2 points** for Army vs Navy
- **2 points** for a Bowl game with 2 top 25 teams

The goal of creating this as a web application will be to increase the scalability of the project, which will facilitate adding more people to our game, as well as to automate the whole process so we can get back to worrying about football instead of spreadsheets.

# More Info
Our application uses a Raspberry Pi 5 to host the webpage and an SQL database where information is stored. Passwords are securely stored and hashed using bcrypt. The login and signup portion utilizes passport, which authenticates requests, and facilitates the use of bcrypt as our hashing algorithm.

Information about games is pulled from ESPNs API every 10 minutes to ensure that accurate data is displayed on all pages.

We used the Express.js framework from Node.js to power the application, and most of the programming was done in Embedded JavaScript, CSS, and Javascript

# Future plans
- CSS needs to be developed for most pages
- Casino feature needs to be implemented
- Picks need to be made functional
- Raspberry Pi needs to be setup
- SQL database needs to be setup
- Leaderboard needs to be developed and show previous weeks results
- Minor QOL improvements should be added to login page
- Details needs to be fixed for future games
- Possibly add AI integration with picks??

# Creators Contributions
1. Dan Lecorchick
    1. Signup/login process though MongoDB
    2. Picks page
    3. Home page
    4. Ranking page
2. Michael Burns
   1. Details page
   2. Casino page