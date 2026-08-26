import { useEffect, useRef, useState } from "react";
import "./MusicPlayer.css";

const songs = [
  {
    title: "Midnight Waves",
    artist: "AP-STREAM Artist",
    src: "/music/midnight-waves.mp3",
  },
  {
    title: "African Pulse",
    artist: "AP-STREAM Artist",
    src: "/music/african-pulse.mp3",
  },
  {
    title: "Test Song",
    artist: "AP-STREAM Artist",
    src: "/music/test-song-clean.mp3",
  },
];

function MusicPlayer() {
  const audioRef = useRef(null);

  const [songIndex, setSongIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState("");

  const song = songs[songIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;

    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError("");

    audio.load();

    const updateTime = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const loaded = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    };

    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
      setSongIndex((current) => (current + 1) % songs.length);
    };

    const handleError = () => {
      setError("Unable to play this song.");
      setPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", loaded);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", loaded);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [songIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    setError("");

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch (err) {
      console.error("AP-STREAM audio error:", err);
      setError("Unable to start playback.");
      setPlaying(false);
    }
  }

  function selectSong(index) {
    setSongIndex(index);
    setError("");
  }

  function previousSong() {
    setSongIndex((current) =>
      current === 0 ? songs.length - 1 : current - 1
    );
  }

  function nextSong() {
    setSongIndex((current) => (current + 1) % songs.length);
  }

  function seek(event) {
    const audio = audioRef.current;
    if (!audio) return;

    const value = Number(event.target.value);
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function changeVolume(event) {
    setVolume(Number(event.target.value));
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60);

    return `${minutes}:${String(remaining).padStart(2, "0")}`;
  }

  return (
    <div className="music-player">
      <audio
        ref={audioRef}
        src={song.src}
        preload="metadata"
      />

      <div className="player-info">
        <div className="player-cover">🎵</div>

        <div className="player-track-text">
          <strong>{song.title}</strong>
          <span>{song.artist}</span>
        </div>
      </div>

      <div className="player-controls">
        <button type="button" onClick={previousSong} aria-label="Previous song">
          ⏮
        </button>

        <button
          type="button"
          className="player-play"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? "⏸" : "▶"}
        </button>

        <button type="button" onClick={nextSong} aria-label="Next song">
          ⏭
        </button>
      </div>

      <div className="player-progress">
        <span>{formatTime(currentTime)}</span>

        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          onChange={seek}
          aria-label="Song progress"
        />

        <span>{formatTime(duration)}</span>
      </div>

      <div className="player-volume">
        <span>{volume === 0 ? "🔇" : "🔊"}</span>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={changeVolume}
          aria-label="Volume"
        />
      </div>

      {error && <div className="player-error">{error}</div>}

      <div className="music-queue">
        <div className="queue-title">🎶 AP-STREAM Queue</div>

        {songs.map((item, index) => (
          <button
            type="button"
            key={item.src}
            className={`queue-song ${
              index === songIndex ? "active" : ""
            }`}
            onClick={() => selectSong(index)}
          >
            <span className="queue-number">
              {index === songIndex && playing ? "🔊" : index + 1}
            </span>

            <span className="queue-details">
              <strong>{item.title}</strong>
              <small>{item.artist}</small>
            </span>

            {index === songIndex && <span>✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default MusicPlayer;
