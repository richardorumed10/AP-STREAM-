import { useState } from "react";

const games = [
  {
    id: 1,
    icon: "⚽",
    title: "Football Challenge",
    description: "Test your football knowledge.",
    category: "Sports",
  },
  {
    id: 2,
    icon: "🧠",
    title: "African Quiz",
    description: "How well do you know Africa?",
    category: "Quiz",
  },
  {
    id: 3,
    icon: "🎯",
    title: "Quick Challenge",
    description: "Complete quick challenges and earn points.",
    category: "Challenge",
  },
];

export default function GamesHub() {
  const [selectedGame, setSelectedGame] = useState(null);
  const [score, setScore] = useState(0);

  function playGame(game) {
    setSelectedGame(game);
    setScore((current) => current + 10);
  }

  return (
    <section id="games" className="games-section">
      <div className="section-heading">
        <h2>🎮 AP-STREAM Games</h2>
        <p className="section-subtitle">
          Play, compete and have fun on AP-STREAM.
        </p>
      </div>

      <div className="games-stats">
        <div className="game-stat">
          <strong>🏆 {score}</strong>
          <span>Points</span>
        </div>

        <div className="game-stat">
          <strong>🎮 {games.length}</strong>
          <span>Games</span>
        </div>
      </div>

      <div className="games-grid">
        {games.map((game) => (
          <article className="game-card" key={game.id}>
            <div className="game-icon">{game.icon}</div>

            <span className="game-category">{game.category}</span>

            <h3>{game.title}</h3>

            <p>{game.description}</p>

            <button onClick={() => playGame(game)}>
              ▶ Play Game
            </button>
          </article>
        ))}
      </div>

      {selectedGame && (
        <div className="game-message">
          <h3>
            🎮 {selectedGame.title}
          </h3>

          <p>
            Game selected! The full game experience can be added next.
          </p>

          <button onClick={() => setSelectedGame(null)}>
            Close
          </button>
        </div>
      )}
    </section>
  );
}
