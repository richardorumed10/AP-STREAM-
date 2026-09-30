import React, { useEffect, useRef, useState } from "react";

const STEPS = 16;

function makeKick(ctx, destination, time) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(48, time + 0.16);

  gain.gain.setValueAtTime(0.9, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

  osc.connect(gain);
  gain.connect(destination);
  osc.start(time);
  osc.stop(time + 0.2);
}

function makeSnare(ctx, destination, time) {
  const buffer = ctx.createBuffer(
    1,
    ctx.sampleRate * 0.15,
    ctx.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  noise.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 1200;

  gain.gain.setValueAtTime(0.45, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + 0.16);
}

function makeHat(ctx, destination, time) {
  const buffer = ctx.createBuffer(
    1,
    ctx.sampleRate * 0.05,
    ctx.sampleRate
  );

  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  noise.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 5000;

  gain.gain.setValueAtTime(0.18, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noise.start(time);
  noise.stop(time + 0.06);
}

function playNote(ctx, destination, frequency, duration = 0.35) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sawtooth";
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + duration
  );

  osc.connect(gain);
  gain.connect(destination);

  osc.start();
  osc.stop(ctx.currentTime + duration + 0.02);
}

export default function RealMusicEngine() {
  const audioRef = useRef(null);
  const masterRef = useRef(null);
  const timerRef = useRef(null);
  const stepRef = useRef(0);

  const [audioState, setAudioState] = useState("off");
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);

  const [pattern, setPattern] = useState({
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
  });

  async function startAudio() {
    if (!audioRef.current) {
      const ctx = new AudioContext();

      const master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);

      audioRef.current = ctx;
      masterRef.current = master;
    }

    const ctx = audioRef.current;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    setAudioState(ctx.state);
  }

  async function testSound() {
    await startAudio();

    const ctx = audioRef.current;
    const master = masterRef.current;

    playNote(ctx, master, 261.63, 0.5);
  }

  function toggleStep(track, step) {
    setPattern((current) => {
      const exists = current[track].includes(step);

      return {
        ...current,
        [track]: exists
          ? current[track].filter((s) => s !== step)
          : [...current[track], step].sort((a, b) => a - b),
      };
    });
  }

  async function togglePlayback() {
    await startAudio();

    if (playing) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setPlaying(false);
      stepRef.current = 0;
      return;
    }

    const ctx = audioRef.current;
    const master = masterRef.current;

    stepRef.current = 0;

    const interval = (60 / bpm / 4) * 1000;

    function tick() {
      const step = stepRef.current;

      if (pattern.kick.includes(step)) {
        makeKick(ctx, master, ctx.currentTime);
      }

      if (pattern.snare.includes(step)) {
        makeSnare(ctx, master, ctx.currentTime);
      }

      if (pattern.hat.includes(step)) {
        makeHat(ctx, master, ctx.currentTime);
      }

      stepRef.current = (step + 1) % STEPS;
    }

    tick();

    timerRef.current = setInterval(tick, interval);
    setPlaying(true);
  }

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);

      if (audioRef.current) {
        audioRef.current.close();
      }
    };
  }, []);

  return (
    <section className="ap-real-studio">
      <div className="ap-studio-header">
        <div>
          <h2>AP-STREAM Studio</h2>
          <span>Real Audio Engine</span>
        </div>

        <div className="ap-audio-status">
          Audio: {audioState || "off"}
        </div>
      </div>

      <div className="ap-studio-controls">
        <button onClick={startAudio}>
          🔊 Start Audio
        </button>

        <button onClick={testSound}>
          🎹 Test Piano
        </button>

        <button onClick={togglePlayback}>
          {playing ? "⏹ Stop" : "▶ Play"}
        </button>

        <label>
          BPM
          <input
            type="number"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="ap-step-sequencer">
        {["kick", "snare", "hat"].map((track) => (
          <div className="ap-track" key={track}>
            <strong>{track}</strong>

            <div className="ap-steps">
              {Array.from({ length: STEPS }, (_, step) => (
                <button
                  key={step}
                  className={
                    pattern[track].includes(step)
                      ? "active"
                      : ""
                  }
                  onClick={() => toggleStep(track, step)}
                >
                  {step + 1}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="ap-piano">
        {[
          ["C4", 261.63],
          ["D4", 293.66],
          ["E4", 329.63],
          ["F4", 349.23],
          ["G4", 392.0],
          ["A4", 440.0],
          ["B4", 493.88],
          ["C5", 523.25],
        ].map(([name, frequency]) => (
          <button
            key={name}
            onPointerDown={async () => {
              await startAudio();
              playNote(
                audioRef.current,
                masterRef.current,
                frequency
              );
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </section>
  );
}
