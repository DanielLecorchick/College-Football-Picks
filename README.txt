Run instructions:
To run the application, you will need to do "node server.js" in the terminal to run the server.
then go to http://localhost:3000/ on your browser and it should work. 
Please let me know if something does not. 

Some background: 
Me and a few of my friends pick the winners of the top 25 college football teams in a google doc currently and then score this based off who is right and wrong on their picks. 
We do games that include at least one top 25 team during the regular season, the Army vs Navy game, all conference championships, and all bowl and playoff games. 
This application is solely developed by me and will allow an increase to scalability to add more people and automation to make the process easier. 

Brief Overview:
This application allows users to sign up, which then stores the user data in MongoDB and then login. Passwords are securely stored using bcrypt to hash the password.

The login and signup portion utilizes passport, and bcrypt. Passport authenticates requests, and bcrypt is a password hashing algorithm.

Once signed in the user is redirected to the homepage which prompts 4 different buttons (Make Picks, Current Top 25, Weekly Results, and Season Leaderboard), CSS will later be added.
Currently Make Picks and Current Top 25 are mostly complete, with Weekly Results and Season Leaderboard not started yet.

Within Make Picks it pulls data from ESPNs APIs and displays games.
Since it it bowl season right now it includes all FBS Bowl games and College Football Playoff Matchups.
This does update automatically and work, I tested this with the conclusion of the CFP quarter final games.
Actual logic to save a users picks has not been implimented yet as well as scoring.

Within Current Top 25 everything works perfectly, it displays a logo, rank, team name, and record. CSS has not been added yet however. 

Weekly Results will show each users record for the previous week.

Season Leaderboard will showcase each users total score for the season.

Later on I will utilize a Raspberry Pi to host the website for access anytime anywhere. 
