import { useEffect, useContext, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ThemeContext } from '../App';
import '../css/Compare.css';

const Compare = () => {
    const { mode } = useContext(ThemeContext)

    const [searchParams, setSearchParams] = useSearchParams();

    const playerId = searchParams.get('user');

    const playerId2 = searchParams.get('user2');

    const [player1, setPlayer1] = useState(null);
    const [player2, setPlayer2] = useState(null);

    useEffect(() => {
        const fetchData = async (playerId, id) => {
            const callOptions = {
                method: "POST",
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: playerId
            }
            try {
                const response = await fetch('/api/get-player-data', callOptions);
                const formatted = await response.json();
                if (id === 2) {
                    setPlayer2(formatted);
                } else {
                    setPlayer1(formatted);
                }
                sessionStorage.setItem(`user-data-${playerId}`, JSON.stringify(formatted));

            } catch (err) {
                console.log(err);
            }

        }
        const userData2 = JSON.parse(sessionStorage.getItem(`user-data-${playerId2}`));
        const userData1 = JSON.parse(sessionStorage.getItem(`user-data-${playerId}`));

        if (userData2 != null) {
            setPlayer2(userData2);
        } else {
            fetchData(playerId2, 2);
        }

        if (userData1 != null) {
            setPlayer1(userData1);
        } else {
            fetchData(playerId, 1);
        }

    }, [playerId2, playerId])

    return (
        player1 !== null && player2 !== null ?
            <div className="play-info">
                <div className="time-control">
                    <h2>Ratings</h2>
                    <table className="ratingTable">
                        <thead>
                            <tr className="tableRow">
                                <th>Player</th>
                                <th>Blitz</th>
                                <th>Bullet</th>
                                <th>Rapid</th>
                            </tr>
                        </thead>
                        <tr className="tableRow">
                            <td>{`${playerId}`}</td>
                            <td>{player1.chess_blitz.last.rating}</td>
                            <td>{player1.chess_bullet.last.rating}</td>
                            <td>{player1.chess_rapid.last.rating}</td>
                        </tr>
                        <tr className="tableRow">
                            <td>{`${playerId2}`}</td>
                            <td>{player2.chess_blitz.last.rating}</td>
                            <td>{player2.chess_bullet.last.rating}</td>
                            <td>{player2.chess_rapid.last.rating}</td>
                        </tr>
                    </table>
                </div>
                <div className="time-control">
                    <h2>W/D/L Ratios</h2>
                    <table className="ratingTable">
                        <thead>
                            <tr className="tableRow">
                                <th>Player</th>
                                <th>Blitz</th>
                                <th>Bullet</th>
                                <th>Rapid</th>
                            </tr>
                        </thead>
                        <tr className="tableRow">
                            <td>{`${playerId}`}</td>
                            <td>{player1.chess_blitz.record.win}/{player1.chess_blitz.record.draw}/{player1.chess_blitz.record.loss}</td>
                            <td>{player1.chess_bullet.record.win}/{player1.chess_bullet.record.draw}/{player1.chess_bullet.record.loss}</td>
                            <td>{player1.chess_rapid.record.win}/{player1.chess_rapid.record.draw}/{player1.chess_rapid.record.loss}</td>
                        </tr>
                        <tr className="tableRow">
                            <td>{`${playerId2}`}</td>
                            <td>{player2.chess_blitz.record.win}/{player2.chess_blitz.record.draw}/{player2.chess_blitz.record.loss}</td>
                            <td>{player2.chess_bullet.record.win}/{player2.chess_bullet.record.draw}/{player2.chess_bullet.record.loss}</td>
                            <td>{player2.chess_rapid.record.win}/{player2.chess_rapid.record.draw}/{player2.chess_rapid.record.loss}</td>
                        </tr>
                    </table>
                </div>
            </div> :
            <p>Loading User Data...</p>
    )
}

export default Compare;