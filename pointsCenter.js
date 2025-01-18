//this file will handle the scoring of the games and then storing them in the database

//imports database info
const {User, Picks, Score} = require('./database-config.js')

//pulls ranking data from ESPNs API
const rankingsResponse = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings")
const rankingsData = await rankingsResponse.json()
const top25Teams = rankingsData.rankings[0].ranks.map(rank => rank.team.id)

//pulls game data from ESPNs API
const gamesResponse = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard")
const gamesData = await gamesResponse.json()



async function fetchGamesToScore() {
    try{
        // pulls all the top 25 teams and ranking data from the rankings API
        const rankingsResponse = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/rankings")
        const rankingsData = await rankingsResponse.json()
        const top25Teams = rankingsData.rankings[0].ranks.map(rank => rank.team.id)

        // pulls the start and end date of the week 
        const season = rankingsData.rankings[0].season
        const startOfWeek = new Date(season.startDate)
        const endOfWeek  = new Date(season.endDate)

        // pulls game data such as match ups and times of games from the scorecoard API
        const gamesResponse = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard")
        const gamesData = await gamesResponse.json()

        const currentWeek = gamesData.week.number
        const isWeek15 = currentWeek === 15

        scoreGames(gamesData, top25Teams, startOfWeek, endOfWeek, isWeek15)
    }
    catch (error){
        console.error("Error fetching data:", error)
    }
}

function scoreGames(){
    //loops through all games
    gamesData.events.forEach(game => {
        //info to verify the game
        const gameDate = new Date(game.date);
        const homeTeam = game.competitions[0].competitors.find(competitor => competitor.homeAway === 'home');
        const awayTeam = game.competitions[0].competitors.find(competitor => competitor.homeAway === 'away');
        
        //extracts both teams scores from the api
        const homeTeamScore = homeTeam.score;
        const awayTeamScore = awayTeam.score;
    
        //verifies game is this week
        const isThisWeek = gameDate >= startOfWeek && gameDate <= endOfWeek
    
        //regular season and bowl game Scoring Logic including at least one top 25 team
        //two points
        const isTwoTop25Game = top25Teams.includes(homeTeam.team.id) && top25Teams.includes(awayTeam.team.id)
        //one point
        const isOneTop25Game = top25Teams.includes(homeTeam.team.id) || top25Teams.includes(awayTeam.team.id)
    
    
        //conference championship game check, all two points
        const isConferenceChampionship = (isWeek15 && gameDate >= startOfWeek && gameDate <= endOfWeek)
    
        //army vs navy game, two points
        const isArmyNavy = (homeTeam.team.name === 'Army' && awayTeam.team.name === 'Navy') || (homeTeam.team.name === 'Navy' && awayTeam.team.name === 'Army')
    
        //checks if the game is a bowl game, include all games .5 points for no top 25 teams
        const isBowlOrCFP = game.season.type === 3
    
        //filters out FCS games within the API
        const isFCSGame = game.competitions[0].notes.some(note => note.headline === "FCS Championship") || game.competitions[0].notes.some(note => note.headline === "FCS Championship - Semifinals")
        if (isFCSGame) return 
                    
        if(){
            // need logic for 
        }
    
    
    
    })
    

}
fetchGamesToScore()
setInterval(fetchGamesToScore(), 600000)
