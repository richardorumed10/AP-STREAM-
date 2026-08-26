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
    const value = Number(event.target.value);
    setVolume(value);
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

        <div>
          <strong>{song.title}</strong>
          <span>{song.artist}</span>
        </div>
      </div>

      <div className="player-controls">
        <button type="button" onClick={previousSong}>
          ⏮
        </button>

        <button
          type="button"
          className="player-play"
          onClick={togglePlay}
        >
          {playing ? "⏸" : "▶"}
        </button>

        <button type="button" onClick={nextSong}>
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
        />

        <span>{formatTime(duration)}</span>
      </div>

      <div className="player-volume">
        <span>🔊</span>

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

      {error && (
        <div className="player-error">
          {error}
        </div>
      )}
    </div>
  );
}

export default MusicPlayer;
