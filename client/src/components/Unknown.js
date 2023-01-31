import { Link } from 'react-router-dom';
import { ThemeContext } from '../App';
import { useContext } from "react";

const Unknown = () => {

    const { mode } = useContext(ThemeContext);

    return (
        <div className="error" id={mode}>
            <h1 id="dark-text">
                User Not Found
            </h1>
            <Link to='/'>
                <button >Back Home</button>
            </Link>
        </div>
    )
}

export default Unknown;