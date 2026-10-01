import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import DeveloperConsole from './components/DeveloperConsole.jsx';
import ChatCalls from "./components/ChatCalls";
import ProfilesHub from "./components/ProfilesHub";
import Notifications from "./components/Notifications";
import GroupsHub from "./components/GroupsHub";
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
import Home from "./Home";

import ConnectionsHub from "./components/ConnectionsHub";
import AdminDashboard from "./components/AdminDashboard";

import BodaRide from "./components/BodaRide";
import BodaRiderRegistration from "./components/BodaRiderRegistration";
import BodaFacialVerification from "./components/BodaFacialVerification";

import AIAssistant from "./components/AIAssistant";
import AIStudio from "./components/AIStudio";
import RecordingStudio from "./components/RecordingStudio";
import AIAssistantManager from "./components/AIAssistantManager";
import APStreamMusicStudio from "./components/music/APStreamMusicStudio";
const apStreamMapIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});



const musicTracks = [
  { id: 1, title: "Midnight Waves", artist: "AP Artist", file: "/music/midnight-waves.mp3", icon: "♫" },
  { id: 2, title: "African Pulse", artist: "African Pulse", file: "/music/african-pulse.mp3", icon: "♪" },
  { id: 3, title: "City Lights", artist: "AP Artist", file: "/music/test-song-clean.mp3", icon: "♬" },
];

const artists = [
  { id: 1, name: "AP Artist", description: "Artist profile coming soon" },
  { id: 2, name: "African Pulse", description: "Artist profile coming soon" },
];

const initialPosts = [
  {
    id: 1,
    artist: "AP Artist",
    time: "2h ago",
    text: "New music coming soon! 🎵 Stay tuned.",
    likes: 0,
    liked: false,
    comments: [],
  },
  {
    id: 2,
    artist: "African Pulse",
    time: "5h ago",
    text: "Thank you for supporting African music. 🌍❤️",
    likes: 0,
    liked: false,
    comments: [],
  },
];


const newsItems = [
  {
    id: 1,
    category: "breaking",
    label: "🚨 BREAKING",
    title: "Latest News on AP-STREAM",
    text: "Stay updated with important breaking stories and developments from Uganda and around the world.",
    url: "https://www.bbc.com/news",
  },
  {
    id: 2,
    category: "uganda",
    label: "🇺🇬 UGANDA",
    title: "Uganda News",
    text: "Follow the latest national news, community stories, business, technology and entertainment.",
    url: "https://www.monitor.co.ug/",
  },
  {
    id: 3,
    category: "africa",
    label: "🌍 AFRICA",
    title: "Africa News",
    text: "Discover major stories and developments from across the African continent.",
    url: "https://www.aljazeera.com/africa/",
  },
  {
    id: 4,
    category: "world",
    label: "🌎 WORLD",
    title: "World News",
    text: "Important international stories brought together in one place.",
    url: "https://www.reuters.com/world/",
  },
  {
    id: 5,
    category: "technology",
    label: "💻 TECHNOLOGY",
    title: "Technology & Innovation",
    text: "Technology, artificial intelligence, startups and digital innovation.",
    url: "https://www.reuters.com/technology/",
  },
  {
    id: 6,
    category: "entertainment",
    label: "🎵 ENTERTAINMENT",
    title: "Entertainment News",
    text: "Music, artists, creators, movies and entertainment from Africa and beyond.",
    url: "https://www.bbc.com/entertainment",
  },
];






function App() {
  const [shortViewerOpen, setShortViewerOpen] = useState(false);
  const [activeStudio, setActiveStudio] = useState(null);
  const [activeSection, setActiveSection] = useState("home");
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [videoTitle, setVideoTitle] = useState("");

  const loadUploadedVideos = async () => {
    try {
      const response = await fetch("/api/videos");
      const data = await response.json();

      if (!response.ok || !Array.isArray(data.videos)) {
        throw new Error(data.message || "Could not load videos");
      }

      const videos = data.videos.map((video) => ({
        id: video.id,
        title: video.title || "AP-STREAM Video",
        url: video.video_url || "",
        name: video.title || "AP-STREAM Video",
        creator: "AP-STREAM Creator",
      }));

      setUploadedVideos(videos);
    } catch (error) {
      console.error("Could not load AP-STREAM videos:", error);
    }
  };

  const [musicOpen, setMusicOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [appsSearch, setAppsSearch] = useState("");
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [musicProgress, setMusicProgress] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const [musicVolume, setMusicVolume] = useState(1);
  const [posts, setPosts] = useState(initialPosts);
  const [shorts, setShorts] = useState([
    {
      id: 1,
      title: "Welcome to AP-STREAM Shorts",
      creator: "@apstream",
      video: "",
      likes: 0,
      comments: 0,
    },
    {
      id: 2,
      title: "Create. Share. Discover.",
      creator: "@creators",
      video: "",
      likes: 0,
      comments: 0,
    },
  ]);
  const [activeShort, setActiveShort] = useState(0);
  const [likedShorts, setLikedShorts] = useState({});
  const [shortLikeCounts, setShortLikeCounts] = useState({});
  const [subscribedCreators, setSubscribedCreators] = useState({});

  const [newPost, setNewPost] = useState("");
  const [commentText, setCommentText] = useState({});
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      icon: "👋",
      title: "Welcome to AP-STREAM",
      text: "Your AP Stream is ready.",
      time: "Just now",
      read: false,
    },
  ]);

  function addNotification(icon, title, text) {
    setNotifications((current) => [
      {
        id: Date.now() + Math.random(),
        icon,
        title,
        text,
        time: "Just now",
        read: false,
      },
      ...current,
    ]);
  }

  const [showLoginMessage, setShowLoginMessage] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const [mailFolder, setMailFolder] = useState("inbox");
  const [mailMessages, setMailMessages] = useState([]);
  const [mailSelected, setMailSelected] = useState(null);
  const [mailSearch, setMailSearch] = useState("");
  const [mailLoading, setMailLoading] = useState(false);
  const [mailError, setMailError] = useState("");
  const [mailComposeOpen, setMailComposeOpen] = useState(false);
  const [mailTo, setMailTo] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [mailSending, setMailSending] = useState(false);
  const [mailSaving, setMailSaving] = useState(false);

  const mailFiltered = mailMessages.filter((message) => {
    const q = mailSearch.trim().toLowerCase();

    if (!q) return true;

    return [
      message.subject,
      message.body,
      message.sender_username,
      message.sender_email,
      message.recipient_username,
      message.recipient_email,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q));
  });

  const getMailHeaders = () => {
    const token = localStorage.getItem("apstream_token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const loadMail = async (folder = mailFolder) => {
    const token = localStorage.getItem("apstream_token");

    if (!token) {
      setMailError("Please log in to use AP-STREAM Mail.");
      setMailMessages([]);
      return;
    }

    setMailLoading(true);
    setMailError("");
    setMailSelected(null);

    try {
      const response = await fetch(`/api/mail/${folder}`, {
        headers: getMailHeaders(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to load mail.");
      }

      setMailMessages(Array.isArray(data) ? data : (data.messages || []));
    } catch (error) {
      console.error("AP-STREAM Mail load error:", error);
      setMailError(error.message || "Unable to load mail.");
      setMailMessages([]);
    } finally {
      setMailLoading(false);
    }
  };

  const openMail = async (message) => {
    setMailSelected(message);

    if (message.is_read) return;

    try {
      const response = await fetch(`/api/mail/${message.id}/read`, {
        method: "PATCH",
        headers: getMailHeaders(),
      });

      if (!response.ok) return;

      setMailMessages((current) =>
        current.map((item) =>
          item.id === message.id
            ? { ...item, is_read: true }
            : item
        )
      );

      setMailSelected((current) =>
        current ? { ...current, is_read: true } : current
      );
    } catch (error) {
      console.error("AP-STREAM Mail read error:", error);
    }
  };

  const sendMail = async () => {
    if (!mailTo.trim()) {
      setMailError("Enter a recipient.");
      return;
    }

    if (!mailSubject.trim() && !mailBody.trim()) {
      setMailError("Add a subject or message.");
      return;
    }

    setMailSending(true);
    setMailError("");

    try {
      const response = await fetch("/api/mail/send", {
        method: "POST",
        headers: getMailHeaders(),
        body: JSON.stringify({
          to: mailTo.trim(),
          subject: mailSubject.trim(),
          body: mailBody,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to send mail.");
      }

      setMailTo("");
      setMailSubject("");
      setMailBody("");
      setMailComposeOpen(false);
      setMailFolder("sent");
      await loadMail("sent");
    } catch (error) {
      console.error("AP-STREAM Mail send error:", error);
      setMailError(error.message || "Unable to send mail.");
    } finally {
      setMailSending(false);
    }
  };

  const saveMailDraft = async () => {
    setMailSaving(true);
    setMailError("");

    try {
      const response = await fetch("/api/mail/draft", {
        method: "POST",
        headers: getMailHeaders(),
        body: JSON.stringify({
          to: mailTo.trim(),
          subject: mailSubject.trim(),
          body: mailBody,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Unable to save draft.");
      }

      setMailComposeOpen(false);
      setMailFolder("drafts");
      await loadMail("drafts");
    } catch (error) {
      console.error("AP-STREAM Mail draft error:", error);
      setMailError(error.message || "Unable to save draft.");
    } finally {
      setMailSaving(false);
    }
  };

  useEffect(() => {
    if (activeFeature !== "mail") return;

    loadMail(mailFolder);
  }, [activeFeature, mailFolder]);


  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("apstream_user") || "null");
    } catch {
      return null;
    }
  });

  const [newsCategory, setNewsCategory] = useState("all");
  const [newsSearch, setNewsSearch] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchType, setGlobalSearchType] = useState("all");

  const [apSearchHistory, setApSearchHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("apstream_search_history") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const query = newsSearch.trim();

    if (!query) {
      setGlobalSearchResults([]);
      setGlobalSearchLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setGlobalSearchLoading(true);

      const normalized = query
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const tokens = normalized.split(" ").filter(Boolean);
      const results = [];

      const addResult = (item, type, title, text = "", extra = {}) => {
        const safeTitle = String(title || "").trim();
        const safeText = String(text || "").trim();

        if (!safeTitle) return;

        const haystack = [
          safeTitle,
          safeText,
          item?.artist,
          item?.creator,
          item?.category,
          item?.label,
          item?.name,
          item?.description,
          item?.bio,
          item?.username,
          item?.genre
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const normalizedHaystack = haystack
          .replace(/[^\w\s]/g, " ")
          .replace(/\s+/g, " ");

        const matchedTokens = tokens.filter(token =>
          normalizedHaystack.includes(token)
        );

        if (!matchedTokens.length) return;

        results.push({
          id: type + "-" + (item?.id || safeTitle) + "-" + results.length,
          type,
          title: safeTitle,
          text: safeText,
          ...extra,
          _matchedTokens: matchedTokens.length
        });
      };

      // Local AP-STREAM content
      musicTracks.forEach(track =>
        addResult(
          track,
          "Music",
          track.title,
          track.artist || "AP-STREAM Music",
          {
            icon: "🎵",
            image: track.cover || track.artwork || track.image || ""
          }
        )
      );

      newsItems.forEach(item =>
        addResult(
          item,
          "News",
          item.title,
          item.text || item.description || "",
          {
            icon: "📰",
            url: item.url || ""
          }
        )
      );

      // AP-STREAM content APIs
      const requests = [
        ["/api/songs", "Music"],
        ["/api/artists", "Artists"],
        ["/api/shorts", "Shorts"],
        ["/api/videos", "Videos"],
        ["/api/tv", "TV"],
        ["/api/radio", "Radio"],
        ["/api/posts", "Posts"],
        ["/api/creators", "Creators"],
              [`/api/search?q=${encodeURIComponent(query)}`, "Web"]
      ];

      const responses = await Promise.all(
        requests.map(async ([url, type]) => {
          try {
            const response = await fetch(url);

            if (!response.ok) {
              return { type, data: [] };
            }

            const json = await response.json();

            const possibleLists = [
              json,
              json?.data,
              json?.results,
              json?.items,
              json?.songs,
              json?.artists,
              json?.shorts,
              json?.videos,
              json?.tv,
              json?.radio,
              json?.posts,
              json?.creators
            ];

            const list = possibleLists.find(Array.isArray) || [];

            return { type, data: list };
          } catch {
            return { type, data: [] };
          }
        })
      );

      responses.forEach(({ type, data }) => {
        data.forEach(item => {
          const title =
            item.title ||
            item.name ||
            item.nameEn ||
            item.artist ||
            item.username ||
            item.stationName ||
            item.channelName ||
            item.label ||
            `${type} result`;

          const text =
            item.description ||
            item.bio ||
            item.text ||
            item.artist ||
            item.creator ||
            item.category ||
            item.genre ||
            "";

          const icon =
            type === "Music" ? "🎵" :
            type === "Artists" ? "🎤" :
            type === "Shorts" ? "📱" :
            type === "Videos" ? "🎬" :
            type === "TV" ? "📺" :
            type === "Radio" ? "📻" :
            type === "Posts" ? "💬" :
            type === "Creators" ? "✨" :
            "🔎";

          addResult(item, type, title, text, {
            icon,
            url:
              item.url ||
              item.videoUrl ||
              item.audioUrl ||
              item.link ||
              "",
            image:
              item.image ||
              item.thumbnail ||
              item.cover ||
              item.coverUrl ||
              item.artwork ||
              ""
          });
        });
      });

      // Remove duplicates
      const unique = [];
      const seen = new Set();

      results.forEach(result => {
        const key = (
          result.type +
          "|" +
          String(result.title).toLowerCase().trim()
        );

        if (!seen.has(key)) {
          seen.add(key);
          unique.push(result);
        }
      });

      // Google-style relevance ranking
      const ranked = unique
        .map(result => {
          const title = String(result.title || "").toLowerCase();
          const text = String(result.text || "").toLowerCase();

          const cleanTitle = title
            .replace(/[^\w\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          let score = 0;

          // Exact query match
          if (cleanTitle === normalized) score += 1000;

          // Query at beginning of title
          if (cleanTitle.startsWith(normalized)) score += 500;

          // Full query appears in title
          if (cleanTitle.includes(normalized)) score += 300;

          // Individual query words in title
          tokens.forEach(token => {
            if (cleanTitle.includes(token)) score += 100;
            if (text.includes(token)) score += 25;
          });

          // More matched words = stronger result
          score += (result._matchedTokens || 0) * 75;

          // Prefer important AP-STREAM content types
          const typeBonus = {
            Music: 20,
            Artists: 18,
            Videos: 16,
            Shorts: 15,
            Creators: 14,
            Posts: 12,
            News: 10,
            TV: 8,
            Radio: 8
          };

          score += typeBonus[result.type] || 0;

          return {
            ...result,
            searchScore: score,
            displayUrl: result.url || "",
            image: result.image || ""
          };
        })
        .sort((a, b) => b.searchScore - a.searchScore);

      // Keep device search history organized
      if (query.length >= 2) {
        try {
          const existing = JSON.parse(
            localStorage.getItem("apstream_search_history") || "[]"
          );

          const updated = [
            query,
            ...existing.filter(
              x => String(x).toLowerCase() !== query.toLowerCase()
            )
          ].slice(0, 12);

          localStorage.setItem(
            "apstream_search_history",
            JSON.stringify(updated)
          );

          setApSearchHistory(updated);
        } catch {}
      }

      if (!cancelled) {
        setGlobalSearchResults(ranked.slice(0, 80));
        setGlobalSearchLoading(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [newsSearch]);



  const [callOpen, setCallOpen] = useState(false);
  const [callType, setCallType] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [facingMode, setFacingMode] = useState("user");
  const [callError, setCallError] = useState("");

  const videoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const activePeerIdRef = useRef(null);
  const pendingOfferRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const streamRef = useRef(null);
  const callerTuneAudioRef = useRef(null);

  // Camera quality: Auto uses the best resolution available on the device.
  const [cameraQuality, setCameraQuality] = useState("auto");

  async function applyCameraQuality(quality) {
    setCameraQuality(quality);

    const stream = streamRef.current;
    const track = stream?.getVideoTracks?.()[0];

    if (!track) return;

    try {
      let constraints = {};

      if (quality === "1080p") {
        constraints = {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30, min: 24, max: 60 }
        };
      } else if (quality === "720p") {
        constraints = {
          width: { ideal: 1280, min: 960 },
          height: { ideal: 720, min: 540 },
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30, min: 24, max: 60 }
        };
      } else {
        constraints = {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          aspectRatio: { ideal: 16 / 9 },
          frameRate: { ideal: 30, min: 24, max: 60 }
        };
      }

      await track.applyConstraints(constraints);

      // Keep the local preview synchronized with the updated track.
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      console.log(
        "AP-STREAM camera quality:",
        quality,
        track.getSettings?.()
      );
    } catch (error) {
      console.warn("Camera quality change failed:", error);
      setCallError("That camera quality is not supported by this device.");
    }
  }


  function startCallerTune() {
    try {
      if (callerTuneAudioRef.current) {
        callerTuneAudioRef.current.pause();
        callerTuneAudioRef.current.currentTime = 0;
      }

      const audio = new Audio("/music/african-pulse.mp3");
      audio.loop = true;
      audio.volume = 0.65;
      callerTuneAudioRef.current = audio;

      audio.play().catch((error) => {
        console.warn("Caller tune autoplay blocked:", error);
      });
    } catch (error) {
      console.warn("Caller tune failed:", error);
    }
  }

  function stopCallerTune() {
    const audio = callerTuneAudioRef.current;

    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";
    } catch {}

    callerTuneAudioRef.current = null;
  }

  const callPeerRef = useRef(null);
  const callSocketRef = useRef(null);

  function playMusic(track) {
    if (currentAudio === track.id && audioElement) {
      if (audioElement.paused) audioElement.play();
      else audioElement.pause();
      setAudioElement(audioElement);
      return;
    }

    if (audioElement) audioElement.pause();

    const audio = new Audio(track.file);
    audio.volume = musicVolume;
    audio.ontimeupdate = () => setMusicProgress(audio.currentTime);
    audio.onloadedmetadata = () => setMusicDuration(audio.duration || 0);


    audio.onended = () => {
      const index = musicTracks.findIndex((item) => item.id === track.id);
      const nextTrack = musicTracks[index + 1];

      if (nextTrack) playMusic(nextTrack);
      else {
        setCurrentAudio(null);
        setAudioElement(null);
      }
    };

    audio.play().catch((error) => console.error("Audio playback failed:", error));

    setAudioElement(audio);
    setCurrentAudio(track.id);
  }

  function nextMusic() {
    const index = musicTracks.findIndex((track) => track.id === currentAudio);
    const nextTrack = musicTracks[index + 1];
    if (nextTrack) playMusic(nextTrack);
  }

  function previousMusic() {
    const index = musicTracks.findIndex((track) => track.id === currentAudio);
    const previousTrack = musicTracks[index - 1];
    if (previousTrack) playMusic(previousTrack);
  }

  function stopMusic() {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setCurrentAudio(null);
    setAudioElement(null);
  }

  function toggleLike(postId) {
    const post = posts.find((item) => item.id === postId);

    if (post && !post.liked) {
      addNotification(
        "❤️",
        "New like",
        `${post.artist} received a new like on their post.`
      );
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  }

  function notifyLike(postId) {
    const post = posts.find((item) => item.id === postId);
    if (post && !post.liked) {
      addNotification(
        "❤️",
        "New like",
        `${post.artist} received a new like on their post.`
      );
    }
  }

  function createPost() {
    const text = newPost.trim();
    if (!text) return;

    const post = {
      id: Date.now(),
      artist: authUser?.username || "AP User",
      avatar: authUser?.avatar || "",
      time: "Just now",
      text,
      likes: 0,
      liked: false,
      comments: [],
      shared: 0,
      saved: false,
      reposted: false,
    };

    setPosts((currentPosts) => [post, ...currentPosts]);
    setNewPost("");
  }

  function toggleSave(postId) {
    const post = posts.find((item) => item.id === postId);

    if (post && !post.saved) {
      addNotification(
        "🔖",
        "Post saved",
        `You saved ${post.artist}'s post.`
      );
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? { ...post, saved: !post.saved }
          : post
      )
    );
  }

  function repostPost(postId) {
    const post = posts.find((item) => item.id === postId);

    if (post && !post.reposted) {
      addNotification(
        "🔁",
        "New repost",
        `${post.artist}'s post was reposted.`
      );
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? { ...post, reposted: !post.reposted }
          : post
      )
    );
  }

  function sharePostWithCount(postId, text) {
    const post = posts.find((item) => item.id === postId);

    if (post) {
      addNotification(
        "↗",
        "Post shared",
        `You shared ${post.artist}'s post.`
      );
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? { ...post, shared: (post.shared || 0) + 1 }
          : post
      )
    );

    if (navigator.share) {
      navigator.share({
        title: "AP-STREAM",
        text,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  function addComment(postId) {
    const text = (commentText[postId] || "").trim();
    if (!text) return;

    const post = posts.find((item) => item.id === postId);

    if (post) {
      addNotification(
        "💬",
        "New comment",
        `Someone commented on ${post.artist}'s post.`
      );
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, text] }
          : post
      )
    );

    setCommentText((current) => ({
      ...current,
      [postId]: "",
    }));
  }

  async function sharePost(text) {
    try {
      if (navigator.share) {
        await navigator.share({ title: "AP-STREAM", text });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert("Post copied to clipboard.");
      } else {
        alert(text);
      }
    } catch {
      // Sharing cancelled.
    }
  }

  function login() {
    document.getElementById("login")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleAuth() {
    setAuthError("");
    setAuthMessage("");

    const email = authEmail.trim();
    const password = authPassword;

    if (!email || !password) {
      setAuthError("Please enter your email and password.");
      return;
    }

    if (authMode === "register" && !authName.trim()) {
      setAuthError("Please enter your name.");
      return;
    }

    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "register"
          ? "/api/auth/register"
          : "/api/auth/login";

      const body =
        authMode === "register"
          ? {
              username: authName.trim(),
              email,
              password,
            }
          : {
              email,
              password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Authentication failed."
        );
      }

      const user = data.user || data.account || {
        username: authName.trim(),
        email,
      };

      localStorage.setItem("apstream_user", JSON.stringify(user));

      if (data.token) {
        localStorage.setItem("apstream_token", data.token);
      }

      setAuthUser(user);
      setAuthMessage(
        authMode === "register"
          ? "🎉 Account created successfully!"
          : "✅ Login successful!"
      );
      setAuthPassword("");
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(
        error.message ||
          "Unable to connect to the AP-STREAM authentication server."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  const [isLive, setIsLive] = useState(false);
  const [liveId, setLiveId] = useState("");
  const socketRef = useRef(null);
  const liveIdRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());

  // ============================================================
  // AP-STREAM CONFERENCE ROOMS
  // Separate from personal 1-to-1 calls.
  // ============================================================
  const conferencePeersRef = useRef(new Map());
  const conferenceLocalStreamRef = useRef(null);
  const conferenceRemoteStreamsRef = useRef(new Map());
  const [conferenceOpen, setConferenceOpen] = useState(false);
  const [conferenceRoomId, setConferenceRoomId] = useState("");
  const [conferenceRoomName, setConferenceRoomName] = useState("AP-STREAM Conference");
  const [conferenceParticipants, setConferenceParticipants] = useState([]);
  const [conferenceError, setConferenceError] = useState("");
  const [conferenceMicOn, setConferenceMicOn] = useState(true);
  const [conferenceCameraOn, setConferenceCameraOn] = useState(true);
  const [conferenceRemoteStreams, setConferenceRemoteStreams] = useState([]);

  function logout() {
    localStorage.removeItem("apstream_user");
    localStorage.removeItem("apstream_token");
    setAuthUser(null);
    setAuthMessage("You have been logged out.");
  }

  useEffect(() => {
    const handleGoLive = () => {
      setIsLive(true);
      startCall("video", true);
    };

    window.addEventListener("apstream-go-live", handleGoLive);

  return () => {
      window.removeEventListener("apstream-go-live", handleGoLive);
    };
  }, []);


  // =========================================================
  // AP-STREAM — CLEAN 1-TO-1 WEBRTC CALL SYSTEM
  // =========================================================

  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  };

  async function startCall(type, targetId = null) {
    setCallError("");
    setCallType(type);

    // Caller hears the AP-STREAM tune while waiting for the other person.
    if (targetId) {
      startCallerTune();
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not support camera or microphone access.");
      }

      const constraints =
        type === "video"
          ? {
              video: {
                width: { ideal: 1920, min: 1280 },
                height: { ideal: 1080, min: 720 },
                aspectRatio: { ideal: 16 / 9 },
                frameRate: { ideal: 30, min: 24, max: 60 },
                facingMode,
                resizeMode: "none",
                focusMode: "continuous",
                exposureMode: "continuous",
                whiteBalanceMode: "continuous"
              },
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: { ideal: 2 },
                sampleRate: { ideal: 48000 },
                sampleSize: { ideal: 16 }
              }
            }
          : {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                channelCount: { ideal: 2 },
                sampleRate: { ideal: 48000 },
                sampleSize: { ideal: 16 }
              }
            };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;

      // Apply the best camera settings the device/browser actually supports.
      if (type === "video") {
        const videoTrack = stream.getVideoTracks()[0];

        if (videoTrack) {
          try {
            const capabilities = videoTrack.getCapabilities?.() || {};
            const advanced = {};

            if (capabilities.focusMode?.includes("continuous")) {
              advanced.focusMode = "continuous";
            }

            if (capabilities.exposureMode?.includes("continuous")) {
              advanced.exposureMode = "continuous";
            }

            if (capabilities.whiteBalanceMode?.includes("continuous")) {
              advanced.whiteBalanceMode = "continuous";
            }

            if (Object.keys(advanced).length) {
              await videoTrack.applyConstraints({ advanced: [advanced] }).catch(() => {});
            }

            videoTrack.contentHint = "motion";
          } catch (cameraTuneError) {
            console.warn("Advanced camera tuning unavailable:", cameraTuneError);
          }
        }
      }

      if (videoRef.current && type === "video") {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      setCallOpen(true);

      const socket = socketRef.current || io(
        SOCKET_URL,
        {
          transports: ["websocket", "polling"]
        }
      );

      socketRef.current = socket;

      // Clean old peer if one exists.
      if (peerConnectionsRef.current) {
        peerConnectionsRef.current.forEach((peer) => {
          try {
            peer.close();
          } catch {}
        });
        peerConnectionsRef.current.clear();
      }

      const peer = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peer;

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      peer.ontrack = async (event) => {
        const remoteStream =
          event.streams?.[0] ||
          new MediaStream([event.track]);

        remoteStreamRef.current = remoteStream;

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;

          // IMPORTANT:
          // Remote video must NOT be muted.
          remoteVideoRef.current.muted = false;
          remoteVideoRef.current.volume = 1;

          await remoteVideoRef.current.play().catch((error) => {
            console.warn("Remote media autoplay waiting for user:", error);
          });
        }

        setRemoteConnected(true);
      };

      peer.onicecandidate = (event) => {
        if (!event.candidate || !socketRef.current || !activePeerIdRef.current) {
          return;
        }

        socketRef.current.emit("call:ice-candidate", {
          targetId: activePeerIdRef.current,
          candidate: event.candidate
        });
      };

      peer.onconnectionstatechange = () => {
        const state = peer.connectionState;

        if (state === "connected") {
          setRemoteConnected(true);
        }

        if (
          state === "failed" ||
          state === "disconnected" ||
          state === "closed"
        ) {
          setRemoteConnected(false);
        }
      };

      if (targetId) {
        activePeerIdRef.current = targetId;

        const offer = await peer.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === "video"
        });

        await peer.setLocalDescription(offer);

        socket.emit("call:offer", {
          targetId,
          callType: type,
          offer
        });
      }
    } catch (error) {
      stopCallerTune();
      console.error("1-to-1 call failed:", error);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setCallError(
        error?.message ||
          "Unable to start the call. Please allow microphone/camera access."
      );

      setCallOpen(false);
    }
  }

  useEffect(() => {
    const socket = socketRef.current || io(
      SOCKET_URL,
      {
        transports: ["websocket", "polling"]
      }
    );

    socketRef.current = socket;

    const handleOffer = async ({ callerId, offer, callType: incomingType }) => {
      try {
        activePeerIdRef.current = callerId;
        setCallType(incomingType || "audio");
        setIncomingCall(true);
        setIncomingCallType(incomingType || "audio");
        pendingOfferRef.current = offer;
      } catch (error) {
        console.error("Incoming call error:", error);
      }
    };

    const handleAnswer = async ({ answererId, answer }) => {
      try {
        activePeerIdRef.current = answererId;

        const peer = peerConnectionRef.current;
        if (!peer) return;

        await peer.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (error) {
        console.error("Call answer error:", error);
      }
    };

    const handleIceCandidate = async ({ senderId, candidate }) => {
      try {
        activePeerIdRef.current = senderId;

        const peer = peerConnectionRef.current;
        if (!peer || !candidate) return;

        await peer.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error("ICE candidate error:", error);
      }
    };

    const handleCallEnd = () => {
      cleanupCall(false);
    };

    socket.on("call:offer", handleOffer);
    socket.on("call:answer", handleAnswer);
    socket.on("call:ice-candidate", handleIceCandidate);
    socket.on("call:end", handleCallEnd);

    return () => {
      socket.off("call:offer", handleOffer);
      socket.off("call:answer", handleAnswer);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:end", handleCallEnd);
    };
  }, []);

  // ============================================================
  // AP-STREAM CONFERENCE WEBRTC
  // Separate from the existing personal call system.
  // ============================================================

  const ensureCallSocket = () => {
    if (socketRef.current) return socketRef.current;

    const socket = io(
      SOCKET_URL,
      {
        transports: ["websocket", "polling"]
      }
    );

    socketRef.current = socket;
    return socket;
  };

  const startConferenceMedia = async () => {
    if (conferenceLocalStreamRef.current) {
      return conferenceLocalStreamRef.current;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 360 },
        aspectRatio: { ideal: 16 / 9 },
        frameRate: { ideal: 30, min: 15, max: 30 },
        facingMode: "user"
      }
    });

    conferenceLocalStreamRef.current = stream;
    setConferenceMicOn(stream.getAudioTracks().some((track) => track.enabled));
    setConferenceCameraOn(stream.getVideoTracks().some((track) => track.enabled));

    return stream;
  };

  const closeConferencePeer = (participantId) => {
    const peer = conferencePeersRef.current.get(participantId);

    if (peer) {
      try {
        peer.close();
      } catch {}
    }

    conferencePeersRef.current.delete(participantId);

    conferenceRemoteStreamsRef.current.delete(participantId);

    setConferenceRemoteStreams(
      Array.from(conferenceRemoteStreamsRef.current.entries()).map(
        ([id, stream]) => ({ id, stream })
      )
    );

    setConferenceParticipants((current) =>
      current.filter((id) => id !== participantId)
    );
  };

  const createConferencePeer = async (participantId, makeOffer = false) => {
    if (!participantId) return null;

    const existing = conferencePeersRef.current.get(participantId);

    if (existing) {
      if (makeOffer) {
        const offer = await existing.createOffer();
        await existing.setLocalDescription(offer);

        ensureCallSocket().emit("conference:offer", {
          targetId: participantId,
          roomId: conferenceRoomId,
          offer
        });
      }

      return existing;
    }

    const stream = await startConferenceMedia();

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });

    conferencePeersRef.current.set(participantId, peer);

    stream.getTracks().forEach((track) => {
      peer.addTrack(track, stream);
    });

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;

      ensureCallSocket().emit("conference:ice-candidate", {
        targetId: participantId,
        roomId: conferenceRoomId,
        candidate: event.candidate
      });
    };

    peer.ontrack = (event) => {
      const remoteStream =
        event.streams?.[0] ||
        new MediaStream([event.track]);

      conferenceRemoteStreamsRef.current.set(
        participantId,
        remoteStream
      );

      setConferenceRemoteStreams(
        Array.from(conferenceRemoteStreamsRef.current.entries()).map(
          ([id, remote]) => ({ id, stream: remote })
        )
      );
    };

    peer.onconnectionstatechange = () => {
      if (
        peer.connectionState === "failed" ||
        peer.connectionState === "closed" ||
        peer.connectionState === "disconnected"
      ) {
        closeConferencePeer(participantId);
      }
    };

    if (makeOffer) {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      ensureCallSocket().emit("conference:offer", {
        targetId: participantId,
        roomId: conferenceRoomId,
        offer
      });
    }

    return peer;
  };

  const openConferenceRoom = async (roomId, name = "AP-STREAM Conference") => {
    try {
      setConferenceError("");

      const id = String(roomId || "").trim().toUpperCase();
      if (!id) return;

      await startConferenceMedia();

      setConferenceRoomId(id);
      setConferenceRoomName(name);
      setConferenceOpen(true);

      ensureCallSocket().emit("conference:create", {
        roomId: id,
        name
      });
    } catch (error) {
      console.error("Conference media error:", error);
      setConferenceError(
        error?.message || "Camera or microphone permission was denied."
      );
    }
  };

  const joinConferenceRoom = async (roomId) => {
    try {
      setConferenceError("");

      const id = String(roomId || "").trim().toUpperCase();
      if (!id) return;

      await startConferenceMedia();

      setConferenceRoomId(id);
      setConferenceOpen(true);

      ensureCallSocket().emit("conference:join", {
        roomId: id
      });
    } catch (error) {
      console.error("Conference join error:", error);
      setConferenceError(
        error?.message || "Unable to access camera or microphone."
      );
    }
  };

  const leaveConferenceRoom = () => {
    const socket = socketRef.current;

    if (socket && conferenceRoomId) {
      socket.emit("conference:leave", {
        roomId: conferenceRoomId
      });
    }

    conferencePeersRef.current.forEach((peer) => {
      try {
        peer.close();
      } catch {}
    });

    conferencePeersRef.current.clear();
    conferenceRemoteStreamsRef.current.clear();

    if (conferenceLocalStreamRef.current) {
      conferenceLocalStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      conferenceLocalStreamRef.current = null;
    }

    setConferenceRemoteStreams([]);
    setConferenceParticipants([]);
    setConferenceRoomId("");
    setConferenceOpen(false);
    setConferenceError("");
    setConferenceMicOn(true);
    setConferenceCameraOn(true);
  };

  const toggleConferenceMic = () => {
    const stream = conferenceLocalStreamRef.current;
    if (!stream) return;

    const tracks = stream.getAudioTracks();
    if (!tracks.length) return;

    const next = !tracks[0].enabled;

    tracks.forEach((track) => {
      track.enabled = next;
    });

    setConferenceMicOn(next);
  };

  const toggleConferenceCamera = () => {
    const stream = conferenceLocalStreamRef.current;
    if (!stream) return;

    const tracks = stream.getVideoTracks();
    if (!tracks.length) return;

    const next = !tracks[0].enabled;

    tracks.forEach((track) => {
      track.enabled = next;
    });

    setConferenceCameraOn(next);
  };

  useEffect(() => {
    const socket = ensureCallSocket();

    const handleConferenceCreated = ({
      roomId,
      name,
      hostId
    } = {}) => {
      if (roomId) setConferenceRoomId(roomId);
      if (name) setConferenceRoomName(name);

      if (hostId === socket.id) {
        setConferenceParticipants([]);
      }
    };

    const handleConferenceJoined = async ({
      roomId,
      hostId,
      participants = []
    } = {}) => {
      if (roomId) setConferenceRoomId(roomId);

      const others = participants.filter(
        (participantId) => participantId && participantId !== socket.id
      );

      setConferenceParticipants(others);

      for (const participantId of others) {
        try {
          await createConferencePeer(participantId, true);
        } catch (error) {
          console.error(
            "Conference offer error:",
            participantId,
            error
          );
        }
      }

      if (hostId && hostId !== socket.id && !others.includes(hostId)) {
        setConferenceParticipants((current) =>
          current.includes(hostId) ? current : [...current, hostId]
        );
      }
    };

    const handleConferenceParticipantJoined = async ({
      participantId
    } = {}) => {
      if (!participantId || participantId === socket.id) return;

      setConferenceParticipants((current) =>
        current.includes(participantId)
          ? current
          : [...current, participantId]
      );
    };

    const handleConferenceOffer = async ({
      senderId,
      roomId,
      offer
    } = {}) => {
      if (!senderId || !offer) return;
      if (conferenceRoomId && roomId !== conferenceRoomId) return;

      try {
        const peer = await createConferencePeer(senderId, false);

        await peer.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        ensureCallSocket().emit("conference:answer", {
          targetId: senderId,
          roomId: roomId || conferenceRoomId,
          answer
        });

        setConferenceParticipants((current) =>
          current.includes(senderId)
            ? current
            : [...current, senderId]
        );
      } catch (error) {
        console.error("Conference offer handling error:", error);
      }
    };

    const handleConferenceAnswer = async ({
      senderId,
      roomId,
      answer
    } = {}) => {
      if (!senderId || !answer) return;
      if (conferenceRoomId && roomId !== conferenceRoomId) return;

      const peer = conferencePeersRef.current.get(senderId);
      if (!peer) return;

      try {
        await peer.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (error) {
        console.error("Conference answer error:", error);
      }
    };

    const handleConferenceIceCandidate = async ({
      senderId,
      roomId,
      candidate
    } = {}) => {
      if (!senderId || !candidate) return;
      if (conferenceRoomId && roomId !== conferenceRoomId) return;

      const peer = conferencePeersRef.current.get(senderId);
      if (!peer) return;

      try {
        await peer.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error(
          "Conference ICE candidate error:",
          error
        );
      }
    };

    const handleConferenceParticipantLeft = ({
      participantId
    } = {}) => {
      if (participantId) {
        closeConferencePeer(participantId);
      }
    };

    const handleConferenceEnded = () => {
      leaveConferenceRoom();
    };

    const handleConferenceError = ({ message } = {}) => {
      setConferenceError(
        message || "Conference room error."
      );
    };

    socket.on("conference:created", handleConferenceCreated);
    socket.on("conference:joined", handleConferenceJoined);
    socket.on(
      "conference:participant-joined",
      handleConferenceParticipantJoined
    );
    socket.on("conference:offer", handleConferenceOffer);
    socket.on("conference:answer", handleConferenceAnswer);
    socket.on(
      "conference:ice-candidate",
      handleConferenceIceCandidate
    );
    socket.on(
      "conference:participant-left",
      handleConferenceParticipantLeft
    );
    socket.on("conference:ended", handleConferenceEnded);
    socket.on("conference:error", handleConferenceError);

    return () => {
      socket.off("conference:created", handleConferenceCreated);
      socket.off("conference:joined", handleConferenceJoined);
      socket.off(
        "conference:participant-joined",
        handleConferenceParticipantJoined
      );
      socket.off("conference:offer", handleConferenceOffer);
      socket.off("conference:answer", handleConferenceAnswer);
      socket.off(
        "conference:ice-candidate",
        handleConferenceIceCandidate
      );
      socket.off(
        "conference:participant-left",
        handleConferenceParticipantLeft
      );
      socket.off("conference:ended", handleConferenceEnded);
      socket.off("conference:error", handleConferenceError);
    };
  }, []);

  async function acceptIncomingCall() {
    try {
      const callerId = activePeerIdRef.current;
      const offer = pendingOfferRef.current;

      if (!callerId || !offer) return;

      const type = incomingCallType || "audio";

      const constraints =
        type === "video"
          ? {
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30, max: 30 },
                facingMode
              },
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            }
          : {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
              }
            };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      streamRef.current = stream;

      const peer = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = peer;

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      peer.ontrack = async (event) => {
        const remoteStream =
          event.streams?.[0] ||
          new MediaStream([event.track]);

        remoteStreamRef.current = remoteStream;

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          remoteVideoRef.current.muted = false;
          remoteVideoRef.current.volume = 1;
          await remoteVideoRef.current.play().catch(() => {});
        }

        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1;
          await remoteAudioRef.current.play().catch((error) => {
            console.warn("Remote audio autoplay blocked:", error);
          });
        }

        setRemoteConnected(true);
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit("call:ice-candidate", {
            targetId: callerId,
            candidate: event.candidate
          });
        }
      };

      await peer.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socketRef.current?.emit("call:answer", {
        targetId: callerId,
        answer
      });

      // Stop the caller tune once the call has been answered.
      stopCallerTune();

      setCallType(type);
      setCallOpen(true);
      setIncomingCall(false);

      if (videoRef.current && type === "video") {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
    } catch (error) {
      console.error("Accept call failed:", error);
      setCallError(
        error?.message || "Unable to accept the call."
      );
      setIncomingCall(false);
    }
  }

  function rejectIncomingCall() {
    const targetId = activePeerIdRef.current;

    if (targetId) {
      socketRef.current?.emit("call:end", {
        targetId
      });
    }

    setIncomingCall(false);
    pendingOfferRef.current = null;
    activePeerIdRef.current = null;
  }

  function cleanupCall(notifyPeer = true) {
    stopCallerTune();
    const targetId = activePeerIdRef.current;

    if (notifyPeer && targetId) {
      socketRef.current?.emit("call:end", {
        targetId
      });
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {}
      peerConnectionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    activePeerIdRef.current = null;
    pendingOfferRef.current = null;

    setCallOpen(false);
    setCallType(null);
    setIncomingCall(false);
    setRemoteConnected(false);
    setMicOn(true);
    setCameraOn(true);
  }

  function endCall() {
    cleanupCall(true);
  }

  function toggleMic() {
    if (!streamRef.current) return;

    const tracks = streamRef.current.getAudioTracks();

    tracks.forEach((track) => {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    });
  }

  function toggleCamera() {
    if (!streamRef.current || callType !== "video") return;

    const tracks = streamRef.current.getVideoTracks();

    tracks.forEach((track) => {
      track.enabled = !track.enabled;
      setCameraOn(track.enabled);
    });
  }

  async function switchCamera() {
    if (callType !== "video" || !streamRef.current) return;

    const nextFacingMode =
      facingMode === "user" ? "environment" : "user";

    try {
      const newStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
            facingMode: { ideal: nextFacingMode }
          },
          audio: false
        });

      const newVideoTrack = newStream.getVideoTracks()[0];
      const oldVideoTrack = streamRef.current.getVideoTracks()[0];

      const sender = peerConnectionRef.current
        ?.getSenders()
        .find((item) => item.track?.kind === "video");

      if (sender && newVideoTrack) {
        await sender.replaceTrack(newVideoTrack);
      }

      if (oldVideoTrack) {
        oldVideoTrack.stop();
      }

      const audioTracks = streamRef.current.getAudioTracks();

      streamRef.current = new MediaStream([
        ...audioTracks,
        newVideoTrack
      ]);

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      setFacingMode(nextFacingMode);
      setCameraOn(true);
    } catch (error) {
      console.error("Camera switch failed:", error);
      setCallError("Unable to switch camera.");
    }
  }

  const filteredNews = newsItems.filter((item) => {
    const matchesCategory =
      newsCategory === "all" || item.category === newsCategory;

    const search = newsSearch.trim().toLowerCase();

    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search) ||
      item.text.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search);

    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    loadUploadedVideos();
  }, []);

  useEffect(() => {
    async function loadShorts() {
      try {
        const response = await fetch("/api/shorts");
        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Could not load Shorts.");
        }

          const seenShorts = new Set();

          const savedShorts = data.shorts
            .filter((short) => {
              const duplicateKey =
                short.original_name ||
                short.title ||
                short.videoUrl;

              if (seenShorts.has(duplicateKey)) {
                return false;
              }

              seenShorts.add(duplicateKey);
              return true;
            })
            .map((short) => {
              const rawTitle =
                short.title ||
                short.original_name ||
                "AP-STREAM Short";

              let cleanTitle = rawTitle
                .replace(/\.mp4$/i, "")
                .replace(/[_-]+/g, " ")
                .replace(/\s+/g, " ")
                .trim();

              if (
                /^[a-f0-9]{20,}\s*[0-9]{8,}$/i.test(cleanTitle) ||
                /^[a-f0-9]{20,}$/i.test(cleanTitle)
              ) {
                cleanTitle = "AP-STREAM Short";
              }

              return {
                id: short.id,
                title: cleanTitle || "AP-STREAM Short",
                creator: short.creator || "@you",
                video: short.videoUrl,
                likes: 0,
                comments: 0,
              };
            });

          setShorts(savedShorts);
        setActiveShort(0);
      } catch (error) {
        console.error("Could not load Shorts:", error);
      }
    }

    loadShorts();
  }, []);

  const goToSection = (id) => {
    setActiveStudio(null);
    setMusicOpen(false);
    setActiveSection("home");

    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 50);
  };

  return (
    <div className="app">
      <header>
        <div className="logo ap-brand">
          <img src="/apstream-logo.png" alt="AP-STREAM" className="ap-logo" />
          <span className="ap-brand-name">AP-STREAM</span>
          {authUser && (
            <span className="account-indicator">
              🟢 {authUser.username}
            </span>
          )}
        </div>

                        <nav className="ap-main-nav">
          <button type="button" onClick={() => {
            setActiveStudio(null);
            setMusicOpen(false);
            setActiveSection("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}>🏠 Home</button>

          <button type="button" onClick={() => {
            setActiveStudio(null);
            setMusicOpen(false);
            setActiveSection("social");
            goToSection("social");
          }}>👥 Social</button>

          <button type="button" onClick={() => {
            setActiveStudio(null);
            setMusicOpen(true);
            goToSection("music");
          }}>🎵 Music</button>

          <button
            type="button"
            onClick={() => {
              setMusicOpen(false);
              setActiveFeature(null);
              setActiveStudio("music");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            🎹 Music Studio
          </button>

          <button type="button" onClick={() => { setActiveStudio(null); setActiveFeature(null); setMusicOpen((open) => !open); }}>
            📱 Shorts
          </button>

          <button type="button" onClick={() => goToSection("maps")}>
            🗺️ Maps
          </button>

          <button type="button" onClick={() => goToSection("videos")}>
            🎬 Videos
          </button>

          <button type="button" onClick={() => { setActiveStudio(null); setActiveFeature(null); setMusicOpen(false); setActiveSection("social"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            🎤 Artists
          </button>

          <button type="button" onClick={() => { setActiveStudio(null); setActiveFeature(null); setMusicOpen(false); setActiveSection("social"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            ⭐ Creators
          </button>

          <button type="button" onClick={() => { setActiveStudio(null); setMusicOpen(false); setActiveFeature("search"); setMoreMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            🔎 Search
          </button>

          <button type="button" className="header-call-button" onClick={() => {
            setActiveStudio(null);
            setMusicOpen(false);
            setActiveFeature(null);
            setMoreMenuOpen(false);
            window.scrollTo({ top: 0, behavior: "smooth" });
            setTimeout(() => {
              document.getElementById("calls")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 50);
          }}>
            ☎️ Calls
          </button>

          <button
            type="button"
            className="header-more-button"
            aria-expanded={moreMenuOpen}
            onClick={() => setMoreMenuOpen((open) => !open)}
          >
            ☰ More
          </button>

          {moreMenuOpen && (
            <div className="apstream-more-menu">

              <div className="more-menu-group">
                <strong>CREATE</strong>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveStudio("music");
                  setMusicOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>🎹 Music Studio</button>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveStudio("recording");
                  setMusicOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>🎙️ Studio</button>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveStudio("ai");
                  setMusicOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>🤖 AI</button>
              </div>

              <div className="more-menu-group">
                <strong>WATCH & LISTEN</strong>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveFeature(null);
                  setMusicOpen((open) => !open);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>📱 Shorts</button>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  goToSection("videos");
                }}>🎬 Videos</button>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  goToSection("maps");
                }}>🗺️ Maps</button>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveFeature("news");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>📰 News</button>
              </div>

              <div className="more-menu-group">
                <strong>PEOPLE</strong>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveSection("social");
                  setActiveStudio(null);
                  setActiveFeature(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>🎤 Artists</button>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveSection("social");
                  setActiveStudio(null);
                  setActiveFeature(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>⭐ Creators</button>
              </div>

              <div className="more-menu-group">
                <strong>SERVICES</strong>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveFeature("boda");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>🛵 Boda</button>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveFeature("apps");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>📱 Apps</button>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveFeature("mail");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>✉️ Mail</button>
              </div>

              <div className="more-menu-group">
                <strong>MANAGEMENT</strong>

                <button type="button" onClick={() => {
                  setMoreMenuOpen(false);
                  setActiveFeature("admin");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}>🛠️ Admin</button>
              </div>

            </div>
          )}
        </nav>
      </header>

      <main>
        {activeFeature === null && (
          <div className="apstream-media-home">
            <section className="apstream-home-shorts">
              <div className="media-heading">
                <h2>▶ SHORTS</h2>
              </div>
            </section>

            <section className="apstream-home-videos">
              <div className="media-heading">
                <h2>🎬 VIDEOS</h2>
              </div>
            </section>
          </div>
        )}


        {activeFeature === "boda" && (
          <section id="boda" className="feature-view">
            <BodaRide />
            <BodaRiderRegistration />
          </section>
        )}

        {activeFeature === "admin" && (
          <section id="admin" className="feature-view">
            <AdminDashboard />
          </section>
        )}

        {activeFeature === "mail" && (
          <section id="mail" className="feature-view apstream-mail">
            <div className="media-heading">
              <h2>✉️ AP-STREAM Mail</h2>
              <p className="section-subtitle">
                Your AP-STREAM mailbox, connected to your AP-STREAM account.
              </p>
            </div>

            <div className="mail-layout">
              <aside className="mail-sidebar">
                <button
                  type="button"
                  className="mail-compose-button"
                  onClick={() => {
                    setMailComposeOpen(true);
                    setMailFolder("inbox");
                    setMailError("");
                  }}
                >
                  ✏️ Compose
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMailFolder("inbox");
                    setMailComposeOpen(false);
                    loadMail("inbox");
                  }}
                >
                  📥 Inbox
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMailFolder("sent");
                    setMailComposeOpen(false);
                    loadMail("sent");
                  }}
                >
                  📤 Sent
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMailFolder("drafts");
                    setMailComposeOpen(false);
                    loadMail("drafts");
                  }}
                >
                  📝 Drafts
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMailFolder("trash");
                    setMailComposeOpen(false);
                    loadMail("trash");
                  }}
                >
                  🗑️ Trash
                </button>
              </aside>

              <div className="mail-main">
                {mailComposeOpen ? (
                  <div className="mail-compose">
                    <div className="mail-toolbar">
                      <h3>✏️ Compose Mail</h3>
                      <button
                        type="button"
                        onClick={() => setMailComposeOpen(false)}
                      >
                        ✕
                      </button>
                    </div>

                    <input
                      type="text"
                      value={mailTo}
                      onChange={(event) => setMailTo(event.target.value)}
                      placeholder="To username or email"
                      aria-label="Recipient"
                    />

                    <input
                      type="text"
                      value={mailSubject}
                      onChange={(event) => setMailSubject(event.target.value)}
                      placeholder="Subject"
                      aria-label="Subject"
                    />

                    <textarea
                      value={mailBody}
                      onChange={(event) => setMailBody(event.target.value)}
                      placeholder="Write your message..."
                      aria-label="Message"
                      rows={10}
                    />

                    {mailError && (
                      <p className="mail-error">{mailError}</p>
                    )}

                    <div className="mail-compose-actions">
                      <button
                        type="button"
                        onClick={saveMailDraft}
                        disabled={mailSaving}
                      >
                        💾 Save Draft
                      </button>

                      <button
                        type="button"
                        onClick={sendMail}
                        disabled={mailSending}
                      >
                        {mailSending ? "Sending..." : "📤 Send"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mail-toolbar">
                      <input
                        type="search"
                        value={mailSearch}
                        onChange={(event) => setMailSearch(event.target.value)}
                        placeholder="Search mail..."
                        aria-label="Search mail"
                      />

                      <button
                        type="button"
                        onClick={() => loadMail(mailFolder)}
                        disabled={mailLoading}
                      >
                        {mailLoading ? "Loading..." : "↻ Refresh"}
                      </button>
                    </div>

                    {mailError && (
                      <p className="mail-error">{mailError}</p>
                    )}

                    {mailSelected ? (
                      <article className="mail-message-view">
                        <button
                          type="button"
                          onClick={() => setMailSelected(null)}
                        >
                          ← Back
                        </button>

                        <h3>{mailSelected.subject || "(No subject)"}</h3>

                        <p className="mail-meta">
                          From: {mailSelected.sender_username || mailSelected.sender_email || "Unknown"}
                        </p>

                        <p className="mail-meta">
                          To: {mailSelected.recipient_username || mailSelected.recipient_email || "Unknown"}
                        </p>

                        <div className="mail-message-body">
                          {mailSelected.body}
                        </div>
                      </article>
                    ) : (
                      <div className="mail-list">
                        {mailFiltered.length ? (
                          mailFiltered.map((message) => (
                            <button
                              type="button"
                              className={`mail-row ${message.is_read ? "" : "unread"}`}
                              key={message.id}
                              onClick={() => openMail(message)}
                            >
                              <span className="mail-row-star">
                                {message.is_starred ? "⭐" : "☆"}
                              </span>

                              <span className="mail-row-content">
                                <strong>
                                  {mailFolder === "sent"
                                    ? (message.recipient_username || message.recipient_email || "Recipient")
                                    : (message.sender_username || message.sender_email || "Sender")}
                                </strong>

                                <span>
                                  {message.subject || "(No subject)"}
                                </span>

                                <small>
                                  {message.body || ""}
                                </small>
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="mail-empty">
                            <div className="mail-empty-icon">✉️</div>
                            <h3>
                              {mailLoading
                                ? "Loading mailbox..."
                                : `No messages in ${mailFolder}.`}
                            </h3>
                            <p>
                              {mailLoading
                                ? "Please wait while AP-STREAM Mail loads your messages."
                                : "Your AP-STREAM mailbox is ready for messages."}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {activeFeature === "news" && (
          <section id="news" className="feature-view">
            <div className="media-heading">
              <h2>📰 AP-STREAM News</h2>
              <p className="section-subtitle">
                Uganda, Africa, world and entertainment news.
              </p>
            </div>

            <div className="news-controls">
              <input
                type="search"
                value={newsSearch}
                onChange={(event) => setNewsSearch(event.target.value)}
                placeholder="Search news..."
              />

              <select
                value={newsCategory}
                onChange={(event) => setNewsCategory(event.target.value)}
              >
                <option value="all">All News</option>
                <option value="uganda">Uganda</option>
                <option value="africa">Africa</option>
                <option value="world">World</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>

            <div className="news-list">
              {filteredNews.length ? (
                filteredNews.map((item) => (
                  <article className="news-item" key={item.id}>
                    <span>{item.label}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        Read more →
                      </a>
                    )}
                  </article>
                ))
              ) : (
                <p>No news found.</p>
              )}
            </div>
          </section>
        )}

        {activeFeature === "search" && (
          <section id="search" className="feature-view apstream-google-search">

            {(() => {
              const query = newsSearch.trim();
              const q = query.toLowerCase();

              const searchCatalog = [
                ...(Array.isArray(musicTracks) ? musicTracks.map(x => ({
                  type:"Music",
                  title:x.title || x.name || "",
                  text:x.artist || x.description || "",
                  icon:"🎵"
                })) : []),
                ...(Array.isArray(newsItems) ? newsItems.map(x => ({
                  type:"News",
                  title:x.title || "",
                  text:x.text || x.description || "",
                  icon:"📰"
                })) : []),
                "Afrobeats","Ugandan Music","African Music","New Music",
                "Artists","Creators","Shorts","Videos","TV","Radio",
                "News","Live Music","Trending","Uganda","Africa"
              ];

              const suggestions = q
                ? [...new Set(
                    searchCatalog
                      .map(x => typeof x === "string" ? x : x.title)
                      .filter(Boolean)
                      .filter(x => String(x).toLowerCase().includes(q))
                  )].slice(0,8)
                : [];

              const filters = [
                ["all","🌐 All"],
                ["music","🎵 Music"],
                ["artists","🎤 Artists"],
                ["shorts","📱 Shorts"],
                ["videos","🎬 Videos"],
                ["tv","📺 TV"],
                ["radio","📻 Radio"],
                ["news","📰 News"]
              ];

              const operatorHelp = [
                ["type:music","Music only"],
                ["type:video","Videos only"],
                ["type:news","News only"],
                ["live","Live content"],
                ["artist:","Specific artist"]
              ];

              const cleanQuery = q
                .replace(/type:(music|video|news)/gi,"")
                .replace(/artist:[^\s]+/gi,"")
                .trim();

              const directMatch =
                cleanQuery === "music" ? "AP-STREAM Music" :
                cleanQuery === "radio" ? "AP-STREAM Radio" :
                cleanQuery === "tv" ? "AP-STREAM TV" :
                cleanQuery === "shorts" ? "AP-STREAM Shorts" :
                cleanQuery === "videos" || cleanQuery === "video" ? "AP-STREAM Videos" :
                cleanQuery === "news" ? "AP-STREAM News" :
                cleanQuery === "artists" || cleanQuery === "artist" ? "AP-STREAM Artists" :
                null;

              const firstResult = globalSearchResults.find(result =>
                globalSearchType === "all" ||
                result.type?.toLowerCase() === globalSearchType
              );

              return (
                <>
                  <div className="ap-search-hero phase1-search-hero">

                    <div className="ap-search-logo">
                      <span>AP</span><strong>-STREAM</strong>
                    </div>

                    <h2>Search AP-STREAM</h2>

                    <p>
                      Discover music, artists, creators, videos, Shorts, TV, radio and news.
                    </p>

                    <div className="ap-global-search-box phase1-search-box">
                      <span className="ap-search-icon">🔎</span>

                      <input
                        type="search"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const value = e.currentTarget.value.trim();
                            if (value) {
                              setNewsSearch(value);
                              setGlobalSearchType("all");
                              setActiveFeature("search");
                            }
                          }
                        }}
                        value={newsSearch}
                        onChange={(event) => setNewsSearch(event.target.value)}
                        placeholder="Search AP-STREAM..."
                        autoFocus
                        autoComplete="off"
                      />

                      {newsSearch && (
                        <button
                          type="button"
                          className="ap-search-clear"
                          onClick={() => setNewsSearch("")}
                        >
                          ×
                        </button>
                      )}

                      <button
                        type="button"
                        className="phase1-voice-button"
                        title="Voice search"
                        onClick={() => {
                          const Recognition =
                            window.SpeechRecognition ||
                            window.webkitSpeechRecognition;

                          if (!Recognition) {
                            alert("Voice search is not available in this browser.");
                            return;
                          }

                          const recognition = new Recognition();
                          recognition.lang = "en-US";
                          recognition.onresult = e => {
                            setNewsSearch(e.results[0][0].transcript);
                          };
                          recognition.start();
                        }}
                      >
                        🎙️
                      </button>
                    </div>

                    {suggestions.length > 0 && (
                      <div className="phase1-autocomplete">
                        {suggestions.map((suggestion,index) => (
                          <button
                            key={suggestion + index}
                            type="button"
                            onClick={() => setNewsSearch(suggestion)}
                          >
                            <span>🔎</span>
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="ap-search-types phase1-filters">
                      {filters.map(([value,label]) => (
                        <button
                          key={value}
                          type="button"
                          className={globalSearchType === value ? "active" : ""}
                          onClick={() => setGlobalSearchType(value)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!query ? (
                    <div className="phase1-search-home">

                      <div className="phase2-personal">

                        {apSearchHistory.length > 0 && (
                          <div className="phase2-section">
                            <div className="phase2-heading">
                              <strong>🕘 Recent searches</strong>
                              <button
                                type="button"
                                onClick={() => {
                                  localStorage.removeItem("apstream_search_history");
                                  setApSearchHistory([]);
                                }}
                              >
                                Clear
                              </button>
                            </div>

                            <div className="phase2-pills">
                              {apSearchHistory.slice(0,6).map((term,index) => (
                                <button
                                  type="button"
                                  key={term + index}
                                  onClick={() => {
                                    setNewsSearch(term);
                                    setGlobalSearchType("all");
                                  }}
                                >
                                  🕘 {term}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="phase2-section">
                          <div className="phase2-heading">
                            <strong>🔥 Popular on AP-STREAM</strong>
                          </div>

                          <div className="phase2-pills">
                            {[
                              "Ugandan Music",
                              "Afrobeats",
                              "New Music",
                              "Ugandan Artists",
                              "African Music",
                              "Live Radio",
                              "Live TV",
                              "Shorts"
                            ].map(term => (
                              <button
                                type="button"
                                key={term}
                                onClick={() => {
                                  setNewsSearch(term);
                                  setGlobalSearchType("all");
                                }}
                              >
                                {term}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="phase2-local-discovery">
                          <div>
                            <span>🌍</span>
                            <div>
                              <strong>Explore Uganda & Africa</strong>
                              <small>
                                Discover local artists, music, news, TV and radio.
                              </small>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setNewsSearch("Uganda");
                              setGlobalSearchType("all");
                            }}
                          >
                            Explore →
                          </button>
                        </div>

                      </div>


                      <div className="phase1-discovery-grid">
                        {[
                          ["🎵","Music","Find songs and artists","music"],
                          ["🎬","Videos","Watch videos","videos"],
                          ["📱","Shorts","Discover short videos","shorts"],
                          ["📺","TV","Explore TV stations","tv"],
                          ["📻","Radio","Listen to radio","radio"],
                          ["📰","News","Read the latest news","news"]
                        ].map(([icon,title,text,type]) => (
                          <button
                            type="button"
                            className="phase1-discovery-card"
                            key={type}
                            onClick={() => {
                              setGlobalSearchType(type);
                              setNewsSearch(title);
                            }}
                          >
                            <span>{icon}</span>
                            <strong>{title}</strong>
                            <small>{text}</small>
                          </button>
                        ))}
                      </div>

                      <div className="phase1-operators">
                        <strong>🛠️ Advanced search</strong>
                        <p>Use operators to narrow your search.</p>

                        <div>
                          {operatorHelp.map(([op,label]) => (
                            <button
                              type="button"
                              key={op}
                              onClick={() => setNewsSearch(op + " ")}
                            >
                              <code>{op}</code>
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="ap-search-results phase1-results">

                      <div className="ap-search-results-header">
                        <strong>
                          {globalSearchResults.length} results
                        </strong>
                        <span>for “{query}”</span>
                      </div>

                      {directMatch && (
                        <div className="phase1-direct-answer">
                          <span>⚡ Direct result</span>
                          <strong>{directMatch}</strong>
                          <p>
                            Explore {directMatch.replace("AP-STREAM ","")} content on AP-STREAM.
                          </p>
                        </div>
                      )}

                      {firstResult && (
                        <div className="phase1-knowledge-panel">
                          <div className="phase1-knowledge-title">
                            <span>⭐</span>
                            <div>
                              <strong>About this result</strong>
                              <small>{firstResult.type}</small>
                            </div>
                          </div>

                          <h3>{firstResult.title}</h3>

                          {firstResult.text && (
                            <p>{firstResult.text}</p>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (firstResult.url) {
                                window.open(firstResult.url,"_blank");
                              }
                            }}
                          >
                            Explore result →
                          </button>
                        </div>
                      )}

                      {globalSearchResults.length ? (
                        globalSearchResults
                          .filter(result =>
                            globalSearchType === "all" ||
                            result.type?.toLowerCase() === globalSearchType
                          )
                          .map(result => (
                            <article
                              className="ap-search-result phase1-result"
                              key={result.id}
                            >
                              <div className="ap-search-result-icon">
                                {result.icon || "🔎"}
                              </div>

                              <div className="ap-search-result-body">
                                <span className="ap-search-result-type">
                                  {result.type}
                                </span>

                                <h3>{result.title}</h3>

                                {result.text && (
                                  <p>{result.text}</p>
                                )}

                                {result.url && (
                                  <a
                                    href={result.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Open result →
                                  </a>
                                )}
                              </div>
                            </article>
                          ))
                      ) : (
                        <div className="ap-search-empty">
                          <div>🔎</div>
                          <h3>No results found</h3>
                          <p>
                            Try another search or use one of the advanced filters.
                          </p>
                        </div>
                      )}

                      <div className="phase2-because">
                        <strong>🧠 Because you searched for “{query}”</strong>

                        <div>
                          {[
                            `${query} music`,
                            `${query} artists`,
                            `${query} videos`
                          ].map(term => (
                            <button
                              type="button"
                              key={term}
                              onClick={() => setNewsSearch(term)}
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="phase1-related">
                        <strong>🔎 Related searches</strong>

                        <div>
                          {[
                            `${query} music`,
                            `${query} videos`,
                            `${query} artists`,
                            `${query} news`,
                            `${query} live`
                          ].map(term => (
                            <button
                              type="button"
                              key={term}
                              onClick={() => setNewsSearch(term)}
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </>
              );
            })()}

          </section>
        )}

        {!activeStudio && <Home />}

        {activeStudio === "ai" && (
          <section id="ai-studio" className="studio-view">
            <AIStudio />
          </section>
        )}

        {activeStudio === "recording" && (
          <section id="recording-studio" className="studio-view">
            <RecordingStudio />
          </section>
        )}

        {activeStudio === "music" && (
          <section id="music-studio" className="studio-view">
            <APStreamMusicStudio />
          </section>
        )}

        {activeFeature === "apps" && (
          <section className="ap-apps-store">
            <div className="ap-apps-header">
              <div>
                <h2>📱 AP-STREAM Apps</h2>
                <p>Discover apps, tools and services from AP-STREAM developers.</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveFeature(null);
                  setAppsSearch("");
                }}
              >
                ✕ Close
              </button>
            </div>

            <div className="ap-apps-search">
              <input
                type="search"
                value={appsSearch}
                onChange={(e) => setAppsSearch(e.target.value)}
                placeholder="🔎 Search apps..."
                aria-label="Search AP-STREAM Apps"
              />
            </div>

            <div className="ap-apps-categories">
              {[
                "All",
                "Social",
                "Music",
                "Video",
                "AI",
                "Business",
                "Education",
                "Tools",
                "Games"
              ].map((category) => (
                <button key={category} type="button">
                  {category}
                </button>
              ))}
            </div>

            <div className="ap-apps-featured">
              <h3>⭐ Featured</h3>

              <div className="ap-apps-grid">
                {[
                  {
                    icon: "🎵",
                    name: "AP-STREAM Music",
                    developer: "AP-STREAM",
                    description: "Listen, discover and share music."
                  },
                  {
                    icon: "🎬",
                    name: "AP-STREAM Video",
                    developer: "AP-STREAM",
                    description: "Watch and share videos with creators."
                  },
                  {
                    icon: "🤖",
                    name: "AP-STREAM AI",
                    developer: "AP-STREAM",
                    description: "AI tools powered by the AP-STREAM platform."
                  },
                  {
                    icon: "🛠️",
                    name: "Developer Console",
                    developer: "AP-STREAM",
                    description: "Build and manage applications for AP-STREAM."
                  }
                ]
                  .filter((app) => {
                    const q = appsSearch.trim().toLowerCase();
                    if (!q) return true;
                    return `${app.name} ${app.developer} ${app.description}`
                      .toLowerCase()
                      .includes(q);
                  })
                  .map((app) => (
                    <article className="ap-app-card" key={app.name}>
                      <div className="ap-app-icon">{app.icon}</div>

                      <div className="ap-app-info">
                        <h4>{app.name}</h4>
                        <span>by {app.developer}</span>
                        <p>{app.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          addNotification(
                            "📱",
                            "AP-STREAM Apps",
                            `${app.name} selected.`
                          );
                        }}
                      >
                        Get App
                      </button>
                    </article>
                  ))}
              </div>
            </div>

            <div className="ap-apps-developer">
              <div>
                <h3>👨‍💻 Publish your app</h3>
                <p>
                  Developers will be able to submit Android, web and desktop
                  applications to the AP-STREAM App Store.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  addNotification(
                    "👨‍💻",
                    "Developer Center",
                    "AP-STREAM developer publishing is coming next."
                  );
                }}
              >
                Developer Center
              </button>
            </div>
          </section>
        )}

        {activeSection === "social" && (
        <section id="social" className="social-hub">
          <div className="social-hub-header">
            <p className="eyebrow">AP STREAM SOCIAL</p>
            <h2>🌍 Social Hub</h2>
          </div>

          <div className="social-menu">
            <a href="#shorts">📱 Shorts / Reels</a>
              <a href="#community">👥 Friends</a>
            <a href="#community">🤝 Connections</a>
            <a href="#community">🎨 Artists</a>
            <a href="#community">⭐ Creators</a>
            <a href="#messages">💬 Chats</a>
            <a href="#calls">📞 Calls</a>
            <a href="#notifications">🔔 Notifications</a>
            <a href="#people">👥 People</a>
            <a href="#community">🌍 Community</a>
          </div>
        </section>
        )}

        {/* CALLS */}
        {true && (
        <section id="calls" className="calls-section">
          <h2>📞 AP-STREAM Calls</h2>
          <p className="section-subtitle">
            High-quality audio and video calling
          </p>

          <div className="call-options">
            <button
              className="call-button"
              onClick={() => startCall("audio")}
            >
              📞 Audio Call
            </button>

            <button
              className="call-button video-call-button"
              onClick={() => startCall("video")}
            >
              📹 HD Video Call
            </button>
          </div>

          {callError && <p className="call-error">{callError}</p>}

          <div className="call-info">
            <h3>🎥 HD Camera</h3>
            <p>
              AP-STREAM requests up to 1080p video when your device supports it.
            </p>
            <p>🎙️ Noise suppression • 📷 HD video • 🔄 Camera switching</p>
          </div>

          {/* CONFERENCE ROOMS */}
          <div className="calls-feature-card">
            <h3>👥 Conference Rooms</h3>
            <p>Start or join a group audio/video room.</p>

            <div className="call-options">
              <button
                className="call-button"
                type="button"
                onClick={async () => {
                  const roomId =
                    "AP-" +
                    Math.random().toString(36).slice(2, 8).toUpperCase();

                  await openConferenceRoom(
                    roomId,
                    "AP-STREAM Conference"
                  );

                  window.prompt(
                    "Conference room created. Share this room ID:",
                    roomId
                  );
                }}
              >
                ➕ Create Room
              </button>

              <button
                className="call-button"
                type="button"
                onClick={async () => {
                  const roomId = window.prompt(
                    "Enter conference room ID:"
                  );

                  if (roomId?.trim()) {
                    await joinConferenceRoom(roomId.trim());
                  }
                }}
              >
                🚪 Join Room
              </button>
            </div>
          </div>

          {/* AP-STREAM LIVE */}
          <div className="calls-feature-card">
            <h3>🔴 AP-STREAM Live</h3>
            <p>
              Go live, watch live broadcasts, chat, react, and send
              in-app virtual gifts.
            </p>

            <div className="call-options">
              <button
                className="call-button"
                type="button"
                onClick={() => {
                  window.alert(
                    "AP-STREAM Live is ready for broadcast setup."
                  );
                }}
              >
                🔴 Go Live
              </button>

              <button
                className="call-button"
                type="button"
                onClick={() => {
                  window.alert(
                    "Live discovery will show active AP-STREAM broadcasts here."
                  );
                }}
              >
                👀 Watch Live
              </button>
            </div>

            <div
              className="live-tools"
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginTop: "10px"
              }}
            >
              <span>💬 Live Chat</span>
              <span>❤️ Reactions</span>
              <span>🎁 Virtual Gifts</span>
              <span>⭐ Host Points</span>
              <span>🛡️ Moderation</span>
            </div>
          </div>
        </section>
        )}

        {/* SHORTS / REELS */}
        {activeFeature === null && (
        <section id="shorts" className="shorts-section">
          <div className="shorts-heading">
            <h2>📱 AP-STREAM Shorts / Reels</h2>
            <p>Quick videos from AP-STREAM creators.</p>
          </div>

          <div className="shorts-feed">
            {shorts.map((short, index) => (
              <article
                className={`short-card ${activeShort === index ? "active" : ""}`}
                key={short.id}
                onClick={() => setActiveShort(index)}
              >
                <div className="short-video-placeholder">
                  {short.video ? (
                    <video
                      src={
                        short.video?.startsWith("http")
                          ? short.video
                          : short.video || ""
                      }
                      controls
                      playsInline
                      webkit-playsinline="true"
                      loop
                      preload="auto"
                      muted={false}
                      onError={(event) => {
                        console.error("AP-STREAM Short playback error:", {
                          src: event.currentTarget.currentSrc,
                          error: event.currentTarget.error,
                        });
                      }}
                      controlsList="nodownload"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onTouchStart={(event) => event.stopPropagation()}
                      onDoubleClick={(event) => {
                        event.stopPropagation();
                        const video = event.currentTarget;

                        if (document.fullscreenElement) {
                          document.exitFullscreen?.();
                        } else if (video.requestFullscreen) {
                          video.requestFullscreen();
                        } else if (video.webkitEnterFullscreen) {
                          video.webkitEnterFullscreen();
                        }
                      }}
                      onError={(event) => {
                        console.error(
                          "AP-STREAM Short playback error:",
                          event.currentTarget.error,
                          "URL:",
                          event.currentTarget.currentSrc
                        );
                      }}
                    />
                  ) : (
                    <>
                      <span>▶️</span>
                      <strong>Short video</strong>
                      <small>Upload a video to start watching.</small>
                    </>
                  )}
                </div>

                <div className="short-info">
                  <h3>{short.title}</h3>
                  <p>{short.creator}</p>

                  <div className="short-actions">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          const wasLiked = !!likedShorts[short.id];

                          setLikedShorts((current) => ({
                            ...current,
                            [short.id]: !wasLiked,
                          }));

                          setShortLikeCounts((current) => ({
                            ...current,
                            [short.id]: Math.max(
                              0,
                              (current[short.id] ?? short.likes ?? 0) +
                                (wasLiked ? -1 : 1)
                            ),
                          }));
                        }}
                      >
                        {likedShorts[short.id] ? "❤️ Liked" : "🤍 Like"}{" "}
                        {shortLikeCounts[short.id] ?? short.likes ?? 0}
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSubscribedCreators((current) => ({
                            ...current,
                            [short.creator]: !current[short.creator],
                          }));
                        }}
                      >
                        {subscribedCreators[short.creator]
                          ? "🔔 Subscribed"
                          : "🔔 Subscribe"}
                      </button>

                    <button
                      onClick={(event) => event.stopPropagation()}
                    >
                      💬 {short.comments}
                    </button>

                    <button
                      onClick={async (event) => {
                        event.stopPropagation();

                        if (navigator.share) {
                          await navigator.share({
                            title: short.title,
                            text: `Watch ${short.title} on AP-STREAM`,
                          });
                        } else {
                          await navigator.clipboard?.writeText(
                            `${short.title} — ${short.creator}`
                          );
                        }
                      }}
                    >
                      🔗 Share
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        const card = event.currentTarget.closest(".short-card");
                        const video = card?.querySelector("video");

                        if (video) {
                          if (document.fullscreenElement) {
                            document.exitFullscreen?.();
                          } else if (video.requestFullscreen) {
                            video.requestFullscreen();
                          } else if (video.webkitEnterFullscreen) {
                            video.webkitEnterFullscreen();
                          }
                        }
                      }}
                    >
                      ⛶ Fullscreen
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="shorts-navigation">
            <button
              disabled={activeShort === 0}
              onClick={() =>
                setActiveShort((current) => Math.max(0, current - 1))
              }
            >
              ⬆️ Previous
            </button>

            <span>
              Short {activeShort + 1} / {shorts.length}
            </span>

            <button
              disabled={activeShort === shorts.length - 1}
              onClick={() =>
                setActiveShort((current) =>
                  Math.min(shorts.length - 1, current + 1)
                )
              }
            >
              ⬇️ Next
            </button>
          </div>

          <div className="shorts-create">
            <button
              type="button"
              onClick={() =>
                document.getElementById("apstream-short-upload")?.click()
              }
            >
              ➕ Create a Short
            </button>

            <label className="short-upload-button">
              📤 Upload Reel
              <input
                id="apstream-short-upload"
                type="file"
                accept="video/*"
                hidden
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;

                  try {
                    const formData = new FormData();
                    formData.append("video", file);
                    formData.append(
                      "title",
                      file.name.replace(/\.[^/.]+$/, "")
                    );
                    formData.append("creator", "@you");

                    const response = await fetch("/api/shorts/upload", {
                      method: "POST",
                      body: formData,
                    });

                    const data = await response.json().catch(() => ({}));

                    if (!response.ok || !data.success) {
                      throw new Error(
                        data.error || "Video upload failed."
                      );
                    }

                    const uploaded = data.short;

                      const uploadedShort = {
                        id: uploaded.id,
                        title: uploaded.title || file.name.replace(/\.[^/.]+$/, ""),
                        creator: uploaded.creator || "@you",
                        video: uploaded.videoUrl,
                        original_name: uploaded.original_name || file.name,
                        likes: 0,
                        comments: 0,
                      };

                      setShorts((current) => {
                        const nextShorts = [...current, uploadedShort];
                        setActiveShort(nextShorts.length - 1);
                        return nextShorts;
                      });

                    alert("✅ Short uploaded successfully!");
                  } catch (error) {
                    console.error("Short upload error:", error);
                    alert(`❌ ${error.message}`);
                  } finally {
                    event.target.value = "";
                  }
                }}
              />
            </label>
          </div>
        </section>
        )}

        {activeSection === "maps" && (
          <section id="maps" className="media-section ap-maps-section">
            <div className="section-header">
              <h2>🗺️ AP-STREAM Maps</h2>
              <p>Find places, businesses and services around you.</p>
            </div>

            <div className="maps-toolbar">
              <input
                type="search"
                placeholder="🔎 Search places..."
                aria-label="Search places"
              />
              <button type="button">📍 My Location</button>
              <button type="button">🧭 Directions</button>
            </div>

            <div className="ap-map-container">
              <MapContainer
                center={[0.3476, 32.5825]}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: "520px", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker position={[0.3476, 32.5825]} icon={apStreamMapIcon}>
                  <Popup>
                    <strong>AP-STREAM Maps</strong>
                    <br />
                    Kampala, Uganda
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
          </section>
        )}

        {activeFeature === null && (
        <section id="videos" className="media-section videos-vertical-section">
          <div className="media-heading">
            <h2>🎬 AP-STREAM Videos</h2>
            <p className="section-subtitle">
              Watch creators, discover new videos, and share what you enjoy.
            </p>
          </div>

          <div className="video-upload-panel">
            <input
              type="text"
              placeholder="Video title"
              value={videoTitle}
              onChange={(event) => setVideoTitle(event.target.value)}
            />

            <label
            className="upload-video-button"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              minHeight: "44px",
              padding: "10px 16px",
              position: "relative",
              zIndex: 10
            }}
          >
            ⬆️ Upload Video
            <input
              type="file"
              accept="video/*"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer"
              }}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                try {
                  const formData = new FormData();
                  formData.append("video", file);
                  formData.append(
                    "title",
                    videoTitle.trim() ||
                      file.name.replace(/\.[^/.]+$/, "")
                  );

                  const response = await fetch("/api/videos/upload", {
                    method: "POST",
                    body: formData
                  });

                  const data = await response.json().catch(() => ({}));

                  if (!response.ok || !data.video) {
                    throw new Error(
                      data.message || "Could not upload video."
                    );
                  }

                  const uploaded = data.video;

                  const video = {
                    id: uploaded.id,
                    title: uploaded.title || file.name,
                    url: uploaded.video_url,
                    name: uploaded.title || file.name,
                    creator: "AP-STREAM Creator"
                  };

                  setUploadedVideos((current) => [
                    video,
                    ...current.filter((item) => item.id !== video.id)
                  ]);

                  setVideoTitle("");
                } catch (error) {
                  console.error(
                    "AP-STREAM video upload failed:",
                    error
                  );

                  window.alert(
                    error.message || "Could not upload video."
                  );
                } finally {
                  event.target.value = "";
                }
              }}
            />
          </label>
          </div>

          <div className="videos-youtube-feed">
            {uploadedVideos.length === 0 ? (
              <div className="videos-empty-state">
                <p>No videos yet.</p>
              </div>
            ) : (
              uploadedVideos.map((video) => (
                <article className="youtube-video-card" key={video.id}>
                  <div className="youtube-player">
                    <video
                      className="apstream-normal-video"
                      src={video.url}
                      controls
                      playsInline
                      preload="metadata"
                    />
                  </div>

                  <div className="youtube-video-info">
                    <h3>{video.title}</h3>

                    <div className="creator-row">
                      <div className="creator-avatar">AP</div>

                      <div>
                        <strong>{video.creator || "AP-STREAM Creator"}</strong>
                        <small>AP-STREAM creator</small>
                      </div>

                      <button type="button">➕ Follow</button>
                      <button type="button">🔔 Subscribe</button>
                    </div>

                    <p className="video-meta">
                      0 views • Just uploaded
                    </p>

                    <div className="video-actions">
                      <button type="button">👍 Like</button>
                      <button type="button">👎 Dislike</button>
                      <button type="button">↗️ Share</button>
                    </div>

                    <div className="video-description">
                      Welcome to AP-STREAM. Discover music, creators and videos
                      from Africa and beyond.
                    </div>

                    <div className="video-comments">
                      <strong>💬 Comments</strong>
                      <p>Comments will appear here.</p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
        )}

      </main>


      {currentAudio && audioElement && (
        <div className="music-player">
          <div>
            <strong>
              🎵 {musicTracks.find((track) => track.id === currentAudio)?.title}
            </strong>
            <small>
              {" • "}
              {musicTracks.find((track) => track.id === currentAudio)?.artist}
            </small>
          </div>

          <input
            className="music-progress"
            type="range"
            min="0"
            max={musicDuration || 0}
            value={musicProgress}
            onChange={(event) => {
              const value = Number(event.target.value);
              setMusicProgress(value);
              if (audioElement) {
                audioElement.currentTime = value;
              }
            }}
          />

          <button onClick={previousMusic}>⏮</button>

          <button
            onClick={() => {
              if (audioElement.paused) audioElement.play();
              else audioElement.pause();
              setAudioElement(audioElement);
            }}
          >
            {audioElement.paused ? "▶ Play" : "⏸ Pause"}
          </button>

          <button onClick={previousMusic}>⏮</button>
          <button onClick={stopMusic}>⏹ Stop</button>
          <button onClick={nextMusic}>⏭</button>

          {audioElement && !audioElement.paused && (
            <div className="neon-equalizer player-equalizer" aria-label="Music playing">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          )}

          <label className="music-volume">
            🔊
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={(event) => {
                const value = Number(event.target.value);
                setMusicVolume(value);
                if (audioElement) {
                  audioElement.volume = value;
                }
              }}
            />
          </label>
        </div>
      )}

      {callOpen && (
        <div className={isLive ? "call-screen go-live-screen" : "call-screen"}>
          {callType === "video" ? (
            <video
              ref={videoRef}
              className="call-video"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div className="audio-call-screen">
              <div className="call-avatar">👤</div>
              <h2>AP-STREAM Audio Call</h2>
              <p>Microphone connected</p>
            </div>
          )}

          <div className="call-top">
            <span>
              {isLive ? "🔴 AP-STREAM LIVE" : callType === "video" ? "📹 HD Video Call" : "📞 Audio Call"}
            </span>

            {isLive && liveId && (
              <div className="live-id-box">
                <strong>Live ID</strong>
                <span>{liveId}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(liveId)}
                >
                  📋 Copy
                </button>
              </div>
            )}
          </div>

          <div className="call-controls">
            <button onClick={toggleMic}>
              {micOn ? "🎙️ Mute" : "🔇 Unmute"}
            </button>

            {callType === "video" && (
              <>
                <button onClick={toggleCamera}>
                  {cameraOn ? "📷 Camera Off" : "📷 Camera On"}
                </button>

                <button onClick={switchCamera}>🔄 Switch Camera</button>

                <div
                  className="camera-quality-controls"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexWrap: "wrap",
                    marginTop: "6px"
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 600 }}>
                    HD:
                  </span>

                  {[
                    ["auto", "Auto"],
                    ["1080p", "1080p"],
                    ["720p", "720p"]
                  ].map(([quality, label]) => (
                    <button
                      key={quality}
                      type="button"
                      onClick={() => applyCameraQuality(quality)}
                      aria-pressed={cameraQuality === quality}
                      style={{
                        fontSize: "12px",
                        padding: "5px 9px",
                        borderRadius: "999px",
                        fontWeight: cameraQuality === quality ? 700 : 500,
                        opacity: cameraQuality === quality ? 1 : 0.75
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}

          {/* ACTIVE CONFERENCE ROOM */}
          {conferenceOpen && (
            <div className="calls-feature-card conference-room-card">
              <h3>🎥 AP-STREAM Conference</h3>

              <p>
                Room: <strong>{conferenceRoomId}</strong>
              </p>

              <p>
                👥 {conferenceParticipants.length + 1} participant
                {conferenceParticipants.length === 0 ? "" : "s"}
              </p>

              {conferenceError && (
                <p className="call-error">
                  {conferenceError}
                </p>
              )}

              <div
                className="conference-video-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                  marginTop: "12px"
                }}
              >
                <div className="conference-video-tile">
                  <video
                    ref={(node) => {
                      if (
                        node &&
                        conferenceLocalStreamRef.current
                      ) {
                        node.srcObject =
                          conferenceLocalStreamRef.current;
                      }
                    }}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: "100%",
                      aspectRatio: "16/9",
                      objectFit: "cover",
                      borderRadius: "12px",
                      background: "#111"
                    }}
                  />
                  <small>🎙️ You</small>
                </div>

                {conferenceRemoteStreams.map(({ id, stream }) => (
                  <div
                    className="conference-video-tile"
                    key={id}
                  >
                    <video
                      ref={(node) => {
                        if (node) {
                          node.srcObject = stream;
                          node.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      style={{
                        width: "100%",
                        aspectRatio: "16/9",
                        objectFit: "cover",
                        borderRadius: "12px",
                        background: "#111"
                      }}
                    />
                    <small>👤 Participant</small>
                  </div>
                ))}
              </div>

              <div
                className="call-options"
                style={{
                  marginTop: "12px",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap"
                }}
              >
                <button
                  className="call-button"
                  type="button"
                  onClick={toggleConferenceMic}
                >
                  {conferenceMicOn ? "🎙️ Mute" : "🔇 Unmute"}
                </button>

                <button
                  className="call-button"
                  type="button"
                  onClick={toggleConferenceCamera}
                >
                  {conferenceCameraOn
                    ? "📷 Camera Off"
                    : "📷 Camera On"}
                </button>

                <button
                  className="call-button"
                  type="button"
                  onClick={leaveConferenceRoom}
                >
                  🚪 Leave Room
                </button>
              </div>
            </div>
          )}


            <button
              className="end-call"
              onClick={() => {
                setIsLive(false);
                endCall();
              }}
            >
              🔴 End Call
            </button>
          </div>
        </div>
      )}



      {/* AP-STREAM MOBILE BOTTOM NAV */}
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          type="button"
          onClick={() => {
            setActiveStudio(null);
            setMusicOpen(false);
            setActiveFeature(null);
            setActiveSection("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span>⌂</span>
          <small>Home</small>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveStudio(null);
            setActiveFeature(null);
            setMusicOpen(false);
            document.getElementById("shorts")?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
          }}
        >
          <span>▶</span>
          <small>Shorts</small>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveStudio(null);
            setMusicOpen(false);
            setActiveFeature("files");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span>▣</span>
          <small>My Files</small>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveStudio(null);
            setMusicOpen(false);
            setActiveFeature("profile");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <span>●</span>
          <small>Me</small>
        </button>
      </nav>

      <AIAssistant />
      <AIAssistantManager />

      <footer>
        © 2026 AP-STREAM • Music • Video • Community • Calls
      </footer>
    </div>
  );
}

export default App;
