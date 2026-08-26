import { useEffect, useState } from "react";

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

const commentary = {
  pass: [
    "A neat pass through midfield.",
    "Excellent movement of the ball.",
    "The attack is building nicely.",
    "A clever pass finds the winger.",
  ],
  shoot: [
    "The shot is away!",
    "A powerful effort from distance!",
    "He takes the chance!",
    "The striker pulls the trigger!",
  ],
  tackle: [
    "What a challenge!",
    "A strong tackle wins the ball.",
    "Great defensive work.",
    "The defender steps in perfectly.",
  ],
  sprint: [
    "He's accelerating down the wing!",
    "What pace!",
    "The winger races forward.",
    "He's opened up space on the flank!",
  ],
};

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export default function FootballGame() {
  const [screen, setScreen] = useState("home");
  const [league, setLeague] = useState(leagues[0]);
  const [team, setTeam] = useState(leagues[0].teams[0]);
  const [opponent, setOpponent] = useState(leagues[0].teams[1]);

  const [minute, setMinute] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [comment, setComment] = useState("Welcome to AP-STREAM Stadium.");
  const [matchStatus, setMatchStatus] = useState("READY");
  const [yellowCards, setYellowCards] = useState(0);
  const [shots, setShots] = useState(0);
  const [possession, setPossession] = useState(50);

  useEffect(() => {
    if (screen !== "match" || matchStatus !== "LIVE") return;

    const timer = setInterval(() => {
      setMinute((current) => {
        const next = current + 1;

        if (next === 45) {
          setComment("🎙️ Half-time! The teams head into the break.");
          setMatchStatus("HALF-TIME");
        }

        if (next >= 90) {
          setComment("🎙️ Full-time! What a match at AP-STREAM Stadium.");
          setMatchStatus("FULL-TIME");
          return 90;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, matchStatus]);

  function selectLeague(nextLeague) {
    setLeague(nextLeague);
    setTeam(nextLeague.teams[0]);
    setOpponent(nextLeague.teams[1]);
    setScreen("teams");
  }

  function startMatch() {
    setMinute(0);
    setHomeScore(0);
    setAwayScore(0);
    setYellowCards(0);
    setShots(0);
    setPossession(50);
    setComment("🎙️ And we're underway at AP-STREAM Stadium!");
    setMatchStatus("LIVE");
    setScreen("match");
  }

  function action(type) {
    if (matchStatus !== "LIVE") return;

    setComment(`🎙️ ${randomItem(commentary[type])}`);

    if (type === "shoot") {
      setShots((current) => current + 1);

      if (Math.random() < 0.2) {
        setHomeScore((current) => current + 1);
        setComment("🎙️ GOOOOAL! What a finish! AP-STREAM Stadium erupts!");
      }
    }

    if (type === "tackle") {
      if (Math.random() < 0.15) {
        setYellowCards((current) => current + 1);
        setComment("🎙️ The referee shows a yellow card!");
      }
    }

    if (type === "pass") {
      setPossession((current) =>
        Math.max(40, Math.min(60, current + (Math.random() > 0.5 ? 2 : -2)))
      );
    }

    if (type === "sprint") {
      setPossession((current) =>
        Math.max(40, Math.min(60, current + 1))
      );
    }
  }

  function resetMatch() {
    setMatchStatus("READY");
    setScreen("home");
    setMinute(0);
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

          <button className="play-match-button" onClick={startMatch}>
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

          <div className="team-grid">
            {league.teams.map((club) => (
              <button
                key={club}
                className={club === team ? "team-card selected" : "team-card"}
                onClick={() => {
                  setTeam(club);
                  setOpponent(
                    league.teams.find((item) => item !== club) || league.teams[0]
                  );
                }}
              >
                ⚽
                <strong>{club}</strong>
              </button>
            ))}
          </div>

          <button className="play-match-button" onClick={startMatch}>
            🏟️ START MATCH
          </button>
        </div>
      )}

      {screen === "match" && (
        <div className="football-match">
          <div className="match-stadium-header">
            <span>🏟️ AP-STREAM STADIUM</span>
            <strong>{minute}'</strong>
          </div>

          <div className="scoreboard">
            <div>
              <span>HOME</span>
              <strong>{team}</strong>
            </div>

            <div className="score">
              <b>{homeScore}</b>
              <span> - </span>
              <b>{awayScore}</b>
            </div>

            <div>
              <span>AWAY</span>
              <strong>{opponent}</strong>
            </div>
          </div>

          <div className="pitch">
            <div className="pitch-line" />
            <div className="ball">⚽</div>
            <div className="crowd">🏟️ 🏟️ 🏟️ 🏟️ 🏟️</div>
          </div>

          <div className="commentary-box">
            <span>🎙️ COMMENTARY</span>
            <p>{comment}</p>
          </div>

          <div className="match-actions">
            <button onClick={() => action("pass")}>↗️ Pass</button>
            <button onClick={() => action("shoot")}>⚽ Shoot</button>
            <button onClick={() => action("tackle")}>🛡️ Tackle</button>
            <button onClick={() => action("sprint")}>🏃 Sprint</button>
          </div>

          <div className="match-stats">
            <span>📊 Shots {shots}</span>
            <span>🟨 Cards {yellowCards}</span>
            <span>⚽ Possession {possession}%</span>
          </div>

          {matchStatus !== "LIVE" && (
            <div className="match-status">
              <h3>
                {matchStatus === "READY"
                  ? "Ready"
                  : matchStatus === "HALF-TIME"
                  ? "⏸️ Half-time"
                  : "🏁 Full-time"}
              </h3>

              {matchStatus === "HALF-TIME" ? (
                <button
                  onClick={() => {
                    setMatchStatus("LIVE");
                    setComment("🎙️ The second half is underway!");
                  }}
                >
                  ▶ Start Second Half
                </button>
              ) : (
                <button onClick={resetMatch}>Return to Football</button>
              )}
            </div>
          )}
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
        </div>
      )}

      {screen === "transfers" && (
        <div className="football-game-panel">
          <button onClick={() => setScreen("home")}>← Back</button>
          <h2>🔄 Transfer Centre</h2>

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
