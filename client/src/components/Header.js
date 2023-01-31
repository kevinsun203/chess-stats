import { useNavigate } from 'react-router-dom';
import { MdLightMode } from 'react-icons/md';
import { MdDarkMode } from 'react-icons/md';

const Header = ({ setMode, mode }) => {
    const navigate = useNavigate();

    return (
        <header className="header" >
            <h1 className="headerText" onClick={() => navigate('/')}>Chess.com Player Stats</h1>
            {mode === "light" ? <MdLightMode size={50} onClick={() => {
                setMode("dark");
                localStorage.setItem(`otm`, JSON.stringify("dark"))
            }} /> : <MdDarkMode size={50} onClick={() => {
                setMode("light");
                localStorage.setItem(`otm`, JSON.stringify("light"));
            }} />}
        </header>
    )
}

export default Header;