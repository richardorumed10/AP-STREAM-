import { useEffect, useState } from "react";


export default function AIStudio() {

  const [generalMessages, setGeneralMessages] = useState([]);
  const [generalInput, setGeneralInput] = useState("");
  const [generalLoading, setGeneralLoading] = useState(false);

  async function sendGeneralAI() {
    const message = generalInput.trim();

    if (!message || generalLoading) return;

    const updatedMessages = [
      ...generalMessages,
      { role: "user", content: message }
    ];

    setGeneralMessages(updatedMessages);
    setGeneralInput("");
    setGeneralLoading(true);

    try {
      const response = await fetch("/api/ai/general", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          messages: updatedMessages
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          `Request failed (${response.status})`
        );
      }

      const reply =
        data?.reply ||
        data?.response ||
        data?.message ||
        data?.content ||
        "I couldn't generate a response.";

      setGeneralMessages((prev) => [
        ...prev,
        { role: "assistant", content: reply }
      ]);
    } catch (error) {
      console.error("General AI error:", error);

      setGeneralMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, General AI could not respond right now."
        }
      ]);
    } finally {
      setGeneralLoading(false);
    }
  }




  const [mode, setMode] = useState("faceless");
  const [kidsCharacter, setKidsCharacter] = useState("");
  const [kidsStory, setKidsStory] = useState("");
  const [kidsLanguage, setKidsLanguage] = useState("English");
  const [kidsType, setKidsType] = useState("Adventure");
  const [kidsDuration, setKidsDuration] = useState("3 minutes");
  const [kidsResult, setKidsResult] = useState("");
  const [kidsScenes, setKidsScenes] = useState("");
  const [kidsSceneData, setKidsSceneData] = useState([]);
  const [kidsCharacters, setKidsCharacters] = useState([]);
  const [showCharacterStudio, setShowCharacterStudio] = useState(false);
  const [characterName, setCharacterName] = useState("");
  const [characterRole, setCharacterRole] = useState("Main Character");
  const [characterPersonality, setCharacterPersonality] = useState("");
  const [characterVisual, setCharacterVisual] = useState("");
  const [characterPrompt, setCharacterPrompt] = useState("");
  const [generatingKidsScenes, setGeneratingKidsScenes] = useState(false);
  const [kidsVisual, setKidsVisual] = useState("");
  const [generatingKidsVisual, setGeneratingKidsVisual] = useState(false);
  const [showKidsPreview, setShowKidsPreview] = useState(false);
  const [currentKidsPreviewScene, setCurrentKidsPreviewScene] = useState(1);
  const [kidsAudio, setKidsAudio] = useState("");
  const [showKidsAudio, setShowKidsAudio] = useState(false);
  const [showKidsTimeline, setShowKidsTimeline] = useState(false);
  const [editingKidsScene, setEditingKidsScene] = useState(null);
  const [kidsSceneEdits, setKidsSceneEdits] = useState({});
  const [language, setLanguage] = useState("English");
  const [topic, setTopic] = useState("");
  const [musicStyle, setMusicStyle] = useState("Afrobeat");
  const [duration, setDuration] = useState("60 seconds");
  const [created, setCreated] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [lyrics, setLyrics] = useState(null);
  const [generatingLyrics, setGeneratingLyrics] = useState(false);
  const [aiError, setAiError] = useState("");
  const [creativeResult, setCreativeResult] = useState(null);
  const [creativeTool, setCreativeTool] = useState("");
  const [generatingCreative, setGeneratingCreative] = useState(false);

  useEffect(() => {
    function handleRecording(event) {
      setRecordingUrl(event.detail?.audioUrl || "");
    }

    window.addEventListener("apstream-recording-ready", handleRecording);

    return () => {
      window.removeEventListener("apstream-recording-ready", handleRecording);
    };
  }, []);

  function clearGeneralAI() {
    setGeneralMessages([]);
    setGeneralInput("");
    setAiError("");
  }

  async function createProject() {
    if (!topic.trim()) {
      setAiError("Enter an idea first.");
      return;
    }

    setGeneratingCreative(true);
    setCreativeTool(mode === "music" ? "music" : "story");
    setCreativeResult(null);
    setAiError("");

    try {
      if (mode === "music") {
        await generateSong();
        return;
      }

      const response = await fetch("/api/ai/creative", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tool: "story",
          topic,
          musicStyle,
          duration,
          language
        })
      });

      const data = await response.json();

      if (!response.ok || data.status !== "OK") {
        throw new Error(data.message || "AI generation failed.");
      }

      setCreativeResult(data.result);
      setCreated(true);

      if (mode === "combined") {
        await generateSong();
      }
    } catch (error) {
      console.error("AP-STREAM AI project error:", error);
      setAiError(error.message || "Could not create the AI project.");
    } finally {
      setGeneratingCreative(false);
    }
  }

  async function generateSong() {
    if (!topic.trim()) {
      setAiError("Enter a song idea first.");
      return;
    }

    setGeneratingLyrics(true);
    setAiError("");

    try {
      const response = await fetch("/api/ai/song", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic,
          musicStyle,
          language
        })
      });

      const data = await response.json();

      if (!response.ok || data.status !== "OK") {
        throw new Error(data.message || "AI generation failed.");
      }

      setLyrics(data.lyrics);
      setCreated(true);
    } catch (error) {
      console.error("AI Song Builder error:", error);
      setAiError(error.message || "Could not generate lyrics.");
    } finally {
      setGeneratingLyrics(false);
    }
  }

  async function generateTool(tool, defaultTopic) {
    const creativeTopic =
      topic.trim() || defaultTopic;

    setGeneratingCreative(true);
    setCreativeTool(tool);
    setCreativeResult(null);
    setAiError("");

    try {
      const response = await fetch("/api/ai/tool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tool,
          topic: creativeTopic,
          musicStyle,
          duration,
          language
        })
      });

      const data = await response.json();

      if (!response.ok || data.status !== "OK") {
        throw new Error(data.message || "AI generation failed.");
      }

      setCreativeResult(data.result);
      setCreated(true);
    } catch (error) {
      console.error("AP-STREAM AI Tool error:", error);
      setAiError(error.message || "Could not generate content.");
    } finally {
      setGeneratingCreative(false);
    }
  }

  async function generateCreative(tool) {
    const creativeTopic =
      topic.trim() || "AP-STREAM African music and creator community";

    setGeneratingCreative(true);
    setCreativeTool(tool);
    setCreativeResult(null);
    setAiError("");

    try {
      const response = await fetch("/api/ai/creative", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tool,
          topic: creativeTopic,
          musicStyle,
          duration,
          language
        })
      });

      const data = await response.json();

      if (!response.ok || data.status !== "OK") {
        throw new Error(data.message || "AI generation failed.");
      }

      setCreativeResult(data.result);
      setCreated(true);
    } catch (error) {
      console.error("AI Creative error:", error);
      setAiError(error.message || "Could not generate creative content.");
    } finally {
      setGeneratingCreative(false);
    }
  }

  return (
    <section id="ai-studio" className="ai-studio-section">

      <div className="apstream-general-ai">
        <div className="general-ai-header">
          <div>
            <span className="ai-studio-label">🤖 AP-STREAM AI</span>
            <h2>General AI</h2>
            <p>Your intelligent assistant inside AP-STREAM.</p>
          </div>

          <button
            type="button"
            onClick={clearGeneralAI}
            disabled={generalMessages.length === 0 && !generalInput}
          >
            🗑️ New Chat
          </button>
        </div>

        <div className="general-ai-chat">
          {generalMessages.length === 0 ? (
            <div className="general-ai-empty">
              <div className="general-ai-icon">🤖</div>
              <h3>Welcome to AP-STREAM AI</h3>
              <p>
                Ask questions, develop ideas, learn, write, plan projects,
                or work on music and video concepts.
              </p>

              <div className="general-ai-suggestions">
                <button type="button" onClick={() => setGeneralInput("Give me a fresh idea for an AP-STREAM Short.")}>
                  🎬 Shorts idea
                </button>
                <button type="button" onClick={() => setGeneralInput("Help me plan an original Afrobeat music project.")}>
                  🎵 Music idea
                </button>
                <button type="button" onClick={() => setGeneralInput("Explain a difficult topic to me simply.")}>
                  📚 Explain something
                </button>
                <button type="button" onClick={() => setGeneralInput("Help me plan a creative project.")}>
                  💡 Project idea
                </button>
              </div>
            </div>
          ) : (
            <div className="general-ai-messages">
              {generalMessages.map((item, index) => (
                <div
                  className={`general-ai-message ${item.role}`}
                  key={`${item.role}-${index}`}
                >
                  <strong>
                    {item.role === "user" ? "You" : "🤖 AP-STREAM AI"}
                  </strong>
                  <p>{item.content}</p>
                </div>
              ))}

              {generalLoading && (
                <div className="general-ai-message assistant">
                  <strong>🤖 AP-STREAM AI</strong>
                  <p>Thinking...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {aiError && (
          <div className="general-ai-error">
            ⚠️ {aiError}
          </div>
        )}

        <div className="general-ai-input">
          <textarea
            value={generalInput}
            onChange={(event) => setGeneralInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendGeneralAI();
              }
            }}
            placeholder="Ask AP-STREAM AI anything..."
            rows="2"
          />

          <button
            type="button"
            onClick={sendGeneralAI}
            disabled={!generalInput.trim() || generalLoading}
          >
            {generalLoading ? "⏳" : "➤"} Send
          </button>
        </div>
      </div>



      <div className="apstream-ai-toolbox">
        <div className="apstream-ai-toolbox-header">
          <span className="ai-studio-label">⚡ AP-STREAM AI</span>
          <h2>AI TOOLBOX</h2>
          <p>One creative workspace for creators, artists, learners and communities.</p>
        </div>

        <div className="apstream-ai-tools">
          <button type="button" onClick={() => generateTool(
            "writer",
            "Create a polished original piece of content from my idea."
          )}>
            ✍️ AI Writer
          </button>

          <button type="button" onClick={() => generateTool(
            "video",
            "Create a complete video plan with hook, script, five scenes, visual direction and shot list."
          )}>
            🎬 Video Planner
          </button>

          <button type="button" onClick={() => generateTool(
            "music",
            "Help me develop an original song concept with theme, structure, chorus idea and production direction."
          )}>
            🎵 Music Assistant
          </button>

          <button type="button" onClick={() => generateTool(
            "image",
            "Create a detailed original thumbnail and artwork prompt for my content."
          )}>
            🎨 Image Prompts
          </button>

          <button type="button" onClick={() => generateTool(
            "voice",
            "Write a natural voice-over script for my video with an engaging opening and memorable ending."
          )}>
            🎙️ Voice Scripts
          </button>

          <button type="button" onClick={() => generateTool(
            "social",
            "Create social media captions, hooks and content ideas for AP-STREAM."
          )}>
            📱 Social Assistant
          </button>

          <button type="button" onClick={() => generateTool(
            "study",
            "Explain this topic simply, step by step, and give me examples to help me learn."
          )}>
            📚 Study Assistant
          </button>

          <button type="button" onClick={() => generateTool(
            "business",
            "Help me plan a creator or small business project, including goals, audience, content and next steps."
          )}>
            💼 Creator Business
          </button>

          <button type="button" onClick={() => generateTool(
            "ebook",
            "Write an original eBook based on my idea, including a title, subtitle, chapter outline and engaging chapters."
          )}>
            📖 eBook Writer
          </button>

          <button type="button" onClick={() => {
            setMode("kids-cartoons");
            setKidsStory("");
            setShowKidsPreview(false);
          }}>
            🧒 Kids Cartoon Studio
          </button>
        </div>
      </div>

      <div className="ai-studio-header">
        <span className="ai-studio-label">🤖 AP-STREAM AI</span>
        <h2>AI Studio</h2>
        <p>
          Create faceless content and original music in one creative workspace.
        </p>
      </div>

      <div className="ai-language-selector">
        <label htmlFor="ai-language">🌐 Language</label>
        <select
          id="ai-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
        >
          <option>English</option>
          <option>Ateso</option>
          <option>Kiswahili</option>
          <option>Luganda</option>
        </select>
      </div>

      <div className="ai-studio-tabs">
        <button
          className={mode === "faceless" ? "active" : ""}
          onClick={() => setMode("faceless")}
        >
          🎬 Faceless Content
        </button>

        <button
          className={mode === "music" ? "active" : ""}
          onClick={() => setMode("music")}
        >
          🎵 Music Production
        </button>

        <button
          className={mode === "combined" ? "active" : ""}
          onClick={() => setMode("combined")}
        >
          🔗 Music + Video
        </button>
      </div>

      <div className="ai-studio-workspace">
        <div className="ai-studio-editor">
          <h3>
            {mode === "faceless"
              ? "🎬 Create Faceless Content"
              : mode === "music"
              ? "🎵 Create Music"
              : "🔗 Create Music + Faceless Video"}
          </h3>

          <label>Your idea</label>

          <textarea
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setCreated(false);
            }}
            placeholder={
              mode === "music"
                ? "Describe the music you want to create..."
                : "Describe the content you want to create..."
            }
          />

          {(mode === "music" || mode === "combined") && (
            <>
              <label>Music style</label>

              <select
                value={musicStyle}
                onChange={(event) => setMusicStyle(event.target.value)}
              >
                <option>Afrobeat</option>
                <option>Amapiano</option>
                <option>Afropop</option>
                <option>Hip-Hop</option>
                <option>R&B</option>
                <option>Chill</option>
                <option>Cinematic</option>
              </select>
            </>
          )}

          {mode !== "music" && (
            <>
              <label>Video length</label>

              <select
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              >
                <option>30 seconds</option>
                <option>60 seconds</option>
                <option>90 seconds</option>
                <option>3 minutes</option>
              </select>
            </>
          )}

          <button className="ai-create-button" onClick={createProject}>
            ✨ Create with AI
          </button>

          {(mode === "music" || mode === "combined") && (
            <button
              className="ai-create-button"
              onClick={generateSong}
              disabled={generatingLyrics}
            >
              {generatingLyrics
                ? "🤖 Writing your song..."
                : "✨ Generate Verse + Chorus"}
            </button>
          )}

          {aiError && <p className="ai-error">{aiError}</p>}
        </div>

        <div className="ai-studio-preview">
          <div className="ai-preview-icon">
            {mode === "music"
              ? "🎵"
              : mode === "combined"
              ? "🎬🎵"
              : "🎬"}
          </div>

          <h3>{created ? "Project Ready" : "Creative Preview"}</h3>

          {!created ? (
            <p>
              Your generated script, music, scenes, captions and video preview
              will appear here.
            </p>
          ) : (
            <>
              <p>
                Your{" "}
                {mode === "combined"
                  ? "music + video"
                  : mode === "music"
                  ? "music"
                  : "faceless content"}{" "}
                project is ready.
              </p>

              <div className="ai-project-info">
                <strong>{topic}</strong>

                {recordingUrl && (
                  <span>🎙️ Microphone recording attached</span>
                )}

                {(mode === "music" || mode === "combined") && (
                  <span>🎵 {musicStyle}</span>
                )}

                {(mode === "faceless" || mode === "combined") && (
                  <span>⏱️ {duration}</span>
                )}
              </div>

              {lyrics && (
                <div className="ai-song-builder">
                  <h4>🎵 AI Song Builder</h4>

                  {lyrics.verse1 && (
                    <div className="ai-lyric-section">
                      <strong>📝 Verse 1</strong>
                      <p>{lyrics.verse1}</p>
                    </div>
                  )}

                  {lyrics.chorus && (
                    <div className="ai-lyric-section">
                      <strong>🎶 Chorus</strong>
                      <p>{lyrics.chorus}</p>
                    </div>
                  )}

                  {lyrics.verse2 && (
                    <div className="ai-lyric-section">
                      <strong>📝 Verse 2</strong>
                      <p>{lyrics.verse2}</p>
                    </div>
                  )}

                  {lyrics.bridge && (
                    <div className="ai-lyric-section">
                      <strong>🌉 Bridge</strong>
                      <p>{lyrics.bridge}</p>
                    </div>
                  )}

                  <button onClick={generateSong} disabled={generatingLyrics}>
                    🔄 Regenerate
                  </button>
                </div>
              )}

              <div className="ai-preview-actions">
                <button>👀 Preview</button>
                <button>✏️ Edit</button>
                <button>🚀 Export</button>
              </div>
            </>
          )}
        </div>
      </div>



      <div className="ai-creative-tools">
        <h3>✨ AI Creative Tools</h3>
        <p>Turn one idea into content for AP-STREAM.</p>

        <div className="ai-tool-buttons">
          <button
            onClick={() => generateCreative("cover")}
            disabled={generatingCreative}
          >
            🖼️ Cover Art
          </button>

          <button
            onClick={() => generateCreative("social")}
            disabled={generatingCreative}
          >
            ✍️ Social Post
          </button>

          <button
            onClick={() => generateCreative("story")}
            disabled={generatingCreative}
          >
            📝 Story / Script
          </button>

          <button
            onClick={() => generateCreative("voice")}
            disabled={generatingCreative}
          >
            🎙️ Voice Script
          </button>

          <button
            onClick={() => generateCreative("thumbnail")}
            disabled={generatingCreative}
          >
            🖼️ Thumbnail
          </button>

          <button
            onClick={() => generateCreative("ai_idea")}
            disabled={generatingCreative}
          >
            💡 AI Idea
          </button>



          <button
            onClick={() => {
              const text = lyrics
                ? [
                    lyrics.verse1,
                    lyrics.chorus,
                    lyrics.verse2,
                    lyrics.bridge
                  ].filter(Boolean).join("\n\n")
                : topic;

              if (text) {
                navigator.clipboard?.writeText(text);
              }
            }}
          >
            📋 Copy Result
          </button>
        </div>
      </div>

      {generatingCreative && (
        <div className="ai-creative-result">
          <h3>🤖 AP-STREAM AI is creating...</h3>
          <p>Working on your {creativeTool}.</p>
        </div>
      )}

      {creativeResult && !generatingCreative && (
        <div
          className="ai-creative-result"
          style={{
            display: "block",
            width: "100%",
            marginTop: "20px",
            padding: "18px",
            borderRadius: "14px",
            background: "#ffffff",
            border: "2px solid #b7dfc5",
            boxSizing: "border-box"
          }}
        >
          <h3 style={{ marginTop: 0 }}>✨ AP-STREAM AI Output</h3>

          <div
            className="ai-result-content"
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.6,
              minHeight: "60px"
            }}
          >
            {typeof creativeResult === "string"
              ? creativeResult
              : JSON.stringify(creativeResult, null, 2)}
          </div>

          <div style={{ marginTop: "14px" }}>
            <button
              type="button"
              onClick={() => {
                const text =
                  typeof creativeResult === "string"
                    ? creativeResult
                    : JSON.stringify(creativeResult, null, 2);
                navigator.clipboard?.writeText(text);
              }}
            >
              📋 Copy AI Result
            </button>
          </div>
        </div>
      )}

      {mode === "kids-cartoons" && (
        <div className="ai-kids-cartoon">
          <h2>🎨 Kids Cartoons</h2>
          <p>Create fun, educational and child-friendly cartoon episodes.</p>

          <label>👧 Character</label>
          <input
            value={kidsCharacter}
            onChange={(e) => setKidsCharacter(e.target.value)}
            placeholder="Example: A clever little lion named Kito"
          />

          <label>📖 Story idea</label>
          <textarea
            value={kidsStory}
            onChange={(e) => setKidsStory(e.target.value)}
            placeholder="What should happen in the cartoon?"
            rows="4"
          />

          <div className="kids-cartoon-row">
            <div>
              <label>🌍 Language</label>
              <select
                value={kidsLanguage}
                onChange={(e) => setKidsLanguage(e.target.value)}
              >
                <option>English</option>
                <option>Swahili</option>
                <option>French</option>
                <option>Luganda</option>
              </select>
            </div>

            <div>
              <label>🎭 Story type</label>
              <select
                value={kidsType}
                onChange={(e) => setKidsType(e.target.value)}
              >
                <option>Adventure</option>
                <option>Funny</option>
                <option>Educational</option>
                <option>Friendship</option>
                <option>African Story</option>
              </select>
            </div>

            <div>
              <label>⏱️ Duration</label>
              <select
                value={kidsDuration}
                onChange={(e) => setKidsDuration(e.target.value)}
              >
                <option>1 minute</option>
                <option>3 minutes</option>
                <option>5 minutes</option>
                <option>10 minutes</option>
              </select>
            </div>
          </div>

          <button
            onClick={async () => {
              const character =
                kidsCharacter.trim() || "a friendly cartoon character";
              const story =
                kidsStory.trim() ||
                "a fun adventure where friends learn something new";

              setKidsResult("✨ Creating your kids cartoon...");

              try {
                const response = await fetch("/api/ai/kids-cartoon", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    character,
                    story,
                    language: kidsLanguage,
                    type: kidsType,
                    duration: kidsDuration,
                  }),
                });

                const data = await response.json();

                if (!response.ok || !data.success) {
                  throw new Error(
                    data.error || "Could not generate the cartoon."
                  );
                }

                setKidsResult(data.result || "Cartoon created successfully.");
              } catch (error) {
                setKidsResult(
                  "⚠️ Cartoon generation failed: " +
                    (error.message || "Please try again.")
                );
              }
            }}
          >
            ✨ Create Kids Cartoon
          </button>

          <button
            onClick={() => {
              const character =
                kidsCharacters[0] || {
                  id: "demo",
                  name: kidsCharacter.trim() || "Kato",
                  role: "Main Character",
                  personality: "Kind, curious and brave.",
                  visual: "Bright, colorful child-friendly cartoon character.",
                  visualPrompt:
                    "Keep the character design consistent across every scene.",
                };

              const demoScenes = [
                {
                  number: 1,
                  title: "The Garden Adventure",
                  visual: `${character.visual} in a bright colorful garden.`,
                  narration:
                    "Kato discovers a beautiful garden and decides to explore.",
                  dialogue: `${character.name}: What an amazing place!`,
                  sound: "Birds chirping and gentle playful music.",
                  duration: "30 seconds",
                },
                {
                  number: 2,
                  title: "A New Friend",
                  visual: `${character.visual} meeting a friendly animal friend.`,
                  narration:
                    "Along the way, Kato meets a new friend who needs help.",
                  dialogue: `${character.name}: Don't worry, I'll help you!`,
                  sound: "Happy footsteps and cheerful sounds.",
                  duration: "30 seconds",
                },
                {
                  number: 3,
                  title: "Working Together",
                  visual: `${character.visual} working together with friends.`,
                  narration:
                    "The friends discover that teamwork makes the problem easier.",
                  dialogue: `${character.name}: We can do it together!`,
                  sound: "Upbeat playful music.",
                  duration: "30 seconds",
                },
                {
                  number: 4,
                  title: "The Big Discovery",
                  visual: `${character.visual} discovering something colorful and wonderful.`,
                  narration:
                    "Together they discover something that teaches them an important lesson.",
                  dialogue: `${character.name}: Look what we found!`,
                  sound: "Gentle magical discovery sound.",
                  duration: "30 seconds",
                },
                {
                  number: 5,
                  title: "The Happy Ending",
                  visual: `${character.visual} smiling with friends in the garden.`,
                  narration:
                    "The friends celebrate their adventure and what they learned.",
                  dialogue: `${character.name}: Helping each other makes every adventure better!`,
                  sound: "Cheerful music and happy laughter.",
                  duration: "30 seconds",
                },
              ];

              setKidsSceneData(demoScenes);
              setKidsScenes(JSON.stringify({
                title: "The Garden Adventure",
                characters: [character],
                scenes: demoScenes,
                lesson: "Teamwork and kindness make adventures better.",
              }, null, 2));
            }}
          >
            🧪 Load Demo 5 Scenes
          </button>

          {kidsResult && !generatingKidsScenes && (
            <button
              onClick={async () => {
                setGeneratingKidsScenes(true);
                setKidsScenes("✨ Creating 5 cartoon scenes...");

                try {
                  const response = await fetch("/api/ai/kids-cartoon-scenes", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      character:
                        kidsCharacter.trim() ||
                        "a friendly cartoon character",
                      characters: kidsCharacters.map((character) => ({
                        name: character.name,
                        role: character.role,
                        personality: character.personality,
                        visual: character.visual,
                        visualPrompt: character.visualPrompt || "",
                      })),
                      story:
                        kidsStory.trim() ||
                        "a fun adventure where friends learn something new",
                      language: kidsLanguage,
                      type: kidsType,
                      duration: kidsDuration,
                    }),
                  });

                  const data = await response.json();

                  if (!response.ok || !data.success) {
                    throw new Error(
                      data.error || "Could not create cartoon scenes."
                    );
                  }

                  const result = data.result || "Scenes created successfully.";
                  setKidsScenes(result);

                  setKidsSceneData(
                    [1, 2, 3, 4, 5].map((number) => ({
                      number,
                      title: `Scene ${number}`,
                      visual: "Child-friendly cartoon setting.",
                      narration: "The story continues with a fun adventure.",
                      dialogue: `${kidsCharacter.trim() || "Character"}: Let's keep going!`,
                      sound: "Gentle playful sound effects.",
                      duration: "30 seconds",
                    }))
                  );
                } catch (error) {
                  setKidsScenes(
                    "⚠️ Scene generation failed: " +
                      (error.message || "Please try again.")
                  );
                } finally {
                  setGeneratingKidsScenes(false);
                }
              }}
            >
              🎬 Generate 5 Scenes
            </button>
          )}

          {kidsScenes && !generatingKidsVisual && (
            <button
              onClick={async () => {
                setGeneratingKidsVisual(true);
                setKidsVisual("🎨 Creating visual production prompt...");

                try {
                  const response = await fetch("/api/ai/kids-cartoon-visual", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      character:
                        kidsCharacter.trim() ||
                        "a friendly cartoon character",
                      scene: kidsScenes,
                      language: kidsLanguage,
                    }),
                  });

                  const data = await response.json();

                  if (!response.ok || !data.success) {
                    throw new Error(
                      data.error || "Could not create visual prompt."
                    );
                  }

                  setKidsVisual(
                    data.result || "Visual prompt created successfully."
                  );
                } catch (error) {
                  setKidsVisual(
                    "⚠️ Visual generation failed: " +
                      (error.message || "Please try again.")
                  );
                } finally {
                  setGeneratingKidsVisual(false);
                }
              }}
            >
              🖼️ Generate Visual Prompt
            </button>
          )}

          {(kidsResult || kidsScenes) && (
            <button
              onClick={() => {
                const character =
                  kidsCharacter.trim() || "the main character";
                const story =
                  kidsStory.trim() ||
                  "a fun adventure where friends learn something new";

                setKidsAudio(
                  [
                    "🎙️ KIDS CARTOON AUDIO PLAN",
                    "",
                    "Narrator:",
                    `Welcome to a new ${kidsType.toLowerCase()} adventure with ${character}.`,
                    "",
                    "Opening narration:",
                    story,
                    "",
                    "Character dialogue:",
                    `${character}: Let's go on an adventure!`,
                    "Friend: We can solve it together!",
                    "",
                    "🎵 Background music:",
                    "Bright, cheerful and playful children's music.",
                    "",
                    "🔊 Sound effects:",
                    "Footsteps, gentle nature sounds, playful movement and a happy ending sound.",
                    "",
                    "🎬 Ending narration:",
                    "The friends learn that kindness, teamwork and curiosity can make every adventure special."
                  ].join("\n")
                );

                setShowKidsAudio(true);
              }}
            >
              🎙️ Create Audio Plan
            </button>
          )}

          {showKidsAudio && kidsAudio && (
            <div className="kids-cartoon-result">
              <h3>🎙️ Kids Cartoon Audio Studio</h3>
              <pre>{kidsAudio}</pre>

              <button
                onClick={() => navigator.clipboard?.writeText(kidsAudio)}
              >
                📋 Copy Audio Plan
              </button>

              <button
                onClick={() => setShowKidsAudio(false)}
              >
                ✖️ Close Audio Studio
              </button>
            </div>
          )}

          {(kidsResult || kidsScenes) && (
            <button
              onClick={() => setShowKidsTimeline(!showKidsTimeline)}
            >
              {showKidsTimeline
                ? "⬅️ Close Timeline"
                : "🎬 Episode Timeline"}
            </button>
          )}

          {showKidsTimeline && (
            <div className="kids-episode-timeline">
              <h2>🎬 AP-STREAM Kids — Episode Timeline</h2>

              <div className="kids-timeline-info">
                <strong>{kidsCharacter.trim() || "Main Character"}</strong>
                <span>
                  {kidsLanguage} • {kidsType} • {kidsDuration}
                </span>
              </div>

              {[1, 2, 3, 4, 5].map((sceneNumber) => (
                <div
                  className="kids-timeline-scene"
                  key={sceneNumber}
                >
                  <div className="kids-scene-number">
                    {sceneNumber}
                  </div>

                  <div className="kids-scene-content">
                    <h3>Scene {sceneNumber}</h3>

                    <p>
                      🎬 Story scene for{" "}
                      {kidsCharacter.trim() || "the main character"}.
                    </p>

                    <p>
                      🖼️ Visual:
                      <br />
                      Colorful child-friendly cartoon setting with clear
                      character action and expressive animation.
                    </p>

                    <p>
                      🎙️ Narration:
                      <br />
                      The story continues with a fun and positive adventure.
                    </p>

                    <p>
                      💬 Dialogue:
                      <br />
                      {kidsCharacter.trim() || "Character"}: Let's keep going!
                    </p>

                    <p>
                      🔊 Sound:
                      <br />
                      Gentle movement and playful background sounds.
                    </p>
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const timeline = [1, 2, 3, 4, 5]
                    .map(
                      (n) =>
                        `Scene ${n}\n` +
                        `Character: ${
                          kidsCharacter.trim() || "Main Character"
                        }\n` +
                        `Visual: Child-friendly cartoon scene\n` +
                        `Narration: The story continues with a fun adventure.\n` +
                        `Dialogue: Let's keep going!\n` +
                        `Sound: Gentle playful effects`
                    )
                    .join("\n\n");

                  navigator.clipboard?.writeText(timeline);
                }}
              >
                📋 Copy Timeline
              </button>
            </div>
          )}

          <button
            onClick={() => setShowCharacterStudio(!showCharacterStudio)}
          >
            {showCharacterStudio
              ? "⬅️ Close Character Studio"
              : "🎨 Character Studio"}
          </button>

          {showCharacterStudio && (
            <div className="kids-character-studio">
              <h2>🎨 AP-STREAM Kids — Character Studio</h2>
              <p>
                Create reusable characters for your cartoon episodes.
              </p>

              <label>👤 Character Name</label>
              <input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="Example: Kato"
              />

              <label>🎭 Role</label>
              <select
                value={characterRole}
                onChange={(e) => setCharacterRole(e.target.value)}
              >
                <option>Main Character</option>
                <option>Friend</option>
                <option>Parent</option>
                <option>Teacher</option>
                <option>Animal Friend</option>
                <option>Story Guide</option>
              </select>

              <label>😊 Personality</label>
              <textarea
                rows="3"
                value={characterPersonality}
                onChange={(e) => setCharacterPersonality(e.target.value)}
                placeholder="Kind, curious, brave and funny..."
              />

              <label>🖼️ Visual Description</label>
              <textarea
                rows="4"
                value={characterVisual}
                onChange={(e) => setCharacterVisual(e.target.value)}
                placeholder="Describe the character's cartoon appearance..."
              />

              <button
                onClick={() => {
                  const prompt = [
                    `Create a child-friendly 2D cartoon character named ${characterName.trim() || "Main Character"}.`,
                    `Role: ${characterRole}.`,
                    `Personality: ${characterPersonality.trim() || "friendly, curious and positive"}.`,
                    `Visual description: ${characterVisual.trim() || "bright, colorful and welcoming cartoon design"}.`,
                    "Use a clean, cheerful animation style suitable for children.",
                    "Keep the character design consistent across every episode scene."
                  ].join("\n");

                  setCharacterPrompt(prompt);
                }}
              >
                🎨 Create Visual Prompt
              </button>

              {characterPrompt && (
                <div className="kids-character-prompt">
                  <h3>🎨 Character Visual Prompt</h3>
                  <pre>{characterPrompt}</pre>

                  <button
                    onClick={() =>
                      navigator.clipboard?.writeText(characterPrompt)
                    }
                  >
                    📋 Copy Visual Prompt
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  if (!characterName.trim()) return;

                  setKidsCharacters([
                    ...kidsCharacters,
                    {
                      id: Date.now(),
                      name: characterName.trim(),
                      role: characterRole,
                      personality:
                        characterPersonality.trim() ||
                        "Friendly and positive.",
                      visual:
                        characterVisual.trim() ||
                        "Friendly child-safe cartoon character.",
                      visualPrompt:
                        characterPrompt ||
                        "Child-friendly cartoon character with a consistent, cheerful design.",
                      visualPrompt:
                        characterPrompt ||
                        [
                          `Child-friendly cartoon character named ${characterName.trim() || "Main Character"}.`,
                          `Role: ${characterRole}.`,
                          `Personality: ${characterPersonality.trim() || "friendly, curious and positive"}.`,
                          `Visual: ${characterVisual.trim() || "bright, colorful and welcoming cartoon design"}.`,
                          "Keep the character design consistent across every episode scene."
                        ].join("\n"),
                    },
                  ]);

                  setCharacterName("");
                  setCharacterPersonality("");
                  setCharacterVisual("");
                }}
              >
                ➕ Save Character
              </button>

              {kidsCharacters.length > 0 && (
                <div className="kids-character-list">
                  <h3>👥 Episode Characters</h3>

                  {kidsCharacters.map((character) => (
                    <div
                      className="kids-character-card"
                      key={character.id}
                    >
                      <h3>👤 {character.name}</h3>
                      <p>🎭 {character.role}</p>
                      <p>😊 {character.personality}</p>
                      <p>🖼️ {character.visual}</p>

                      <button
                        onClick={() => {
                          setKidsCharacters(
                            kidsCharacters.filter(
                              (item) => item.id !== character.id
                            )
                          );
                        }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {kidsScenes && (
            <div className="kids-scene-editor-panel">
              <h2>✏️ Kids Cartoon Scene Editor</h2>
              <p>Edit each scene independently before producing the episode.</p>

              {(kidsSceneData.length
                ? kidsSceneData
                : [1, 2, 3, 4, 5].map((number) => ({
                    number,
                    title: `Scene ${number}`,
                    visual: "Child-friendly cartoon setting.",
                    narration: "The story continues with a fun adventure.",
                    dialogue: `${kidsCharacter.trim() || "Character"}: Let's keep going!`,
                    sound: "Gentle playful sound effects.",
                    duration: "30 seconds",
                  }))
              ).map((sceneData) => {
                const sceneNumber = sceneData.number;
                const scene = kidsSceneEdits[sceneNumber] || {
                  visual: "Colorful child-friendly cartoon setting.",
                  narration: "The story continues with a fun and positive adventure.",
                  dialogue: `${kidsCharacter.trim() || "Character"}: Let's keep going!`,
                  sound: "Gentle playful background sounds.",
                  duration: "30 seconds",
                };

                return (
                  <div className="kids-edit-scene" key={sceneNumber}>
                    <h3>🎬 Scene {sceneNumber}</h3>

                    {kidsCharacters.length > 0 && (
                      <div className="kids-apply-character">
                        <label>🎭 Apply Character to All Scenes</label>

                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const selectedCharacter =
                              kidsCharacters.find(
                                (character) =>
                                  String(character.id) === e.target.value
                              );

                            if (!selectedCharacter) return;

                            setKidsSceneEdits((current) => {
                              const updated = { ...current };

                              [1, 2, 3, 4, 5].forEach((number) => {
                                const existing =
                                  kidsSceneData.find(
                                    (scene) => scene.number === number
                                  ) || {};

                                updated[number] = {
                                  ...existing,
                                  ...updated[number],
                                  characterId: String(selectedCharacter.id),
                                  characterName: selectedCharacter.name,
                                  characterPersonality:
                                    selectedCharacter.personality,
                                  characterVisual:
                                    selectedCharacter.visual,
                                  characterVisualPrompt:
                                    selectedCharacter.visualPrompt || "",
                                };
                              });

                              return updated;
                            });
                          }}
                        >
                          <option value="">
                            Choose character for all scenes
                          </option>

                          {kidsCharacters.map((character) => (
                            <option
                              key={character.id}
                              value={character.id}
                            >
                              {character.name} — {character.role}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {kidsCharacters.length > 0 && (
                      <div className="kids-scene-character">
                        {scene.characterId && (
                          <div className="kids-selected-character">
                            {(() => {
                              const selectedCharacter =
                                kidsCharacters.find(
                                  (character) =>
                                    String(character.id) ===
                                    String(scene.characterId)
                                );

                              if (!selectedCharacter) return null;

                              return (
                                <>
                                  <h4>👤 {selectedCharacter.name}</h4>
                                  <p>
                                    🎭 Role: {selectedCharacter.role}
                                  </p>
                                  <p>
                                    😊 Personality:{" "}
                                    {selectedCharacter.personality}
                                  </p>
                                  <p>
                                    🖼️ Visual:{" "}
                                    {selectedCharacter.visual}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        )}
                        <label>🎭 Character</label>
                        <select
                          value={scene.characterId || ""}
                          onChange={(e) =>
                            setKidsSceneEdits({
                              ...kidsSceneEdits,
                              [sceneNumber]: {
                                ...scene,
                                characterId: e.target.value,
                                characterName:
                                  kidsCharacters.find(
                                    (character) =>
                                      String(character.id) === e.target.value
                                  )?.name || "",
                                characterPersonality:
                                  kidsCharacters.find(
                                    (character) =>
                                      String(character.id) === e.target.value
                                  )?.personality || "",
                                characterVisual:
                                  kidsCharacters.find(
                                    (character) =>
                                      String(character.id) === e.target.value
                                  )?.visual || "",
                                characterVisualPrompt:
                                  kidsCharacters.find(
                                    (character) =>
                                      String(character.id) === e.target.value
                                  )?.visualPrompt || "",
                                visual:
                                  kidsCharacters.find(
                                    (character) =>
                                      String(character.id) === e.target.value
                                  )?.visual ||
                                  scene.visual,
                                dialogue:
                                  `${
                                    kidsCharacters.find(
                                      (character) =>
                                        String(character.id) ===
                                        e.target.value
                                    )?.name || "Character"
                                  }: Let's continue our adventure!`,
                              },
                            })
                          }
                        >
                          <option value="">Choose a character</option>
                          {kidsCharacters.map((character) => (
                            <option
                              key={character.id}
                              value={character.id}
                            >
                              {character.name} — {character.role}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <label>🖼️ Visual</label>
                    <textarea
                      rows="3"
                      value={scene.visual}
                      onChange={(e) =>
                        setKidsSceneEdits({
                          ...kidsSceneEdits,
                          [sceneNumber]: {
                            ...scene,
                            visual: e.target.value,
                          },
                        })
                      }
                    />

                    <label>🎙️ Narration</label>
                    <textarea
                      rows="3"
                      value={scene.narration}
                      onChange={(e) =>
                        setKidsSceneEdits({
                          ...kidsSceneEdits,
                          [sceneNumber]: {
                            ...scene,
                            narration: e.target.value,
                          },
                        })
                      }
                    />

                    <label>💬 Dialogue</label>
                    <textarea
                      rows="3"
                      value={scene.dialogue}
                      onChange={(e) =>
                        setKidsSceneEdits({
                          ...kidsSceneEdits,
                          [sceneNumber]: {
                            ...scene,
                            dialogue: e.target.value,
                          },
                        })
                      }
                    />

                    <label>🔊 Sound Effects</label>
                    <textarea
                      rows="2"
                      value={scene.sound}
                      onChange={(e) =>
                        setKidsSceneEdits({
                          ...kidsSceneEdits,
                          [sceneNumber]: {
                            ...scene,
                            sound: e.target.value,
                          },
                        })
                      }
                    />

                    <label>⏱️ Duration</label>
                    <select
                      value={scene.duration}
                      onChange={(e) =>
                        setKidsSceneEdits({
                          ...kidsSceneEdits,
                          [sceneNumber]: {
                            ...scene,
                            duration: e.target.value,
                          },
                        })
                      }
                    >
                      <option>15 seconds</option>
                      <option>30 seconds</option>
                      <option>45 seconds</option>
                      <option>60 seconds</option>
                    </select>

                    <button
                      onClick={() => setEditingKidsScene(sceneNumber)}
                    >
                      ✏️ Edit Scene {sceneNumber}
                    </button>

                    {editingKidsScene === sceneNumber && (
                      <div className="kids-edit-status">
                        Editing Scene {sceneNumber} — changes are saved automatically.
                        <button onClick={() => setEditingKidsScene(null)}>
                          ✅ Done
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {kidsSceneData.length > 0 && (
            <div className="kids-scene-strip">
              <h3>🎬 Scene Timeline</h3>
              <div className="kids-scene-buttons">
                {kidsSceneData.map((scene) => (
                  <button
                    key={scene.number}
                    onClick={() => {
                      setEditingKidsScene(scene.number);
                      setCurrentKidsPreviewScene(scene.number);
                    }}
                  >
                    🎬 {scene.number}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(kidsResult || kidsScenes || kidsVisual) && (
            <button
              onClick={() => setShowKidsPreview(!showKidsPreview)}
            >
              {showKidsPreview ? "⬅️ Close Preview" : "▶️ Preview Episode"}
            </button>
          )}

          {showKidsPreview && (
            <div className="kids-episode-preview">
              <h2>🎬 AP-STREAM Kids — Episode Preview</h2>

              <div className="kids-preview-section">
                <h3>👧 Characters</h3>
                <p>
                  {kidsCharacter.trim() ||
                    "A friendly cartoon character"}
                </p>
              </div>

              <div className="kids-preview-section">
                <h3>📖 Story</h3>
                <p>
                  {kidsStory.trim() ||
                    "A fun adventure where friends learn something new."}
                </p>
              </div>

              <div className="kids-preview-section">
                <h3>🎭 Episode Settings</h3>
                <p>
                  {kidsLanguage} • {kidsType} • {kidsDuration}
                </p>
              </div>

              <div className="kids-preview-section">
                <h3>🎞️ Episode Scenes</h3>

                {kidsSceneData.length > 0 ? (
                  (() => {
                    const previewScene =
                      kidsSceneData.find(
                        (scene) =>
                          scene.number === currentKidsPreviewScene
                      ) || kidsSceneData[0];

                    const sceneIndex = Math.max(
                      0,
                      kidsSceneData.findIndex(
                        (scene) => scene.number === previewScene.number
                      )
                    );

                    return (
                      <div className="kids-preview-scenes">
                        <div className="kids-preview-scene">
                          <h4>
                            🎬 Scene {previewScene.number}:{" "}
                            {previewScene.title || "Untitled Scene"}
                          </h4>

                          <p>
                            <strong>🖼️ Visual:</strong>{" "}
                            {previewScene.visual ||
                              "No visual description yet."}
                          </p>

                          <p>
                            <strong>🎙️ Narration:</strong>{" "}
                            {previewScene.narration ||
                              "No narration yet."}
                          </p>

                          <p>
                            <strong>💬 Dialogue:</strong>{" "}
                            {previewScene.dialogue || "No dialogue yet."}
                          </p>

                          <p>
                            <strong>🔊 Sound:</strong>{" "}
                            {previewScene.sound ||
                              "Gentle background sounds."}
                          </p>

                          <p>
                            <strong>⏱️ Duration:</strong>{" "}
                            {previewScene.duration || "30 seconds"}
                          </p>

                          {previewScene.characterName && (
                            <p>
                              <strong>👤 Character:</strong>{" "}
                              {previewScene.characterName}
                            </p>
                          )}
                        </div>

                        <div className="kids-preview-navigation">
                          <button
                            disabled={sceneIndex === 0}
                            onClick={() =>
                              setCurrentKidsPreviewScene(
                                kidsSceneData[
                                  Math.max(0, sceneIndex - 1)
                                ].number
                              )
                            }
                          >
                            ⬅️ Previous
                          </button>

                          <span>
                            Scene {sceneIndex + 1} / {kidsSceneData.length}
                          </span>

                          <button
                            disabled={
                              sceneIndex === kidsSceneData.length - 1
                            }
                            onClick={() =>
                              setCurrentKidsPreviewScene(
                                kidsSceneData[
                                  Math.min(
                                    kidsSceneData.length - 1,
                                    sceneIndex + 1
                                  )
                                ].number
                              )
                            }
                          >
                            Next ➡️
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : kidsScenes ? (
                  <pre>{kidsScenes}</pre>
                ) : (
                  <p>No scenes created yet.</p>
                )}
              </div>

              {kidsVisual && (
                <div className="kids-preview-section">
                  <h3>🖼️ Visual Direction</h3>
                  <pre>{kidsVisual}</pre>
                </div>
              )}

              <div className="kids-preview-section">
                <h3>🎙️ Narration</h3>
                <p>
                  Narration will appear here when audio generation is connected.
                </p>
              </div>

              <div className="kids-preview-actions">
                <button
                  onClick={() => {
                    const text = [
                      "AP-STREAM KIDS CARTOON",
                      "",
                      "Character:",
                      kidsCharacter,
                      "",
                      "Story:",
                      kidsStory,
                      "",
                      `Language: ${kidsLanguage}`,
                      `Type: ${kidsType}`,
                      `Duration: ${kidsDuration}`,
                      "",
                      "Scenes:",
                      kidsScenes,
                      "",
                      "Visual Direction:",
                      kidsVisual,
                    ].join("\n");

                    navigator.clipboard?.writeText(text);
                  }}
                >
                  📋 Copy Episode
                </button>
              </div>
            </div>
          )}

          {kidsVisual && (
            <div className="kids-cartoon-result">
              <h3>🖼️ Cartoon Visual Direction</h3>
              <pre>{kidsVisual}</pre>

              <button
                onClick={() => navigator.clipboard?.writeText(kidsVisual)}
              >
                📋 Copy Visual Prompt
              </button>
            </div>
          )}

          {kidsScenes && (
            <div className="kids-cartoon-result">
              <h3>🎞️ Cartoon Production Scenes</h3>
              <pre>{kidsScenes}</pre>

              <button
                onClick={() => navigator.clipboard?.writeText(kidsScenes)}
              >
                📋 Copy Scenes
              </button>
            </div>
          )}

          {kidsResult && (
            <div className="kids-cartoon-result">
              <h3>🎬 Cartoon Preview</h3>
              <pre>{kidsResult}</pre>
              <button
                onClick={() => navigator.clipboard?.writeText(kidsResult)}
              >
                📋 Copy Cartoon
              </button>
            </div>
          )}
        </div>
      )}

      <div className="ai-studio-features">
        <div>
          <span>📝</span>
          <strong>AI Script</strong>
          <small>Turn ideas into video scripts.</small>
        </div>

        <div>
          <span>🎙️</span>
          <strong>AI Voice</strong>
          <small>Create narration for your content.</small>
        </div>

        <div>
          <span>🎵</span>
          <strong>AI Music</strong>
          <small>Create original music concepts.</small>
        </div>

        <div>
          <span>🎞️</span>
          <strong>Faceless Video</strong>
          <small>Build videos without appearing on camera.</small>
        </div>

        <button
          className="ai-feature-button"
          onClick={() => setMode("kids-cartoons")}
        >
          <span>🎨</span>
          <strong>Kids Cartoons</strong>
          <small>Create fun, educational and child-friendly cartoon stories.</small>
        </button>
      </div>
    </section>
  );
}
