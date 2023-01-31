import "../css/DisplayData.css";
import blitz from "../images/blitz.png";
import rapid from "../images/rapid.png";
import bullet from "../images/bullet.png";
import board from "../images/board.png";
import club from "../images/club.png";
import play from "../images/play.png";
import be from "../api.js";
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { ThemeContext } from '../App';
import { useContext } from "react";

const DisplayData = ({ userData }) => {
    const navigate = useNavigate();
    const { mode } = useContext(ThemeContext);

    const [searchParams, setSearchParams] = useSearchParams();

    const playerId = searchParams.get('user');

    const [games, setGames] = useState([]);

    const [loading, setLoading] = useState(true);

    const [allGames, setAllGames] = useState(false);

    const [WDL, setWDL] = useState(null);

    const [openings, setOpenings] = useState([]);

    const [search, setSearch] = useState("");

    const [monthIndex, setMonthIndex] = useState(0);
    // Index to slice games 
    const [index, setIndex] = useState(20);

    // If the response data does not have an avatar attribute, then the default
    // avatar is used.
    if (!userData.hasOwnProperty('avatar')) {
        userData['avatar'] = "https://www.chess.com/bundles/web/images/noavatar_l.84a92436.gif";
    }

    // Function for converting the unix timestamp into DD/MM/YYYY HH:MM:SS
    const getDateFromTimestamp = (timestamp) => {
        const date = new Date(timestamp * 1000);
        return (date.getDate() +
            "/" + (date.getMonth() + 1).toString().padStart(2, '0') +
            "/" + date.getFullYear() +
            " " + (date.getHours()).toString().padStart(2, '0') +
            ":" + (date.getMinutes()).toString().padStart(2, '0') +
            ":" + (date.getSeconds()).toString().padStart(2, '0'));
    }

    // Capitalizes the first letter of a user's first and last name
    const capitalizeName = (name) => {
        if (name == null) {
            return "Name unknown";
        }
        let newName = name[0].toUpperCase() + name.slice(1);
        for (var i = 0; i < name.length; i++) {
            if (name[i] === " ") {
                return newName.slice(0, i) + " " + newName[i + 1].toUpperCase() + newName.slice(i + 2);
            }
        }
        return newName;
    }

    // Determines the winner of a certain game from JSON data
    const result = useCallback((game) => {
        let player;

        if (game.white.username.toLowerCase() === playerId.toLowerCase()) {
            player = game.white;
        } else {
            player = game.black;
        }

        const losses = ['resigned', 'checkmated', 'timeout', 'abandoned'];
        const draw = ['agreed', 'insufficient'];
        if (losses.indexOf(player.result) >= 0 && playerId.toLowerCase() === player.username.toLowerCase()) {
            return "Loss";
        } else if (draw.indexOf(player.result) >= 0) {
            return "Draw";
        } else {
            return "Win";
        }
    }, [playerId])

    // Removes user data from session storage and reloads the page when a profile update is requested
    const refresh = async () => {
        const awaitTimeout = delay =>
            new Promise(resolve => setTimeout(resolve, delay));
        const callOptions = {
            method: "PUT",
            headers: {
                'Content-Type': 'text/plain'
            },
            body: playerId
        }
        await fetch(`${be}/api/update-player-games`, callOptions);
        sessionStorage.removeItem(`user-data-${playerId}`);

        // Timeout must be set so that the node server can restart in time to listen for the subsequent
        // post api call
        await awaitTimeout(2000);
        window.location.reload(false);
    }

    // To get a batch of player games
    const fetchGames = async () => {
        const sentData = {
            id: playerId,
            index: index,
            monthIndex: monthIndex
        };
        const callOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(sentData)
        };

        const data = await fetch(`${be}/api/get-player-batch`, callOptions);
        const games = await data.json();
        setGames(games.archive);
        setAllGames(games.done);
        setMonthIndex(games.monthIndex);
    }

    // Function for retrieving the opening from an archive object
    const getOpening = (game) => {
        const startIndex = game.indexOf("openings/");
        const endIndex = game.indexOf("UTCDate");
        return game.slice(startIndex + 9, endIndex - 4);
    }

    // Function for retrieving the date of an archive game
    const getDate = (game) => {
        const startIndex = game.indexOf("Date");
        const endIndex = game.indexOf("Round");
        return game.slice(startIndex + 6, endIndex - 4);
    }

    // Function for handling the submission of a player to compare with
    const submitCompare = async (event) => {
        event.preventDefault();
        navigate(`/user-compare?user=${playerId}&user2=${search}`);
    }

    // useEffect function for getting the w/L ratio of currently displayed games
    // and most played openings
    useEffect(() => {
        let win = 0;
        let loss = 0;
        let draw = 0;

        for (let i = 0; i < games.length; i++) {
            const outcome = result(games[i]);
            if (outcome === "Win") {
                win++;
            } else if (outcome === "Loss") {
                loss++;
            } else {
                draw++;
            }
        }
        setWDL(`${win}W ${draw}D ${loss}L`);

        let openings = {};
        for (let i = 0; i < games.length; i++) {
            let opening = getOpening(games[i].pgn);
            let outcome = result(games[i]);
            const firstIndex = opening.indexOf('-')
            const secondIndex = opening.indexOf('-', firstIndex + 1);
            if (secondIndex !== -1) {
                opening = opening.slice(0, secondIndex);
            }
            if (opening in openings) {
                openings[opening].Count++;
                openings[opening][outcome]++;
            } else {
                openings[opening] = {};
                openings[opening]["Count"] = 1;
                openings[opening]["Win"] = 0;
                openings[opening]["Draw"] = 0;
                openings[opening]["Loss"] = 0;
                openings[opening][outcome]++;
            }
        }

        const sorted = [];
        for (var opening in openings) {
            sorted.push([opening, openings[opening]]);
        }

        sorted.sort(function (a, b) { return b[1].Count - a[1].Count });

        setOpenings(sorted.slice(0, 3));
    }, [games, result])

    // Obtains initial game archive
    useEffect(() => {
        console.log("getting initial archive")
        const getGames = async () => {

            // Makes a post request to the back-end to get archive game data
            const callOptions = {
                method: "POST",
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: playerId
            }
            try {
                const response = await fetch(`${be}/api/get-player-games`, callOptions);
                const games = await response.json();
                setGames(games.archive);
                setAllGames(games.done);
                setMonthIndex(games.monthIndex);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        }

        try {
            getGames();
        } catch (err) {
            console.log(err);
        }

    }, [playerId])

    // Saves user data to session storage
    sessionStorage.setItem(`user-data-${playerId}`, JSON.stringify(userData));

    return (
        <main id={mode}>
            <div className="basic-info">
                <div className="profile-container">
                    <img src={userData.avatar} alt="user profile" className="pfp" />
                    <div className="profile-info">
                        <h1>{(userData.url).substring((userData.url).lastIndexOf('/') + 1)}</h1>
                        <p> <b>Last Online:</b> {getDateFromTimestamp(userData.last_online)}</p>
                        <p><b>Name:</b> {capitalizeName(userData.name)}</p>
                        <p><b>Country:</b> {(userData.country).substring((userData.country).lastIndexOf('/') + 1)}</p>
                        <p><b>FIDE Rating: </b>{userData.fide ? userData.fide : "N/A"}</p>
                        <p> <b>Member Since:</b> {getDateFromTimestamp(userData.joined)}</p>
                        <button className="update" onClick={refresh}>Update</button>
                    </div>
                </ div>
            </div>
            <div className="play-info">

                <div id="blitz" className="time-control">
                    <div className="tc-header">
                        <h2>Blitz</h2>
                        <img src={blitz} alt="blitz" className="blitz" />
                    </div>
                    <p>Rating: {userData.chess_blitz.last.rating}</p>
                    <p>Peak Rating: {userData.chess_blitz.best.rating}</p>
                    <p>W/D/L: {userData.chess_blitz.record.win}/{userData.chess_blitz.record.draw}/{userData.chess_blitz.record.loss}</p>
                    <p>Win Rate: {Math.round((userData.chess_blitz.record.win / (userData.chess_blitz.record.draw + userData.chess_blitz.record.loss + userData.chess_blitz.record.win)) * 100)}%</p>
                </div>

                <div id="rapid" className="time-control">
                    <div className="tc-header">
                        <h2>Rapid</h2>
                        <img src={rapid} alt="rapid" className="rapid" />
                    </div>
                    <p>Rating: {userData.chess_rapid.last.rating}</p>
                    <p>Peak Rating: {userData.chess_rapid.best.rating}</p>
                    <p>W/D/L: {userData.chess_rapid.record.win}/{userData.chess_rapid.record.draw}/{userData.chess_rapid.record.loss}</p>
                    <p>Win Rate: {Math.round((userData.chess_rapid.record.win / (userData.chess_rapid.record.draw + userData.chess_rapid.record.loss + userData.chess_rapid.record.win)) * 100)}%</p>
                </div>

                <div id="bullet" className="time-control">
                    <div className="tc-header">
                        <h2>Bullet</h2>
                        <img src={bullet} alt="bullet" className="bullet" />
                    </div>
                    <p>Rating: {userData.chess_bullet.last.rating}</p>
                    <p>Peak Rating: {userData.chess_bullet.best.rating}</p>
                    <p>W/D/L: {userData.chess_bullet.record.win}/{userData.chess_bullet.record.draw}/{userData.chess_bullet.record.loss}</p>
                    <p>Win Rate: {Math.round((userData.chess_bullet.record.win / (userData.chess_bullet.record.draw + userData.chess_bullet.record.loss + userData.chess_bullet.record.win)) * 100)}%</p>
                </div>

                <div id="tactics" className="time-control">
                    <div className="tc-header">
                        <h2>Tactics</h2>
                        <img src={board} alt="tactics" className="board" />
                    </div>
                    <p>Peak Rating: {userData.tactics.highest.rating}</p>
                    <p>Lowest Rating: {userData.tactics.lowest.rating}</p>
                </div>

                {userData.clubs.length ?
                    <div id="clubs" className="time-control">
                        <div className="tc-header">
                            <h2>Clubs</h2>
                            <img src={club} alt="club" className="clubs" />
                        </div>
                        {userData.clubs.slice(0, 2).map(clubId =>
                        (
                            <div key={userData.clubs.indexOf(clubId)} className="clubs">
                                <img src={clubId.icon} alt="club" />
                                <p> {clubId.name}</p>
                            </div>
                        )
                        )}
                        {userData.clubs.length > 2 ?
                            <p to={`clubs?user=${playerId}`} onClick={() => navigate(`/clubs?user=${playerId}`)}><strong>See Rest</strong>&gt;</p> :
                            <></>
                        }
                    </div> :

                    <div id="clubs" className="time-control">
                        <div className="tc-header">
                            <h2>Clubs</h2>
                            <img src={club} alt="club" className="clubs" />
                        </div>
                        <p><em>No Clubs Joined</em></p>
                    </div>
                }
            </div>
            <div className="openings">
                <div className="time-control" id="analysis">
                    <p><strong>W/D/L: </strong>{WDL}</p>
                    <p><strong>Most Played Openings:</strong></p>
                    {openings.map(opening =>
                        <p key={opening[0]}>{opening[0]} - {opening[1].Count} (W: {opening[1].Win}, D: {opening[1].Draw}, L:{opening[1].Loss})</p>
                    )}
                </div>
            </div>
            <div id="archive">
                <div id="games" className="time-control">
                    <div className="tc-header">
                        <h2>Games Played</h2>
                        <img src={play} alt="play" className="bullet" />
                    </div>
                    {!loading ? (games.length ?
                        (
                            <div>
                                <table className="gameTable">
                                    <thead>
                                        <tr className="tableRow">
                                            <th>Time Control</th>
                                            <th>Result</th>
                                            <th>Opening</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {games.map(game =>
                                            <tr key={game.url} onClick={() => window.open(game.url)} id="game" className="tableRow">
                                                <td className="time-class">
                                                    <strong>{game.time_class.charAt(0).toUpperCase() + game.time_class.slice(1)}</strong>
                                                </td >
                                                <td className="result">
                                                    {result(game)}
                                                </td>
                                                <td className="opening">
                                                    {getOpening(game.pgn)}
                                                </td>
                                                <td className="date">
                                                    {getDate(game.pgn)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )
                        : <p><em>No Games Played</em></p>) : <></>
                    }

                    {!loading ? (!allGames ?
                        <button onClick={() => {
                            fetchGames();
                            setIndex(index + 20);
                        }} style={{ padding: "0.5rem" }}>See More</button> :
                        <></>) : <p><em>Loading Games</em></p>
                    }
                </div>
            </div>
            <div className="compare">
                <form className="form" onSubmit={submitCompare}>
                    <label htmlFor="searchCompare">Search Player to Compare With</label>
                    <input id="searchCompare" placeholder="Search..." onChange={(event) => setSearch(event.target.value)} />
                </form>
            </div>
        </main>

    )
}

export default DisplayData;