import React, { useState, useRef, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sun,
  Moon,
  Send,
  Smile,
  Trash2,
  MessageCircle,
  Zap,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

const GEMINI_API_KEY = "AIzaSyB11RNtdp9C4jrO3GYA_fDN_riT3MehRu4"; // Replace with your actual key
const ELEVEN_LABS_API_KEY =
  "sk_3cf482af50699721277654a122c016b940a1f7df7f9c9749";
const VOICE_ID = "zs7UfyHqCCmny7uTxCYi";

function App() {
  const [input, setInput] = useState("");
  const [promt, setPromt] = useState([]);
  const [loading, setLoading] = useState(false);
  const [voiceOnlyMode, setVoiceOnlyMode] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeSpeakerIndex, setActiveSpeakerIndex] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

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
            text: `You are a male and named is  Rohit who speaks in Hinglish. You call when you explain somthing after that chamka, bhai,are yrr, to chaliye suru krte hai,
            these are word which rohit negi use when he speak mostly time

            keywords: which rohit negi use in his conversation mostly
            ab toh bhai,
            behind the scene chize kese kaam krti hai
            are bhai,
            dekho bhai,
            sense bana rha hai aapko,
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

  return (
    <div
      className={`min-h-screen font-sans transition-all duration-500 ${themeClasses}`}
    >
      <div className="max-w-4xl mx-auto p-4 h-screen flex flex-col">
        {/* Header */}
        <div
          className={`flex justify-between items-center mb-6 p-4 bg-white/10 backdrop-blur-lg rounded-2xl border ${
            darkMode ? "border-white/10 " : "border-black/10"
          } shadow`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                RohitGPT
              </h1>
              <div className="flex items-center gap-1 text-xs opacity-70">
                <div
                  aria-label="success"
                  className="status status-success"
                ></div>{" "}
                <span>Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="tooltip">
              <div className="tooltip-content">
                <div className="animate-bounce text-orange-400  text-[14px] font-black">
                  Click it to activate, then send msg
                </div>
              </div>
              <button
                onClick={() => setVoiceOnlyMode(!voiceOnlyMode)}
                className={`px-2  md:px-4 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                  voiceOnlyMode
                    ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg"
                    : "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                }`}
              >
                <div className="flex items-center gap-1 md:gap-2 text-[10px] md:text-[12px]">
                  {voiceOnlyMode ? (
                    <Zap className="w-3 h-3" />
                  ) : (
                    <Mic className="w-3 h-3 md:w-4 md:h-4" />
                  )}
                  Voice Mode
                </div>
              </button>
            </div>

            <div className="tooltip">
              <div className="tooltip-content">
                <div className="animate-bounce text-orange-400  text-[14px] font-black">
                  Clear all chats!
                </div>
              </div>
              <button
                onClick={clearChat}
                className="p-2 rounded-full bg-white/20 hover:bg-red-500/20 transition-all duration-300 backdrop-blur-sm"
                title="Clear all chats"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
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
            className={`flex-1 overflow-y-auto p-4 space-y-4 bg-white/5 backdrop-blur-lg rounded-2xl border ${
              darkMode
                ? "border-white/10  shadow-inner"
                : "shadow border-black/10"
            }`}
          >
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
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 hover:shadow-xl ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white border-white/20 rounded-br-md"
                      : "bg-white/90 text-gray-800 border-white/30 rounded-bl-md"
                  }`}
                >
                  <div className="text-sm leading-relaxed">{msg.content}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs opacity-70">{msg.timestamp}</div>
                    {msg.role === "model" && (
                      <button
                        onClick={() => speakText(msg.content, idx)}
                        className="p-1 rounded-full hover:bg-white/20 transition-all duration-200"
                        disabled={
                          activeSpeakerIndex !== null &&
                          activeSpeakerIndex !== idx
                        }
                      >
                        {activeSpeakerIndex === idx ? (
                          <div className="flex gap-1 items-center">
                            <div className="w-1 h-3 bg-blue-500 animate-pulse rounded-full" />
                            <div className="w-1 h-4 bg-blue-500 animate-pulse delay-100 rounded-full" />
                            <div className="w-1 h-3 bg-blue-500 animate-pulse delay-200 rounded-full" />
                          </div>
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/90 p-4 rounded-2xl rounded-bl-md shadow-lg backdrop-blur-sm border border-white/30">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
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
                  className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <div className="flex-1 relative pt-1.5">
                  <textarea
                    ref={textareaRef}
                    className={`w-full bg-white/10 backdrop-blur-sm rounded-xl border  px-4 py-3 text-sm ${
                      darkMode
                        ? "placeholder-white/50 border-white/10"
                        : "placeholder-black/50 border-black/5"
                    } focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none transition-all duration-200`}
                    placeholder="Type your message here..."
                    value={input}
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
                  className={`p-2 rounded-full transition-all duration-300 ${
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
                  className="p-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
