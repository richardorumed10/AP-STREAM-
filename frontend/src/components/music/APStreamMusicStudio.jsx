import React, { useEffect, useMemo, useRef, useState } from "react";
import "./APStreamMusicStudio.css";

const STEPS = 16;

const initialDrums = {
  kick: Array(STEPS).fill(false),
  snare: Array(STEPS).fill(false),
  hat: Array(STEPS).fill(false),
  clap: Array(STEPS).fill(false),
};

const initialNotes = [
  { id: 1, note: "C4", step: 0 },
  { id: 2, note: "E4", step: 4 },
  { id: 3, note: "G4", step: 8 },
  { id: 4, note: "E4", step: 12 },
];

const pianoNotes = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];

const NOTE_FREQUENCIES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
};

export default function APStreamMusicStudio() {
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);
  const [volume, setVolume] = useState(80);
  const [drums, setDrums] = useState(initialDrums);
  const [notes, setNotes] = useState(initialNotes);
  const [projectName, setProjectName] = useState("My AP-STREAM Beat");
  const [audioStatus, setAudioStatus] = useState("Audio ready to start");

  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const noiseBufferRef = useRef(null);

  const beatMs = useMemo(() => 60000 / bpm / 4, [bpm]);

  useEffect(() => {
    if (!playing) return;

    playStep(currentStep);

    const timer = setInterval(() => {
      setCurrentStep((step) => (step + 1) % STEPS);
    }, beatMs);

    return () => clearInterval(timer);
  }, [playing, beatMs, currentStep]);

  const getAudioContext = () => {
    const AudioContext =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContext) {
      setAudioStatus("Web Audio is not supported");
      alert("This browser does not support Web Audio.");
      return null;
    }

    if (!audioContextRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();

      master.gain.value = Math.max(0, Math.min(1, volume / 100));
      master.connect(ctx.destination);

      audioContextRef.current = ctx;
      masterGainRef.current = master;
    }

    const ctx = audioContextRef.current;

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    setAudioStatus(`Audio: ${ctx.state}`);

    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(
        Math.max(0, Math.min(1, volume / 100)),
        ctx.currentTime,
        0.01
      );
    }

    return ctx;
  };

  const getNoiseBuffer = (ctx) => {
    if (noiseBufferRef.current) {
      return noiseBufferRef.current;
    }

    const buffer = ctx.createBuffer(
      1,
      ctx.sampleRate,
      ctx.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    noiseBufferRef.current = buffer;
    return buffer;
  };

  const playTone = (note, duration = 0.22) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const frequency = NOTE_FREQUENCIES[note];
    if (!frequency) return;

    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(masterGainRef.current);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  };

  const playNoise = (
    duration = 0.12,
    filterType = "highpass",
    frequency = 5000,
    level = 0.15
  ) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    source.buffer = getNoiseBuffer(ctx);

    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(level, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGainRef.current);

    source.start(now);
    source.stop(now + duration + 0.02);
  };

  const playKick = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      48,
      now + 0.16
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.55, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.18
    );

    oscillator.connect(gain);
    gain.connect(masterGainRef.current);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  };

  const playSnare = () => {
    playNoise(0.16, "bandpass", 1800, 0.28);
  };

  const playHat = () => {
    playNoise(0.055, "highpass", 6500, 0.16);
  };

  const playClap = () => {
    playNoise(0.12, "bandpass", 1200, 0.22);
  };

  const playDrum = (instrument) => {
    if (instrument === "kick") playKick();
    if (instrument === "snare") playSnare();
    if (instrument === "hat") playHat();
    if (instrument === "clap") playClap();
  };

  const playStep = (step) => {
    if (!playing) return;

    Object.entries(drums).forEach(([instrument, pattern]) => {
      if (pattern[step]) {
        playDrum(instrument);
      }
    });

    notes
      .filter((item) => item.step === step)
      .forEach((item) => {
        playTone(item.note, 0.2);
      });
  };

  const startPlayback = () => {
    getAudioContext();
    setCurrentStep(0);
    setPlaying(true);
  };

  const stopPlayback = () => {
    setPlaying(false);
    setCurrentStep(0);
  };

  const testSound = () => {
    playTone("C4", 0.35);
    setTimeout(() => playTone("E4", 0.35), 120);
    setTimeout(() => playTone("G4", 0.45), 240);
  };

  const toggleDrum = (instrument, step) => {
    setDrums((old) => ({
      ...old,
      [instrument]: old[instrument].map((value, index) =>
        index === step ? !value : value
      ),
    }));

    playDrum(instrument);
  };

  const toggleNote = (note, step) => {
    const exists = notes.some(
      (item) => item.note === note && item.step === step
    );

    if (exists) {
      setNotes((old) =>
        old.filter((item) => !(item.note === note && item.step === step))
      );
      return;
    }

    setNotes((old) => [
      ...old,
      {
        id: Date.now() + Math.random(),
        note,
        step,
      },
    ]);

    playTone(note);
  };

  const saveProject = () => {
    const project = {
      name: projectName,
      bpm,
      volume,
      drums,
      notes,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem("apstream-music-project", JSON.stringify(project));
    alert("AP-STREAM Music Studio project saved.");
  };

  const loadProject = () => {
    const saved = localStorage.getItem("apstream-music-project");

    if (!saved) {
      alert("No saved AP-STREAM music project found.");
      return;
    }

    try {
      const project = JSON.parse(saved);

      setProjectName(project.name || "My AP-STREAM Beat");
      setBpm(project.bpm || 120);
      setVolume(project.volume ?? 80);
      setDrums(project.drums || initialDrums);
      setNotes(project.notes || initialNotes);
    } catch {
      alert("Could not load the saved project.");
    }
  };

  const clearStudio = () => {
    setDrums(initialDrums);
    setNotes([]);
    setCurrentStep(0);
  };

  return (
    <section className="apm-studio">
      <div className="apm-header">
        <div>
          <div className="apm-brand">AP-STREAM MUSIC STUDIO</div>
          <h2>{projectName}</h2>
          <p>Create beats, melodies and songs directly inside AP-STREAM.</p>
        </div>

        <div className="apm-header-actions">
          <button
            onClick={playing ? stopPlayback : startPlayback}
          >
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>

          <button onClick={testSound}>🔊 Test Sound</button>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "8px 10px",
              borderRadius: "9px",
              background: "#eef8f1",
              color: "#287348",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            {audioStatus}
          </span>

          <button onClick={saveProject}>💾 Save</button>
          <button onClick={loadProject}>📂 Load</button>
        </div>
      </div>

      <div className="apm-controls">
        <label>
          Project
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </label>

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

        <label className="apm-volume">
          Volume
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
          <span>{volume}%</span>
        </label>

        <button onClick={clearStudio}>🗑 Clear</button>
      </div>

      <div className="apm-section">
        <div className="apm-section-title">
          
      <div className="apm-section apm-tools-panel">
        <div className="apm-section-title">
          <strong>🎛️ Music Controls</strong>
          <span>Live audio</span>
        </div>

        <div className="apm-tool-grid">
          <div className="apm-tool-card">
            <strong>🎚️ Mixer</strong>
            <label>
              Master
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setVolume(v);
                  if (masterGainRef.current) {
                    masterGainRef.current.gain.value = v / 100;
                  }
                }}
              />
              <span>{volume}%</span>
            </label>
          </div>

          <div className="apm-tool-card">
            <strong>🎛️ Effects</strong>
            <div className="apm-tool-buttons">
              <button onClick={() => playTone("C4", 0.35)}>Clean</button>
              <button onClick={() => playNoise(0.18, "lowpass", 900, 0.12)}>Filter</button>
              <button onClick={() => playNoise(0.12, "highpass", 4500, 0.12)}>High Pass</button>
            </div>
          </div>

          <div className="apm-tool-card">
            <strong>🎸 Instruments</strong>
            <div className="apm-tool-buttons">
              <button onClick={() => playTone("C4", 0.3)}>Piano</button>
              <button onClick={() => playTone("E4", 0.3)}>Keys</button>
              <button onClick={() => playTone("G4", 0.3)}>Lead</button>
            </div>
          </div>

          <div className="apm-tool-card">
            <strong>⏱️ Tempo</strong>
            <input
              type="number"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value) || 120)}
            />
          </div>
        </div>
      </div>

        <strong>🥁 Drum Sequencer</strong>
          <span>{bpm} BPM</span>
        </div>

        <div className="apm-sequencer">
          {Object.entries(drums).map(([instrument, pattern]) => (
            <div className="apm-drum-row" key={instrument}>
              <div className="apm-drum-name">{instrument}</div>

              <div className="apm-steps">
                {pattern.map((active, step) => (
                  <button
                    key={step}
                    className={[
                      "apm-step",
                      active ? "active" : "",
                      currentStep === step && playing ? "playing" : "",
                    ].join(" ")}
                    onClick={() => toggleDrum(instrument, step)}
                    aria-label={`${instrument} step ${step + 1}`}
                  >
                    {step + 1}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="apm-section">
        <div className="apm-section-title">
          <strong>🎹 Piano Roll</strong>
          <span>Tap cells to add/remove notes</span>
        </div>

        <div className="apm-piano">
          <div className="apm-piano-labels">
            {pianoNotes.map((note) => (
              <div key={note}>{note}</div>
            ))}
          </div>

          <div className="apm-piano-grid">
            {pianoNotes.map((note) => (
              <div className="apm-piano-row" key={note}>
                {Array.from({ length: STEPS }).map((_, step) => {
                  const active = notes.some(
                    (item) => item.note === note && item.step === step
                  );

                  return (
                    <button
                      key={step}
                      className={[
                        "apm-note-cell",
                        active ? "active" : "",
                        currentStep === step && playing ? "playing" : "",
                      ].join(" ")}
                      onClick={() => toggleNote(note, step)}
                      aria-label={`${note}, step ${step + 1}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="apm-footer">
        <span>🎵 AP-STREAM Music Studio</span>
        <span>Ready for instruments, effects and audio export.</span>
      </div>
    </section>
  );
}
