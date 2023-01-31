import { useContext } from "react";
import { ThemeContext } from '../App';

const Loading = () => {

    const { mode } = useContext(ThemeContext);
    return (
        <div className="loading" id={mode}>
            <h1 id="dark-text"> Loading User Data...</h1>
        </div>
    )
}

export default Loading;