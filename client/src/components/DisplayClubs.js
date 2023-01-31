import "../css/Clubs.css";
import club from "../images/club.png";
import { useContext } from 'react';
import { ThemeContext } from '../App';

const DisplayClubs = ({ userData }) => {

    const { mode } = useContext(ThemeContext);
    return (
        <div className="club-container" id={mode}>
            <div id="clubs" className="time-control">
                <div className="tc-header">
                    <h2>Clubs</h2>
                    <img src={club} alt="club" className="clubs" />
                </div>
                {userData.clubs.map(clubId =>
                (
                    <div key={userData.clubs.indexOf(clubId)} className="clubs">
                        <img src={clubId.icon} alt="club" />
                        <a href={clubId.url} target="_blank" rel="noreferrer"> {clubId.name}</a>
                    </div>
                )
                )}
            </div>
        </div>
    )
}

export default DisplayClubs;