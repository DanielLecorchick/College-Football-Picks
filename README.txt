To run the application, you will need to do "node server.js" in the terminal 
then go to http://localhost:3000/ on your browser and it should work please let me know if something does not. 

This application allows users to sign up, which then stores the user data in MongoDB and then sign in. 

This program utilizes passport, and bcrypt. Passport authenticates requests, and bcrypt is a password hashing algorithm.

Once signed in the user is redirected to the homepage which prompts 4 different buttons (Make Picks, Current Top 25, Weekly Results, and Season Leaderboard), CSS will later be added.
Currently Make Picks and Current Top 25 are mostly complete, with Weekly Results and Season Leaderboard not started yet.

Within Make Picks it pulls data from ESPNs APIs and displays games, since it it bowl season right now it includes all FBS Bowl games and College Football Playoff Matchups.
This does update automatically and work, I tested this with the conclusion of the CFP quarter final games.
Actual logic to save a users picks has not been implimented yet.

Within Current Top 25 everything works perfectly, it displays a logo, rank, team name, and record. CSS has not been added yet however. 

