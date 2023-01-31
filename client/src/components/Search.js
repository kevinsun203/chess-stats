import { useEffect, useState } from "react";
import { useContext } from 'react';
import { ThemeContext } from '../App';
import pieces from '../images/pieces.jpg';

const Body = ({ handleSubmit, setSearch, setFetchError, setLoading }) => {

    const { mode } = useContext(ThemeContext);

    useEffect(() => {

        setFetchError(false);
        setLoading(true);
    }, [setFetchError, setLoading])

    return (
        <div className="search" style={{
            backgroundImage: `url(${pieces})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat'
        }}>
            <section id={`${mode}-shadow`} className="search" style={{ width: "100vw" }}>
                <form className="form" onSubmit={handleSubmit}>
                    <label htmlFor="search">Search Chess.com username</label>
                    <input id="search" placeholder="Search..." onChange={(event) => { setSearch(event.target.value) }} />
                </form>
            </section>
        </div>
    )
}

export default Body;