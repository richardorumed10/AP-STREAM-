import { useEffect, useRef, useState } from "react";

const HOME = [
  ["GK", 10, 50],
  ["DF", 25, 25],
  ["DF", 25, 50],
  ["DF", 25, 75],
  ["MF", 45, 20],
  ["MF", 45, 40],
  ["MF", 45, 60],
  ["MF", 45, 80],
  ["FW", 65, 30],
  ["FW", 65, 70],
];

const AWAY = [
  ["GK", 90, 50],
  ["DF", 75, 25],
  ["DF", 75, 50],
  ["DF", 75, 75],
  ["MF", 55, 20],
  ["MF", 55, 40],
  ["MF", 55, 60],
  ["MF", 55, 80],
  ["FW", 35, 30],
  ["FW", 35, 70],
];

export default function FootballGame() {
  const canvasRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [minute, setMinute] = useState(0);
  const [score, setScore] = useState([0, 0]);
  const [commentary, setCommentary] = useState(
    "🎙️ Welcome to AP-STREAM Stadium!"
  );
  const [selected, setSelected] = useState(9);

  const player = useRef({ x: 65, y: 30 });
  const ball = useRef({ x: 50, y: 50 });

  useEffect(() => {
    if (!playing) return;

    const timer = setInterval(() => {
      setMinute((m) => {
        if (m >= 90) {
          setPlaying(false);
          setCommentary("🎙️ Full-time at AP-STREAM Stadium!");
          return 90;
        }
        return m + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function draw() {
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Stadium
      ctx.fillStyle = "#303030";
      ctx.fillRect(0, 0, w, h);

      // Crowd
      ctx.fillStyle = "#777";
      ctx.fillRect(0, 0, w, 55);
      ctx.fillRect(0, h - 55, w, 55);

      // Pitch
      const px = 35;
      const py = 65;
      const pw = w - 70;
      const ph = h - 130;

      ctx.fillStyle = "#168a45";
      ctx.fillRect(px, py, pw, ph);

      // Pitch lines
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.strokeRect(px, py, pw, ph);

      ctx.beginPath();
      ctx.moveTo(w / 2, py);
      ctx.lineTo(w / 2, py + ph);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 55, 0, Math.PI * 2);
      ctx.stroke();

      // Goals
      ctx.strokeRect(px - 18, h / 2 - 55, 18, 110);
      ctx.strokeRect(px + pw, h / 2 - 55, 18, 110);

      // Players
      function drawPlayers(players, activeIndex, isHome) {
        players.forEach((p, i) => {
          let x = px + (p[1] / 100) * pw;
          let y = py + (p[2] / 100) * ph;

          if (isHome && i === activeIndex) {
            x = px + (player.current.x / 100) * pw;
            y = py + (player.current.y / 100) * ph;
          }

          ctx.beginPath();
          ctx.arc(x, y, 13, 0, Math.PI * 2);
          ctx.fillStyle = isHome ? "#1976d2" : "#d32f2f";
          ctx.fill();

          ctx.strokeStyle = "#fff";
          ctx.stroke();

          ctx.fillStyle = "#fff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(String(i + 1), x, y + 4);
        });
      }

      drawPlayers(HOME, selected, true);
      drawPlayers(AWAY, -1, false);

      // Ball
      const bx = px + (ball.current.x / 100) * pw;
      const by = py + (ball.current.y / 100) * ph;

      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "#222";
      ctx.stroke();

      // Stadium title
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🏟️ AP-STREAM STADIUM", w / 2, 32);

      requestAnimationFrame(draw);
    }

    draw();
  }, [selected]);

  function move(dx, dy) {
    if (!playing) return;

    player.current.x = Math.max(
      5,
      Math.min(95, player.current.x + dx)
    );

    player.current.y = Math.max(
      5,
      Math.min(95, player.current.y + dy)
    );

    ball.current.x = player.current.x;
    ball.current.y = player.current.y;

    setCommentary("🎙️ Great movement with the ball!");
  }

  function aiMove() {
    if (!playing) return;

    // Move the virtual players toward the ball.
    HOME.forEach((p, i) => {
      if (i === selected) return;

      const dx = ball.current.x - p[1];
      const dy = ball.current.y - p[2];

      p[1] += dx * 0.006;
      p[2] += dy * 0.006;
    });

    AWAY.forEach((p) => {
      const dx = ball.current.x - p[1];
      const dy = ball.current.y - p[2];

      p[1] += dx * 0.004;
      p[2] += dy * 0.004;
    });
  }

  function pass() {
    if (!playing) return;

    ball.current.x = Math.min(95, player.current.x + 12);
    ball.current.y = player.current.y;

    setCommentary("🎙️ A sharp pass into space!");
  }

  function shoot() {
    if (!playing) return;

    setCommentary("🎙️ THE SHOT IS AWAY!");

    if (Math.random() < 0.25) {
      setScore(([home, away]) => [home + 1, away]);
      setCommentary(
        "🎙️ GOOOOOAL! What a finish at AP-STREAM Stadium!"
      );
    }

    ball.current.x = Math.min(98, player.current.x + 30);
  }

  function tackle() {
    if (!playing) return;

    setCommentary("🎙️ Brilliant tackle! The ball has been won.");
  }

  function startMatch() {
    setMinute(0);
    setScore([0, 0]);
    player.current = { x: 65, y: 30 };
    ball.current = { x: 65, y: 30 };
    setCommentary("🎙️ Kick-off! The match is underway!");
    setPlaying(true);
  }

  return (
    <section id="football-game" className="football-game">
      <div className="football-game-header">
        <h2>⚽ AP-STREAM FOOTBALL</h2>
        <p>🏟️ Live Match Experience</p>
      </div>

      <div className="scoreboard">
        <strong>AP LIONS</strong>
        <span>{score[0]} - {score[1]}</span>
        <strong>AFRICAN WARRIORS</strong>
        <small>{minute}'</small>
      </div>

      <canvas
        ref={canvasRef}
        width="900"
        height="520"
        className="football-canvas"
      />

      <div className="commentary">
        <strong>🎙️ COMMENTATOR</strong>
        <p>{commentary}</p>
      </div>

      {!playing && minute === 0 && (
        <button className="play-match-button" onClick={startMatch}>
          ⚽ KICK OFF
        </button>
      )}

      {playing && (
        <>
          <div className="virtual-controller">
            <button onClick={() => move(0, -5)}>⬆️</button>

            <div>
              <button onClick={() => move(-5, 0)}>⬅️</button>
              <button onClick={() => move(5, 0)}>➡️</button>
            </div>

            <button onClick={() => move(0, 5)}>⬇️</button>
          </div>

          <div className="match-controls">
            <button onClick={pass}>↗️ PASS</button>
            <button onClick={shoot}>⚽ SHOOT</button>
            <button onClick={tackle}>🛡️ TACKLE</button>
          </div>
        </>
      )}
    </section>
  );
}
