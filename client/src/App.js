import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback, createContext } from 'react';
import Header from './components/Header';
import Search from './components/Search';
import DisplayData from './components/DisplayData';
import DisplayClubs from './components/DisplayClubs';
import Unknown from './components/Unknown';
import Loading from './components/Loading';
import Footer from './components/Footer';
import Compare from './components/Compare';
import be from './api.js';

// Context for dark/light mode
export const ThemeContext = createContext("light");

function App() {
  const [search, setSearch] = useState("");

  const [userData, setUserData] = useState("");

  const [loading, setLoading] = useState(true);

  const [fetchError, setFetchError] = useState(false);

  const [mode, setMode] = useState("light");

  const navigate = useNavigate();

  // Fetches user profile data
  const fetchData = useCallback(async (playerId) => {

    const callOptions = {
      method: "POST",
      headers: {
        'Content-Type': 'text/plain'
      },
      body: playerId
    }

    try {
      const response = await fetch(`${be}/api/get-player-data`, callOptions);
      const formatted = await response.json();
      console.log(formatted);
      setUserData(formatted);
    } catch (err) {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [setUserData]);

  useEffect(() => {
    console.log("appjs called");

    const whichMode = JSON.parse(localStorage.getItem('otm'));
    if (whichMode !== null) {
      setMode(whichMode);
    } else {
      setMode("light");
    }

    const params = new URLSearchParams(window.location.search);
    const playerId = params.get('user');
    const userData = JSON.parse(sessionStorage.getItem(`user-data-${playerId}`));

    if (userData !== null && playerId !== null) {
      setUserData(userData);
      setLoading(false);
    } else if (playerId === null) {
      return
    } else {
      fetchData(playerId);
    }
  }, [fetchData])

  // When the user submits a request to fetch a player's data
  const handleSubmit = async (event) => {
    event.preventDefault();
    navigate(`/user-data?user=${search}`);
    await fetchData(search);
  }

  return (
    <div className="App">
      <Header setMode={setMode} mode={mode} />
      <ThemeContext.Provider value={{ mode }}>
        <Routes>
          <Route path='/' element={<Search handleSubmit={handleSubmit} setSearch={setSearch} setFetchError={setFetchError} setLoading={setLoading} />} />
          <Route path='user-data' element={loading ? <Loading /> : !fetchError ? <DisplayData userData={userData} /> : <Unknown />} />
          <Route path='clubs' element={<DisplayClubs userData={userData} />} />
          <Route path='user-compare' element={<Compare />} />
          <Route path="*" element={<Unknown />} />
        </Routes>
      </ThemeContext.Provider>
      <Footer />
    </div>
  );
}

export default App;
