import { useEffect, useRef, useState } from "react";

export default function VirtualFootball() {
  const canvasRef = useRef(null);
  const keys = useRef({});
  const [score, setScore] = useState({ you: 0, cpu: 0 });
  const [time, setTime] = useState(90);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = 900;
    canvas.height = 520;

    const player = { x: 220, y: 260, r: 18, speed: 4 };
    const cpu = { x: 680, y: 260, r: 18, speed: 2.2 };
    const ball = { x: 450, y: 260, r: 10, vx: 0, vy: 0 };

    const pressed = (key) => keys.current[key];

    const movePlayer = () => {
      if (pressed("ArrowUp") || pressed("w")) player.y -= player.speed;
      if (pressed("ArrowDown") || pressed("s")) player.y += player.speed;
      if (pressed("ArrowLeft") || pressed("a")) player.x -= player.speed;
      if (pressed("ArrowRight") || pressed("d")) player.x += player.speed;

      player.x = Math.max(40, Math.min(860, player.x));
      player.y = Math.max(40, Math.min(480, player.y));
    };

    const moveCPU = () => {
      if (cpu.y < ball.y) cpu.y += cpu.speed;
      if (cpu.y > ball.y) cpu.y -= cpu.speed;
      if (cpu.x < ball.x) cpu.x += cpu.speed;
      if (cpu.x > ball.x) cpu.x -= cpu.speed;
    };

    const distance = (a, b) =>
      Math.hypot(a.x - b.x, a.y - b.y);

    const kick = (p, direction) => {
      if (distance(p, ball) < 45) {
        ball.vx = direction;
        ball.vy = (ball.y - p.y) * 0.12;
      }
    };

    const drawPitch = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.strokeRect(20, 20, 860, 480);

      ctx.beginPath();
      ctx.moveTo(450, 20);
      ctx.lineTo(450, 500);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(450, 260, 70, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeRect(20, 170, 110, 180);
      ctx.strokeRect(770, 170, 110, 180);
    };

    const drawPlayer = (p, label, number) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = label === "YOU" ? "#00aaff" : "#ff4444";
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(number, p.x, p.y + 4);

      ctx.font = "11px sans-serif";
      ctx.fillText(label, p.x, p.y - 27);
    };

    const loop = () => {
      movePlayer();
      moveCPU();

      ball.x += ball.vx;
      ball.y += ball.vy;

      ball.vx *= 0.97;
      ball.vy *= 0.97;

      if (ball.y < 30 || ball.y > 490) ball.vy *= -1;

      if (ball.x < 25) {
        setScore((s) => ({ ...s, cpu: s.cpu + 1 }));
        ball.x = 450;
        ball.y = 260;
        ball.vx = 0;
      }

      if (ball.x > 875) {
        setScore((s) => ({ ...s, you: s.you + 1 }));
        ball.x = 450;
        ball.y = 260;
        ball.vx = 0;
      }

      if (distance(player, ball) < 30 && Math.abs(ball.vx) < 1) {
        ball.vx = 3;
      }

      if (distance(cpu, ball) < 30) {
        ball.vx = -3;
      }

      drawPitch();

      drawPlayer(player, "YOU", 10);
      drawPlayer(cpu, "CPU", 9);

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();

      requestAnimationFrame(loop);
    };

    const touchButtons = document.querySelectorAll("[data-key]");

    const touchStart = (e) => {
      const key = e.currentTarget.dataset.key;
      keys.current[key] = true;
    };

    const touchEnd = (e) => {
      const key = e.currentTarget.dataset.key;
      keys.current[key] = false;
    };

    touchButtons.forEach((button) => {
      button.addEventListener("pointerdown", touchStart);
      button.addEventListener("pointerup", touchEnd);
      button.addEventListener("pointerleave", touchEnd);
      button.addEventListener("pointercancel", touchEnd);
    });

    const down = (e) => {
      keys.current[e.key] = true;

      if (e.key === " ") kick(player, 5);
    };

    const up = (e) => {
      keys.current[e.key] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    loop();

    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);

      touchButtons.forEach((button) => {
        button.removeEventListener("pointerdown", touchStart);
        button.removeEventListener("pointerup", touchEnd);
        button.removeEventListener("pointerleave", touchEnd);
        button.removeEventListener("pointercancel", touchEnd);
      });
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="virtual-football-game">
      <div className="game-header">
        <div>
          <span>🎮 AP-STREAM GAMES</span>
          <h2>⚽ Virtual Football</h2>
        </div>

        <div className="game-score">
          YOU {score.you} — {score.cpu} CPU
          <small>{time}s</small>
        </div>
      </div>

      <canvas ref={canvasRef} className="football-canvas" />

      <div className="mobile-game-controls">
        <div className="direction-pad">
          <button data-key="ArrowUp">⬆️</button>
          <div>
            <button data-key="ArrowLeft">⬅️</button>
            <button data-key="ArrowDown">⬇️</button>
            <button data-key="ArrowRight">➡️</button>
          </div>
        </div>

        <button
          className="kick-button"
          onPointerDown={() => {
            window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
          }}
        >
          ⚽ KICK
        </button>
      </div>

      <div className="game-controls">
        <p>🎮 Touch controls enabled</p>
        <p>⚽ Move and kick the ball toward the goal</p>
      </div>
    </section>
  );
}
