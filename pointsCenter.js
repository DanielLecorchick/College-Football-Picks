//this file will handle the scoring of the games and then storing them in the database

//imports database info
const {User, Picks, Score} = require('./database-config.js')

const gamesResponse = await fetch("https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard")
const gamesData = await gamesResponse.json()

//loops through games to score
gamesData.events.forEach(game => {

    //info to verify the game
    const isTop25Game = top25Teams.includes(homeTeam.team.id) || top25Teams.includes(awayTeam.team.id)
    const isThisWeek = gameDate >= startOfWeek && gameDate <= endOfWeek
    const isConferenceChampionship = (isWeek15 && gameDate >= startOfWeek && gameDate <= endOfWeek)
    const isArmyNavy = (homeTeam.team.name === 'Army' && awayTeam.team.name === 'Navy') || (homeTeam.team.name === 'Navy' && awayTeam.team.name === 'Army')
    const isBowlOrCFP = game.season.type === 3
    const isFCSGame = game.competitions[0].notes.some(note => note.headline === "FCS Championship") || game.competitions[0].notes.some(note => note.headline === "FCS Championship - Semifinals")


    if(isArmyNavy || isConferenceChampionship ){

    }
    else if(){

    }
    else if(){

    }
})