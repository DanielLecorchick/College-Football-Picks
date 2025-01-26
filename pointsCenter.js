//FINISHME:Tomorrow work on implimente updated scoring for games I dont believe this will be able to be fully tested?
//1 point for one top 25 team, 2 points for two top 25 reams, 3 points for top 10 and 4 points for top 5
//then scale those points by basepoints*(favorite probability/underdog probability) with a max of 10 times the original base points


//this file will handle the scoring of the games and then storing them in the database

//imports database info
const {User, Picks, Score, gamePicksData} = require('./database-config.js')

//variable used to ensure the scoring is never done multiple times concurently
let isScoringInProgress = false

//function to fetch game and ranking data from ESPN API
async function fetchGamesToScore() {

    if (isScoringInProgress) return

    try{
        isScoringInProgress = true
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
        console.error("Error fetching data in points center:", error)
    }
    finally {
        isScoringInProgress = false
    }
}

async function scoreGames(gamesData, top25Teams, startOfWeek, endOfWeek, isWeek15){

    const users = await User.find()

    //loops through all games
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
        //const isTop5Game = 
        //const isTop10Game = 
        const isTwoTop25Game = top25Teams.includes(homeTeam.team.id) && top25Teams.includes(awayTeam.team.id)
        const isOneTop25Game = top25Teams.includes(homeTeam.team.id) || top25Teams.includes(awayTeam.team.id)
        const isConferenceChampionship = (isWeek15 && gameDate >= startOfWeek && gameDate <= endOfWeek)
        const isArmyNavy = (homeTeam.team.name === 'Army' && awayTeam.team.name === 'Navy') || (homeTeam.team.name === 'Navy' && awayTeam.team.name === 'Army')
        const isBowlOrCFP = game.season.type === 3
    
        //filters out FCS games within the API
        if (game.competitions[0].notes.some(note => note.headline.includes("FCS Championship"))) {
            continue
        }

        //UPDATE ME: later on change this to basepoints given the game
        //assigns point values to each game
        let points = 0
        //if (isTop5Game) points = 4
        //else if(isTop10Game) points = 3
        if(isConferenceChampionship || isArmyNavy || isTwoTop25Game) points = 2
        else if(isOneTop25Game) points = 1
        else if(isBowlOrCFP) points = .5

        //loops through all users
        for(const user of users) {
            //gets users picks from DB or continues if the user forgot a pick
            const userPick = await Picks.findOne({gameId: game.id, userId: user._id})

            if(!userPick || userPick.inGameSchema) continue

            //logic to get the total number of picks for each game
            if((userPick && userPick.inGameSchema === false) && (userPick.pick === "homeTeam")) {
                //updates or creates the game data
                await gamePicksData.updateOne(
                    {userId: user._id},
                    {$inc: {homePicks: 1}},
                    {$inc: {totalPicks: 1}},
                    {upsert:true}
                ) 

                //sets it to true that the game has been put into the GameSchema
                await Picks.updateOne(
                    {_id: userPick._id},
                    {$set:{inGameSchema: true}}
                )
            }
            else if ((userPick && userPick.inGameSchema === false) && (userPick.pick === "awayTeam")) {
                //updates or creates the game data
                await gamePicksData.updateOne(
                    {userId: user._id},
                    {$inc: {awayPicks: 1}},
                    {$inc: {totalPicks: 1}},
                    {upsert:true}
                ) 
            
                //sets it to true that the game has been put into the GameSchema
                await Picks.updateOne(
                    {_id: userPick._id},
                    {$set:{inGameSchema: true}}
                )
            }
            else {
                continue
            }

            if(!userPick || userPick.scored === true || game.status.type.state === "pre" || game.status.type.state === "in") {
                continue
            }
            else if (game.status.type.state === "post") {
                const correctPick = ((homeTeamScore > awayTeamScore) && userPick.pick ==="homeTeam") || ((homeTeamScore < awayTeamScore) && userPick.pick ==="awayTeam")
                const incorrectPick = !correctPick
                
                //sets what will be updated given the game outcome
                const updates = {}
                if(correctPick) {
                    user.correctGames = 1
                    updates.correctPoints = points
                    updates.totalPoints = points
                }
                else if(incorrectPick) {
                    user.incorrectGames = 1
                    updates.incorrectPoints = points
                    updates.totalPoints = points
                }

                //updates or creates a users pick totals
                await Score.updateOne(
                    {userId: user._id},
                    {$inc: updates},
                    {upsert:true}
                )

                await Picks.updateOne(
                    {_id: userPick._id}, 
                    {$set:{scored: true}}
                )
            }
            else {
                continue
            }
        }
    }
}

//exports this file so it can be used in the rest of the code
module.exports = {fetchGamesToScore}