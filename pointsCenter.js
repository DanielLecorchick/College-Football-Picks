//FINISHME:I think this file is mostly done it just needs some testing and probably bugfixes I should finish this tomorrow


//this file will handle the scoring of the games and then storing them in the database

//imports database info
const {User, Picks, Score} = require('./database-config.js')

//function to fetch game and ranking data from ESPN API
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

async function scoreGames(gamesData, top25Teams, startOfWeek, endOfWeek, isWeek15){
    //loops through all games
    //gamesData.events.forEach(game => {
    for (const game of gamesData.events){
        //info to verify the game
        const gameDate = new Date(game.date)
        const homeTeam = game.competitions[0].competitors.find(competitor => competitor.homeAway === 'home')
        const awayTeam = game.competitions[0].competitors.find(competitor => competitor.homeAway === 'away')
        
        //extracts both teams scores from the api
        const homeTeamScore = parseInt(homeTeam.score)
        const awayTeamScore = parseInt(awayTeam.score)
    
        //verifies game is this week
        const isThisWeek = gameDate >= startOfWeek && gameDate <= endOfWeek
        const isTwoTop25Game = top25Teams.includes(homeTeam.team.id) && top25Teams.includes(awayTeam.team.id)
        const isOneTop25Game = top25Teams.includes(homeTeam.team.id) || top25Teams.includes(awayTeam.team.id)
        const isConferenceChampionship = (isWeek15 && gameDate >= startOfWeek && gameDate <= endOfWeek)
        const isArmyNavy = (homeTeam.team.name === 'Army' && awayTeam.team.name === 'Navy') || (homeTeam.team.name === 'Navy' && awayTeam.team.name === 'Army')
        const isBowlOrCFP = game.season.type === 3
    
        //filters out FCS games within the API
        const isFCSGame = game.competitions[0].notes.some(note => note.headline === "FCS Championship") || game.competitions[0].notes.some(note => note.headline === "FCS Championship - Semifinals")
        if (isFCSGame) continue 
        
        //assigns point values to each game
        let points = 0
        if(isConferenceChampionship || isArmyNavy || isTwoTop25Game) points = 2
        else if(isOneTop25Game) points = 1
        else if(isBowlOrCFP) points = .5

        //gets users picks from DB or continues if the user forgot a pick
        const userPick = await Picks.findOne({gameId: game.id})
        if(!userPick) continue

        const correctPick = ((homeTeamScore > awayTeamScore) && userPick ==="homeTeam") || ((homeTeamScore < awayTeamScore) && userPick ==="awayTeam")
        const incorrectPick = ((homeTeamScore > awayTeamScore) && userPick ==="awayTeam") || ((homeTeamScore < awayTeamScore) && userPick ==="homeTeam")

        const update = {
            totalPoints: points
        }
        if(correctPick) {
            update.correctPoints = points
            update.totalPoints = points
        }
        else if(incorrectPick) {
            update.incorrectPoints = points
            update.totalPoints = points
        }

        await Score.updateOne(
            {userId: userPick.userId},
            {$inc: update},
            {upsert:true}
        )
    }
}
fetchGamesToScore()
setInterval(fetchGamesToScore, 600000)
