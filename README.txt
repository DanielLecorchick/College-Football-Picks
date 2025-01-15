Run instructions:
To run the application, you will need to do "node server.js" in the terminal to run the server.
then go to http://localhost:3000/ on your browser and it should work. 
Please let me know if something does not. 

Some background: 
This project was started by Daniel Lecorchick and later on I added in my friend Micheal Burns to add new content into the website. We both independently work on each of our areas For example I developed signup/login process and picks while Micheal developed the "view details" addition within the picks as well as the Bingo game. 

Anyways back to the begining. Me and a few of my friends pick the winners of the top 25 college football teams in a google doc currently and then score this based off who is right and wrong on their picks.

We do games that include at least one top 25 team during the regular season, the Army vs Navy game, all conference championships, and all bowl and playoff games. Scoring works as the following 1 point for one top 25 team, 2 points for two top 25 teams, 2 points for conference championships, 2 points for Army vs Navy, and bowl games include all bowl game. Bowl games are scored as the following: .5 points for no top 25 teams, 1 point for one top 25 team, and 2 points for two top 25 teams. 
The goal of this application will allow an increase to scalability to add more people and automation to make the process easier as well as developing more posisbilities for future games involving college football. 

Brief Overview:
This application allows users to sign up, which then stores the user data in MongoDB and then login. Passwords are securely stored using bcrypt to hash the password.

The login and signup portion utilizes passport, and bcrypt. Passport authenticates requests, and bcrypt is a password hashing algorithm.

Once signed in the user is redirected to the homepage which prompts 4 different buttons (Make Picks, Current Top 25, Weekly Results, and Season Leaderboard), CSS will later be added.

Currently Make Picks and Current Top 25 are mostly complete, with Weekly Results and Season Leaderboard not started yet.

Within Make Picks it pulls data from ESPNs APIs and displays games. This application pulls data from ESPNs API every 10 minutes to ensure accurate data is displayed on the website. Actual logic to save a users picks has not been implimented yet as well as scoring.

Within Current Top 25 everything works perfectly, it displays a logo, rank, team name, and record. CSS has not been added yet however. 

Weekly Results has not be developed yet but will show each users record for the previous week.

Season Leaderboard has not be developed yet but will showcase each users total score for the season.

Later on I will utilize a Raspberry Pi to host the website as well as hosting a database for the website. This will be a custom built SQL Database.

If you wish to view the future goals for each member working on this website please go to GOALS.txt
