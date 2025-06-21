import React, { useState, useRef, useEffect } from "react";
import {
  Volume2,
  Mic,
  Sun,
  Moon,
  Send,
  Smile,
  Trash2,
  MessageCircle,
  Zap,
  ArrowDownToLine,
  Copy,
  Command,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import dp from "/icon.png";
import WelcomeShortcutsModal from "./components/ShortcutsModal ";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const GEMINI_API_KEY = "AIzaSyB11RNtdp9C4jrO3GYA_fDN_riT3MehRu4";
const ELEVEN_LABS_API_KEY =
  "sk_3cf482af50699721277654a122c016b940a1f7df7f9c9749";
const VOICE_ID = "zs7UfyHqCCmny7uTxCYi";

function App() {
  const [input, setInput] = useState("");
  const [promt, setPromt] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voiceOnlyMode, setVoiceOnlyMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("dark-mode");
    return stored ? JSON.parse(stored) : true;
  });
  const [showEmoji, setShowEmoji] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const [reactions, setReactions] = useState({});
  const [activeReactionIndex, setActiveReactionIndex] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pinned, setPinned] = useState([]);
  const [chatStartTime, setChatStartTime] = useState(() => {
    const stored = localStorage.getItem("chat-start-time");
    return stored ? parseInt(stored) : null;
  });
  const [elapsedTime, setElapsedTime] = useState("0s");

  const handleVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported");

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setInput(voiceText);
      if (voiceOnlyMode) handleSendPrompt(voiceText);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const speakWithElevenLabs = async (text) => {
    try {
      const res = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVEN_LABS_API_KEY,
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: { stability: 0.7, similarity_boost: 0.9 },
          }),
        }
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
    } catch (error) {
      console.error("Speech synthesis failed:", error);
    }
  };

  const speakText = async (text, index) => {
    if (activeSpeakerIndex !== null) return;
    setActiveSpeakerIndex(index);
    await speakWithElevenLabs(text);
    setActiveSpeakerIndex(null);
  };

  const handleSendPrompt = async (customText) => {
    const rawInput = typeof customText === "string" ? customText : input;
    const trimmedInput = rawInput.trim();
    if (!trimmedInput || loading) return;

    const userMsg = {
      role: "user",
      content: trimmedInput,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updated = [...promt, userMsg];
    setPromt(updated);
    saveToLocalStorage(updated);
    setInput("");
    setLoading(true);

    try {
      const aiText = await chatGPTAi(trimmedInput);
      const aiMsg = {
        role: "model",
        content: aiText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const updatedChat = [...updated, aiMsg];
      setPromt(updatedChat);
      saveToLocalStorage(updatedChat);
      if (voiceOnlyMode) speakText(aiText);
    } catch (error) {
      console.error("API Error:", error);
      const errorMsg = {
        role: "model",
        content:
          "Sorry, I encountered an error. Please check your API configuration and try again.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      const updatedChat = [...updated, errorMsg];
      setPromt(updatedChat);
      saveToLocalStorage(updatedChat);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const chatGPTAi = async (userPrompt) => {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    const formattedHistory = promt.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));
    formattedHistory.push({ role: "user", parts: [{ text: userPrompt }] });

    const body = {
      contents: formattedHistory,
      generationConfig: { temperature: 0.8, maxOutputTokens: 500 },
      systemInstruction: {
        parts: [
          {
            text: `You are a male and named is Rohit who speaks in Hinglish.
            Rohit Negi Founder of Coder Army || Ex-SDE at UBER || GATE AIR 202 || Got Highest Placement in India in 2022
            You call when you explain somthing after that chamka, bhai,are yrr, to chaliye suru krte hai,
            these are word which rohit negi use when he speak mostly time

            keywords: which rohit negi use in his conversation mostly time
            use need to use these word jisse you are react like rohit negi
            ab toh bhai,
            behind the scene chize kese kaam krti hai
            are bhai,
            dekho bhai,
            sense bana rha hai aapko,
            ab hoga maut ka khel suru kre,
            when he rohit kisi ko kuch samjhata hai uske baaad he asking: chamak rha hai sab,
            when topic end uske baad he say or topic start: chaliye phir,
            at the end,
            if any student confuse or saying nahi ho payega he say : rocket science thodi hai bhai,
            thoda majakiya : 2 saal tak rkh rkha hai kya wo hai kya pnb ka account jo interest badhta jayega aesa kuch bolta hai ,
            mere dost krke baat krte hai,
            agar koi baar baar ek question or point kre ek hi chiz ko : yrr tum to bilkul dhit hi ho bhai,
            when he give some problem to student : soch paa rhe ho  behind the scene chize kese kaam kr rhi hai,
            agar koi bolo mujhse nahi ho pata :indepth karo bhai,
            first thot principle ka use kro first thot principle ka socho kisi ne banaya hoga to kese socha hoga,

            Conversation of rohit negi:
            me : bhaiya samjh gaya
            rohit negi: chamak raha hna 
            me: bhaiya indepth krana 
            rohit negi: haa bhai indepth hi hoga 
            me:accha bhiaya ye aese kaam karta hai,
            rohit negi: sense bana rha hai ab,
            me:haa bhaiya maja aaya,
            bhaiya chaye pilao → reply: Bhai chai AI se nahi milti 😅
            kya kar rahe ho? → reply: Code likh rha hu bhai, aur tum?
            rohit negi:first thot principle ka use kroge to chize clear hogi jada
            
            rohit negi nexus course announce if anybody ask about rohit negi course or nexus course then reply according to this
            Course details 
            🧠 Course Summary: Web Development + Blockchain + DSA + System Design (LIVE & Recorded)
            Instructor: Rohit Negi | Start Date: 16 Sept 2024 | Live Timing: 9–10 PM (Mon–Fri)

            📌 Course Includes:
            Web Development (Beginner to Advanced)
            HTML, CSS, JS, React, TypeScript, Node, Express, MongoDB, Auth, WebSockets, WebRTC, APIs
            Industry Projects + Deployment

            Blockchain Development
            Fundamentals, Cryptography, Ethereum, Solana, Smart Contracts, Solidity, Rust
            Hands-on Projects + Deployment

            Data Structures & Algorithms (DSA)
            150+ hours of recorded content (C++ based)
            Covers STL, Recursion, OOPs, Trees, Graphs, DP, Backtracking & more
            300+ coding questions + Completion Certificate
            Beginner-friendly, No prerequisite needed

            System Design (Starting 7 July 2025)
            Covers HLD concepts, real-world architectures, and systems like Instagram, WhatsApp, Google Docs
            Includes Load Balancing, Caching, Scaling, API Gateway, CDN, Messaging Queues & more
            Career Support

            Resume & LinkedIn Optimization
            Discord Doubt Group
            3 Years Validity | Hinglish Language

            For queries: negibhairohit9@gmail.com
            Recordings available after each live class
            Max course max price is ₹8000 but on discout provide ₹5,500 currently but price min price when course start ₹4500 , 
           `,
          },
        ],
      },
    };

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.status}`);
    }

    const data = await res.json();
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a response."
    );
  };

  const saveToLocalStorage = (chat) =>
    localStorage.setItem("rohit-chat-history", JSON.stringify(chat));

  const clearChat = () => {
    if (confirm("Are you sure you want to delete all conversations?")) {
      setPromt([]);
      saveToLocalStorage([]);
      setReactions({});
      setChatStartTime(null);
      localStorage.removeItem("chat-start-time");
      localStorage.removeItem("chat-reactions");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("rohit-chat-history");
    if (saved) {
      try {
        setPromt(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to load chat history:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [promt, loading]);

  const themeClasses = darkMode
    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
    : "bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-800";

  useEffect(() => {
    localStorage.setItem("dark-mode", JSON.stringify(darkMode));
  }, [darkMode]);

  const downloadChat = () => {
    const blob = new Blob([JSON.stringify(promt, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rohit-chat-history.json";
    a.click();
  };

  const handleReact = (index, emoji) => {
    const updated = {
      ...reactions,
      [index]: emoji,
    };
    setReactions(updated);
    localStorage.setItem("chat-reactions", JSON.stringify(updated));
    setActiveReactionIndex(null);
  };

  useEffect(() => {
    const savedReactions = localStorage.getItem("chat-reactions");
    if (savedReactions) {
      setReactions(JSON.parse(savedReactions));
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        setShowEmoji((prev) => !prev); // Emoji Picker
      }

      if (e.ctrlKey && e.key === "d") {
        e.preventDefault();
        downloadChat(); // Download Chat
      }

      if (e.ctrlKey && e.key === "x") {
        e.preventDefault();
        setDarkMode((prev) => !prev); // Toggle Theme
      }

      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        clearChat(); // Clear/Delete Chat
      }

      if (e.ctrlKey && e.key === "m") {
        e.preventDefault();
        setVoiceOnlyMode((prev) => !prev); // Voice Mode
      }

      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        if (voiceOnlyMode) {
          handleVoiceInput(); // Start Voice Input
        }
      }

      if (e.key === "Enter" && !e.shiftKey && !voiceOnlyMode) {
        e.preventDefault();
        handleSendPrompt(); // Normal Send Message
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [voiceOnlyMode, darkMode, showEmoji, promt]);

  const togglePin = (msg) => {
    setPinned((prev) =>
      prev.some((p) => p.id === msg.id)
        ? prev.filter((p) => p.id !== msg.id)
        : [...prev, msg]
    );
  };

  useEffect(() => {
    if (promt.length > 0 && !chatStartTime) {
      const now = Date.now();
      setChatStartTime(now);
      localStorage.setItem("chat-start-time", now.toString());
    }
  }, [promt, chatStartTime]);

  useEffect(() => {
    if (!chatStartTime) return;

    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - chatStartTime) / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;

      setElapsedTime(`${minutes}m ${remainingSeconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [chatStartTime]);

  return (
    <div
      className={`min-h-screen font-sans transition-all duration-500 ${themeClasses}`}
    >
      <div className="max-w-4xl mx-auto p-2 md:p-4 h-screen flex flex-col">
        {/* Header */}
        <div
          className={`flex justify-between items-center select-none ${
            chatStartTime ? "mb-5" : "mb-3"
          } p-2 gap-1.5 md:p-4 bg-white/10 backdrop-blur-lg rounded-2xl border ${
            darkMode ? "border-white/10 " : "border-black/10"
          } shadow`}
        >
          <div className="flex items-center gap-1.5 md:gap-3">
            <img src={dp} alt="" className="rounded-full w-12 h-12" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-500 bg-clip-text text-transparent">
                Rohit
              </h1>
              <div className="flex items-center gap-1 text-xs opacity-70">
                <div
                  aria-label="success"
                  className="status status-success"
                ></div>{" "}
                <span>{loading ? "typing..." : "online"}</span>
              </div>
            </div>
          </div>

          {chatStartTime && (
            <div className="fixed top-16.5 md:top-20.5 font-semibold w-full right-0 text-xs text-gray-400 text-center mb-2">
              ⏱️Chat running :{" "}
              <span className="font-medium text-yellow-400">{elapsedTime}</span>
            </div>
          )}

          <div className="flex items-center gap-1">
            <div className="tooltip tooltip-bottom md:tooltip-top">
              <div className="tooltip-content">
                <div className="animate-bounce text-orange-400 text-[14px] font-medium">
                  Activate voice mode, and send msg
                </div>
              </div>
              <button
                onClick={() => setVoiceOnlyMode(!voiceOnlyMode)}
                className={`rounded-full cursor-pointer text-xs font-medium  border border-transparent transition-all duration-300 ${
                  voiceOnlyMode
                    ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                    : `${
                        darkMode
                          ? "text-white/30  hover:border-white/10"
                          : "text-black/40 hover:border-neutral/10"
                      }`
                }`}
              >
                <div className="flex items-center rounded-2xl py-1 px-2 gap-0.5 md:gap-1 text-[11px] md:text-[13px]">
                  {voiceOnlyMode ? (
                    <Zap className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                  <span className="">Voice Mode </span>
                </div>
              </button>
            </div>

            <div className="tooltip tooltip-bottom md:tooltip-top">
              <div className="tooltip-content">
                <div className="animate-bounce text-orange-400  text-[14px] font-medium">
                  Keyboard Shortcuts
                </div>
              </div>
              <button
                onClick={() => setShowShortcuts((prev) => !prev)}
                className={`md:flex items-center gap-1 border border-transparent cursor-pointer hidden rounded-2xl py-1 md:px-2 text-[10px] md:text-[13px] font-semibold ${
                  showShortcuts
                    ? "bg-gradient-to-r bg-green-500/10 text-green-500 shadow-lg "
                    : `${
                        darkMode
                          ? "text-white/30  hover:border-white/10 "
                          : "text-black/40 hover:border-neutral/10"
                      }`
                }`}
              >
                <Command className="w-4 h-4" />
                Shortcuts
              </button>
            </div>

            <div className="tooltip tooltip-bottom md:tooltip-top">
              <div className="tooltip-content">
                <div className="animate-bounce text-orange-400  text-[14px] font-medium">
                  Clear all chats!
                </div>
              </div>
              <button
                onClick={clearChat}
                className="p-2 cursor-pointer rounded-full hover:bg-rose-500 text-rose-400  hover:text-white transition-all duration-300"
                title="Clear all chats"
              >
                <Trash2 className="w-4 h-4 font-bold" />
              </button>
            </div>

            <div className="tooltip tooltip-bottom md:tooltip-top">
              <div className="tooltip-content">
                <div className="animate-bounce text-orange-400  text-[14px] font-medium">
                  Download chats
                </div>
              </div>
              <button
                onClick={downloadChat}
                className="p-2 rounded-full cursor-pointer text-green-500 hover:text-white hover:bg-green-500 transition-all duration-300"
                title="Download chat"
              >
                <ArrowDownToLine className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 cursor-pointer rounded-full  ${
                darkMode
                  ? "text-yellow-400 hover:bg-yellow-500 hover:text-white"
                  : "hover:bg-neutral text-black hover:text-white"
              }  transition-all duration-300`}
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col min-h-0">
          <div
            ref={scrollRef}
            className={`flex-1 overflow-y-auto scrollbar-none p-4 space-y-4 bg-white/5 backdrop-blur-lg rounded-2xl border ${
              darkMode
                ? "border-white/10  shadow-inner"
                : "shadow border-black/10"
            }`}
          >
            {pinned.length > 0 && (
              <div className="sticky -top-4 z-50 p-3 bg-yellow-100 rounded">
                <h3 className="font-bold text-sm mb-1">📌 Pinned</h3>
                <ul className="space-y-1 text-sm">
                  {pinned.map((p) => (
                    <li key={p.id}>{p.content}</li>
                  ))}
                </ul>
              </div>
            )}

            {promt.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">
                      Welcome to RohitGPT!
                    </h3>
                    <p className="text-sm opacity-70">
                      Start a conversation by typing a message below or use
                      voice input.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {promt.map((msg, idx) => (
              <div
                onClick={() =>
                  setActiveReactionIndex(
                    activeReactionIndex === idx ? null : idx
                  )
                }
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-white/20 rounded-br-md"
                      : "bg-white/90 text-gray-800 border-white/30 rounded-bl-md"
                  }`}
                >
                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              className="rounded-lg mt-2"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code
                              className="bg-gray-800 text-white px-1 py-0.5 rounded text-xs"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs opacity-70">{msg.timestamp}</div>
                    {msg.role === "model" && (
                      <div className="flex items-center gap-2">
                        <div className="relative text-sm text-gray-500">
                          <button className=" hover:text-purple-600">
                            {reactions[idx] ? `${reactions[idx]}` : ""}
                          </button>

                          {activeReactionIndex === idx && (
                            <div className="absolute top-8 -right-25 p-4 rounded-lg select-none flex gap-3 z-10">
                              {["👍", "❤️", "😂", "🥲", "😁", "😎"].map(
                                (emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleReact(idx, emoji)}
                                    className="text-sm md:text-lg hover:scale-130 transition"
                                  >
                                    {emoji}
                                  </button>
                                )
                              )}
                              <button
                                onClick={() => handleReact(idx, "")}
                                className="hover:scale-130 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(msg);
                          }}
                          className="text-yellow-500 text-sm hover:scale-110 transition"
                        >
                          📌
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(msg.content, idx);
                          }}
                          className="p-1 rounded-full hover:bg-gray-400/20  transition-all duration-200"
                          disabled={
                            activeSpeakerIndex !== null &&
                            activeSpeakerIndex !== idx
                          }
                        >
                          {activeSpeakerIndex === idx ? (
                            <Volume2 className="w-4 h-4 text-green-600 active:scale-95" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(msg.content);
                          }}
                          className="p-1 rounded hover:text-green-700 active:scale-95 hover:bg-gray-400/20  transition-all duration-200"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {showShortcuts && (
              <WelcomeShortcutsModal
                onClose={() => setShowShortcuts(false)}
                darkMode={darkMode}
              />
            )}

            {loading && (
              <div className="flex justify-start pl-2">
                <span className="loading loading-dots loading-lg"></span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className={`mt-4 relative`}>
            <div
              className={`bg-white/10 backdrop-blur-lg rounded-2xl border ${
                darkMode ? "border-white/10 " : "border-black/10"
              } shadow p-4`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 cursor-pointer"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <div className="flex-1 relative pt-1.5">
                  <textarea
                    ref={textareaRef}
                    className={`w-full bg-white/10 backdrop-blur-sm rounded-xl border  px-4 py-3 text-sm ${
                      darkMode
                        ? "placeholder-white/50 border-white/10"
                        : "placeholder-black/50 border-black/5 "
                    } focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none transition-all duration-200`}
                    placeholder="Type your message"
                    value={input}
                    autoFocus
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendPrompt();
                      }
                    }}
                    disabled={loading}
                    rows={1}
                    style={{ minHeight: "44px", maxHeight: "120px" }}
                  />
                </div>

                <button
                  onClick={handleVoiceInput}
                  className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isListening
                      ? "bg-red-500 text-white shadow-lg"
                      : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {isListening ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                <button
                  onClick={() => handleSendPrompt()}
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showEmoji && (
              <div className="absolute bottom-full mb-2 left-4 z-50">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setInput((prev) => prev + emojiData.emoji);
                      setShowEmoji(false);
                      textareaRef.current?.focus();
                    }}
                    height={350}
                    width={300}
                    searchDisabled={false}
                    skinTonesDisabled={true}
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
