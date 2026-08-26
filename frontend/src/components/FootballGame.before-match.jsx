import { useState } from "react";

const leagues = [
  {
    id: "epl",
    name: "Premier League",
    country: "🏴 England",
    teams: ["Arsenal", "Liverpool", "Chelsea", "Manchester City"],
  },
  {
    id: "laliga",
    name: "La Liga",
    country: "🇪🇸 Spain",
    teams: ["Barcelona", "Real Madrid", "Atletico Madrid", "Sevilla"],
  },
  {
    id: "seriea",
    name: "Serie A",
    country: "🇮🇹 Italy",
    teams: ["Inter", "AC Milan", "Juventus", "Napoli"],
  },
  {
    id: "bundesliga",
    name: "Bundesliga",
    country: "🇩🇪 Germany",
    teams: ["Bayern Munich", "Dortmund", "Leverkusen", "RB Leipzig"],
  },
  {
    id: "africa",
    name: "African Football",
    country: "🌍 Africa",
    teams: ["AP Lions", "Kampala United", "Nile Stars", "African Warriors"],
  },
];

const squad = [
  { number: 1, name: "Alex Keeper", position: "GK", rating: 78 },
  { number: 4, name: "Daniel Defender", position: "CB", rating: 80 },
  { number: 5, name: "Samuel Defender", position: "CB", rating: 79 },
  { number: 8, name: "Michael Midfielder", position: "CM", rating: 82 },
  { number: 10, name: "David Playmaker", position: "AM", rating: 86 },
  { number: 7, name: "Joseph Winger", position: "RW", rating: 84 },
  { number: 9, name: "Brian Striker", position: "ST", rating: 87 },
];

export default function FootballGame() {
  const [screen, setScreen] = useState("home");
  const [league, setLeague] = useState(leagues[0]);
  const [team, setTeam] = useState(leagues[0].teams[0]);
  const [opponent, setOpponent] = useState(leagues[0].teams[1]);

  function selectLeague(nextLeague) {
    setLeague(nextLeague);
    setTeam(nextLeague.teams[0]);
    setOpponent(nextLeague.teams[1]);
    setScreen("teams");
  }

  return (
    <section id="football-game" className="football-game">
      {screen === "home" && (
        <div className="game-stadium">
          <div className="stadium-lights">🏟️</div>

          <span className="game-brand">AP-STREAM FOOTBALL</span>

          <h2>⚽ Your Football World</h2>

          <p>
            Build your squad, choose your league and step onto the pitch.
          </p>

          <div className="game-menu">
            <button onClick={() => setScreen("leagues")}>
              🌍 Leagues
            </button>

            <button onClick={() => setScreen("squad")}>
              👥 My Squad
            </button>

            <button onClick={() => setScreen("career")}>
              🏆 Career
            </button>

            <button onClick={() => setScreen("transfers")}>
              🔄 Transfers
            </button>
          </div>

          <button
            className="play-match-button"
            onClick={() => setScreen("match")}
          >
            ⚽ PLAY MATCH
          </button>
        </div>
      )}

      {screen === "leagues" && (
        <div className="football-game-panel">
          <button onClick={() => setScreen("home")}>← Back</button>

          <h2>🌍 Choose Your League</h2>

          <div className="league-grid">
            {leagues.map((item) => (
              <button
                className="league-card"
                key={item.id}
                onClick={() => selectLeague(item)}
              >
                <strong>{item.name}</strong>
                <span>{item.country}</span>
                <small>{item.teams.length} teams available</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {screen === "teams" && (
        <div className="football-game-panel">
          <button onClick={() => setScreen("leagues")}>← Leagues</button>

          <h2>{league.country} {league.name}</h2>

          <p>Select your team.</p>

          <div className="team-grid">
            {league.teams.map((club) => (
              <button
                key={club}
                className={club === team ? "team-card selected" : "team-card"}
                onClick={() => {
                  setTeam(club);

                  const nextOpponent =
                    league.teams.find((item) => item !== club) ||
                    league.teams[0];

                  setOpponent(nextOpponent);
                }}
              >
                ⚽
                <strong>{club}</strong>
              </button>
            ))}
          </div>

          <button
            className="play-match-button"
            onClick={() => setScreen("match")}
          >
            🏟️ START MATCH
          </button>
        </div>
      )}

      {screen === "match" && (
        <div className="football-game-panel match-setup">
          <button onClick={() => setScreen("home")}>← Exit</button>

          <span className="game-brand">MATCH DAY</span>

          <h2>🏟️ AP-STREAM Stadium</h2>

          <div className="match-teams">
            <div>
              <span>HOME</span>
              <strong>{team}</strong>
            </div>

            <b>VS</b>

            <div>
              <span>AWAY</span>
              <strong>{opponent}</strong>
            </div>
          </div>

          <div className="match-score-preview">
            <strong>0</strong>
            <span>:</span>
            <strong>0</strong>
          </div>

          <button
            className="play-match-button"
            onClick={() => alert("Match engine coming next!")}
          >
            ▶ KICK OFF
          </button>
        </div>
      )}

      {screen === "squad" && (
        <div className="football-game-panel">
          <button onClick={() => setScreen("home")}>← Back</button>

          <h2>👥 My Squad</h2>

          <div className="squad-list">
            {squad.map((player) => (
              <div className="player-card" key={player.number}>
                <span>#{player.number}</span>
                <strong>{player.name}</strong>
                <small>{player.position}</small>
                <b>{player.rating}</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === "career" && (
        <div className="football-game-panel">
          <button onClick={() => setScreen("home")}>← Back</button>
          <h2>🏆 Career Mode</h2>
          <p>
            Build your club, develop players and climb through the leagues.
          </p>
          <button onClick={() => setScreen("leagues")}>
            🌍 Choose League
          </button>
        </div>
      )}

      {screen === "transfers" && (
        <div className="football-game-panel">
          <button onClick={() => setScreen("home")}>← Back</button>
          <h2>🔄 Transfer Centre</h2>
          <p>Scout players, strengthen your squad and build your club.</p>

          <div className="transfer-player">
            <strong>⭐ Rising Striker</strong>
            <span>ST • Rating 84</span>
            <button>Scout Player</button>
          </div>

          <div className="transfer-player">
            <strong>⚡ Fast Winger</strong>
            <span>RW • Rating 81</span>
            <button>Scout Player</button>
          </div>
        </div>
      )}
    </section>
  );
}
