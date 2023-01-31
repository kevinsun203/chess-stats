const express = require("express");
const axios = require('axios');
const fsPromises = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: false }));

// Upon receiving a request for player data
app.post('/api/get-player-data', async (req, res) => {

    //Gets the player's profile data along with their play statistics 
    try {
        const playerData = await axios.get(`https://api.chess.com/pub/player/${req.body}`);
        const playerStats = await axios.get(`https://api.chess.com/pub/player/${req.body}/stats`);
        const playerClubs = await axios.get(`https://api.chess.com/pub/player/${req.body}/clubs`);

        // Combines profile data and play statistics
        let keys = Object.keys(playerStats.data);
        for (var i = 0; i < keys.length; i++) {
            let key = keys[i];
            playerData.data[key] = playerStats.data[key];
        }

        // Combines profile data, player stats with associated clubs
        keys = Object.keys(playerClubs.data);
        for (var i = 0; i < keys.length; i++) {
            let key = keys[i];
            playerData.data[key] = playerClubs.data[key];
        }

        res.send(playerData.data);
    } catch (err) {
        console.log(err);
        res.sendStatus(404);
    }
})

// Upon receiving a request to get a player archive
app.post('/api/get-player-games', async (req, res) => {
    const playerId = req.body;
    console.log("received request to get player games");
    let sentAllGames;

    const getArchive = async () => {
        const playerArchive = await axios.get(`https://api.chess.com/pub/player/${playerId}/games/archives`);

        // Archive API calls ordered in chronological order
        var playerGames = playerArchive.data.archives;
        playerGames.reverse();

        var idx = 0;
        var gamesArray = [];
        // Loads 20 games by making a series of API calls
        while (gamesArray.length < 20 && idx < playerGames.length) {
            var response = await axios.get(playerGames[idx]);
            gamesArray = gamesArray.concat(response.data.games.reverse());
            idx++;
        }

        const storeObject = {};
        storeObject[playerId] = gamesArray;

        // Stores archived games in a file
        await fsPromises.writeFile(path.join(__dirname, "archiveDB.json"), (JSON.stringify(storeObject)));


        if (storeObject[playerId].length <= 20) {
            sentAllGames = true;
        } else {
            sentAllGames = false;
        }

        let resObject = {};
        resObject["archive"] = gamesArray.slice(0,20);
        resObject["monthIndex"] = idx;
        resObject["done"] = sentAllGames;

        res.send(resObject);
        
    }
    
    // Gets the player's archived games
    try {
        const data = await fsPromises.readFile(path.join(__dirname, "archiveDB.json"));
        
        if (data.length === 0) {
            getArchive();
        } else {
            const gamesArray = JSON.parse(data);
            if (!Object.keys(gamesArray).includes(playerId)) {
                getArchive();
            } else {
                if (gamesArray[playerId].length <= 20) {
                    sentAllGames = true;
                } else {
                    sentAllGames = false;
                }
        
                let resObject = {};
                resObject["archive"] = gamesArray[playerId].slice(0,20);
                resObject["done"] = sentAllGames;
                resObject["monthIndex"] = 1;
        
                res.send(resObject);
            }
        }

    } catch (err) {
        console.log(err);
        res.sendStatus(404);
    }
})

// Upon receiving a request to update the player data
app.put('/api/update-player-games', async (req, res) => {
    console.log("received request to update player games");
    let done = false;
    let newGames = [];

    const response = await axios.get(`https://api.chess.com/pub/player/${req.body}/games/archives`);
    const playerArchive = response.data.archives;

    let monthIndex = playerArchive.length - 1;
    let data = await fsPromises.readFile(path.join(__dirname, "archiveDB.json"));
    data = JSON.parse(data);
    const gamesArray = data[req.body];

    do {
        let lastMonth = await axios.get(playerArchive[monthIndex]);
        lastMonth = lastMonth.data.games.reverse();

        for (var i = 0; i < lastMonth.length; i++) {
            if (lastMonth[i].url !== gamesArray[0].url) {
                newGames.push(lastMonth[i]);
            } else {
                done = true;
                break;
            }
        }
        monthIndex = monthIndex - 1;
    } while (done === false);

    const newArray = newGames.concat(gamesArray);

    const storeObject = {};
    storeObject[req.body] = newArray;
    await fsPromises.writeFile(path.join(__dirname, 'archiveDB.json'), JSON.stringify(storeObject));

    res.sendStatus(201);
})

// Upon receiving a request to get a batch of player archive data
app.post('/api/get-player-batch', async (req, res) => {
    console.log("received request to get batch");
    const playerId = req.body.id;
    const index = req.body.index;
    var monthIndex = req.body.monthIndex;
    var sentAllGames;

    var data = await fsPromises.readFile(path.join(__dirname, "archiveDB.json"));
    data = JSON.parse(data);
    var gamesArray = data[playerId];

    if (index+20 >= data[playerId].length - 1) {
        var playerArchive = await axios.get(`https://api.chess.com/pub/player/${playerId}/games/archives`);
        var playerGames = playerArchive.data.archives;       
        if (playerGames.length == monthIndex) {
            sentAllGames = true;
        } else {
            playerGames.reverse();
            while (gamesArray.length <= index+20 && monthIndex < playerGames.length) {
                var response = await axios.get(playerGames[monthIndex]);
                gamesArray = gamesArray.concat(response.data.games.reverse());
                monthIndex++;
            }
        }
    } else {
        sentAllGames = false;
    }

    // Stores archived games in a file
    var storeObject = {};
    storeObject[playerId] = gamesArray;
    await fsPromises.writeFile(path.join(__dirname, "archiveDB.json"), (JSON.stringify(storeObject)));

    const resData = data[playerId].slice(0, index+20);
    const resObject = {};
    resObject["archive"] = resData;
    resObject["done"] = sentAllGames;
    console.log(monthIndex);
    resObject["monthIndex"] = monthIndex;

    res.send(resObject);
})
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));