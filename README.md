## College Football Picks
<p align="center">
<img src="https://raw.githubusercontent.com/DanielLecorchick/College-Football-Picks/refs/heads/main/public/images/dj-lagway-lagway.gif" alt="Lagway being the GOAT", class="center">!
</p>

# Table of Contents
- [Table of Contents](#table-of-contents)
- [What is College Football Picks?](#what-is-college-football-picks)
- [More Info](#more-info)
- [How To Run](#how-to-run)
- [Future plans](#future-plans)
- [Creators Contributions](#creators-contributions)

# What is College Football Picks?
College Football Picks is an ejs-based web application utilizing Express.js that allows users to compete against their friends to score points by correctly predicting the outcome of specific College football games, or by gambling their previously earned points in the casino. It is intended to be used in a somewhat similar vein to fantasy football, fostering friendly competition over the subject matter of College football games. Currently, the games that are included are the following:

- All regular season games with a top 25 team
- Conference Championships
- Army vs Navy
- All Bowl and College Football Playoff games

Points scored for predicting the outcome of games are the following:

- **0.5 points** for a Bowl game with no top 25 teams
- **1 point** for a regular season game with 1 top 25 team
- **1 point** for a Bowl game with 1 top 25 team
- **2 points** for a reagular season game with 2 top 25 teams
- **2 points** for a conference championship
- **2 points** for Army vs Navy
- **2 points** for a Bowl game with 2 top 25 teams

The goal of creating this as a web application will be to increase the scalability of the project, which will facilitate adding more people to our game, as well as to automate the whole process so we can get back to worrying about football instead of spreadsheets.

# More Info
Our application uses a Raspberry Pi 5 to host the webpage and an SQL database where information is stored. Passwords are securely stored and hashed using bcrypt. The login and signup portion utilizes passport, which authenticates requests, and facilitates the use of bcrypt as our hashing algorithm.

Information about games and rankings is pulled from ESPNs API every 10 minutes to ensure that accurate data is displayed on all pages.

We used the Express.js framework from Node.js to power the application, and most of the programming was done in Embedded JavaScript, CSS, and Javascript.

# How To Run
If you want to run the application locally:
1. Download the zip of the [Code](https://github.com/DanielLecorchick/College-Football-Picks/archive/refs/heads/main.zip)
2. Unzip the zip file, open the College-Football-Picks-main folder, click in the address bar to highlight the file path, and copy it to clipboard for later
3. Install [Node.js](https://nodejs.org/en/download)
4. Open any terminal, such as command prompt, and navigate through your file directory to the College-Football-Picks-main folder using the file path we saved earlier, and the cd command. It should look something like this
    ```sh
    cd C:/Users/LocalUser/Downloads/College-Football-Picks-main
    ```
5. Now that you are in the correct directory, run the command
   ```sh
    node server.js
    ```
6. The local server is now running. Open any web browser and go to http://localhost:3000/, and you should be able to access the website with full functionality!

# Future plans
- CSS needs to be developed for most pages
- Casino feature needs to be implemented
- Picks need to be made functional
- Raspberry Pi needs to be setup
- SQL database needs to be setup
- Leaderboard needs to be developed and show previous weeks results
- Minor QOL improvements should be added to login page
- Details needs to be fixed for future games
- Possibly add AI integration to predict winners and losers of games

# Creators Contributions
1. Daniel Lecorchick
    1. Set up Node.js server utilizing the Express framework for authentication, routing, and rendering
    2. Signup/login process utlizing bcrypt and passport
    3. Signup/login CSS
    4. Set up MongoDB Database and database-config
    5. Storing User Data, Picks Data, and Scoring data in MongoDB
    6. Homepage logic to route users
    7. Picks page logic utilizing ESPN's API
    8. Ranking page logic utilizing ESPN's API
    9. Scoring logic for games
    10. Leaderboard page logic displaying each users points
2. Michael Burns
   1. Details page logic using ESPN's API
   2. Casino page logic/pulling from and storing data in MongoDB
   3. Picks CSS
   4. Top 25 CSS
   5. Details CSS
   6. README