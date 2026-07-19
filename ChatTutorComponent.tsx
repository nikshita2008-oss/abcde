import React, { useState, useEffect, useRef } from "react";
import { ChatMessage } from "../types";
import { Send, Sparkles, User, HelpCircle, Volume2, Mic, MicOff, AlertCircle } from "lucide-react";

export default function ChatTutorComponent() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("studymate_chat_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: "welcome",
        role: "model",
        text: "Hi there! I am your StudyMate AI Tutor. Ask me any question on mathematics, computer science, history, physics, or any other academic topic, and I'll explain it simply with clear examples!",
        timestamp: new Date(),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [simplicityMode, setSimplicityMode] = useState(() => {
    return localStorage.getItem("studymate_simplicity_mode") || "teacher";
  });

  useEffect(() => {
    const handleModeChange = () => {
      setSimplicityMode(localStorage.getItem("studymate_simplicity_mode") || "teacher");
    };
    window.addEventListener("studymate_mode_changed", handleModeChange);
    return () => window.removeEventListener("studymate_mode_changed", handleModeChange);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    localStorage.setItem("studymate_chat_history", JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Web Speech API for voice input recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError(`Speech recognition error: ${event.error}. Try typing!`);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError("Speech recognition is not supported in this browser or environment.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    setError(null);
    const userText = input.trim();
    setInput("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages.slice(-10).map((m) => ({ role: m.role, text: m.text })),
          simplicityMode: simplicityMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to contact academic server.");
      }

      const data = await response.json();
      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        role: "model",
        text: data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, tutorMsg]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while chatting.");
    } finally {
      setLoading(false);
    }
  };

  // Web Speech synthesis to read tutor explanations
  const speakText = (text: string, msgId: string) => {
    if ("speechSynthesis" in window) {
      if (speakingMsgId === msgId) {
        window.speechSynthesis.cancel();
        setSpeakingMsgId(null);
        return;
      }

      window.speechSynthesis.cancel(); // Stop any current speaking
      
      // Strip markdown tags simple regex
      const cleanText = text
        .replace(/[*#`_\-]/g, "")
        .replace(/\[.*?\]\(.*?\)/g, "");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => {
        setSpeakingMsgId(null);
      };
      utterance.onerror = () => {
        setSpeakingMsgId(null);
      };

      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      setError("Text-to-speech is not supported in this browser.");
    }
  };

  // Stop talking on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your chat history with StudyMate?")) {
      setMessages([
        {
          id: "welcome",
          role: "model",
          text: "Hi there! I am your StudyMate AI Tutor. Ask me any question on mathematics, computer science, history, physics, or any other academic topic, and I'll explain it simply with clear examples!",
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div id="chat-tutor-container" className="flex flex-col h-[calc(100vh-210px)] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-slate-900">AI Chat Tutor</h3>
            <p className="text-xs text-slate-500">Instant explanations, analogies, and student support</p>
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
        >
          Clear History
        </button>
      </div>

      {/* Persona Active Banner */}
      <div className="px-6 py-2 border-b border-slate-100 flex items-center justify-between text-xs transition-all duration-300">
        {simplicityMode === "buddy" && (
          <div className="flex items-center gap-2 text-amber-800 bg-amber-50/50 px-3 py-1.5 rounded-xl border border-amber-100/40 w-full">
            <span className="text-sm">🍕</span>
            <span><strong>Everyday Buddy Mode Active</strong>: Explanations will use funny, relatable real-world metaphors with zero academic jargon!</span>
          </div>
        )}
        {simplicityMode === "scholar" && (
          <div className="flex items-center gap-2 text-purple-800 bg-purple-50/50 px-3 py-1.5 rounded-xl border border-purple-100/40 w-full">
            <span className="text-sm">🎓</span>
            <span><strong>Deep Scholar Mode Active</strong>: Explanations will retain rigorous, professional college-level terminology and deep insights.</span>
          </div>
        )}
        {simplicityMode === "teacher" && (
          <div className="flex items-center gap-2 text-indigo-800 bg-indigo-50/50 px-3 py-1.5 rounded-xl border border-indigo-100/40 w-full">
            <span className="text-sm">🏫</span>
            <span><strong>Clear Teacher Mode Active</strong>: Explanations will use simple, plain English for average human understanding.</span>
          </div>
        )}
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : "AI"}
              </div>
              <div className="flex flex-col gap-1">
                <div
                  className={`px-4 py-3 rounded-2xl shadow-xs text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-tr-none"
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>
                <div className={`flex items-center gap-2 mt-1 text-[10px] text-slate-400 ${isUser ? "justify-end" : "justify-start"}`}>
                  <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {!isUser && (
                    <button
                      onClick={() => speakText(msg.text, msg.id)}
                      className={`p-1 hover:bg-slate-100 rounded-md transition-all ${
                        speakingMsgId === msg.id ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-slate-600"
                      }`}
                      title={speakingMsgId === msg.id ? "Stop reading" : "Read aloud"}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold animate-pulse">
              AI
            </div>
            <div className="px-4 py-3 bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-none shadow-xs text-sm flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Tutor is drafting an explanation...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 my-2 px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="px-6 py-4 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl border transition-all ${
              isListening
                ? "bg-red-50 border-red-200 text-red-600 animate-pulse"
                : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
            title={isListening ? "Stop voice listening" : "Ask using your voice"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening to your voice..." : "Ask your virtual tutor a question (e.g. 'How do neural networks learn?')..."}
            disabled={isListening}
            className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-hidden transition-all text-slate-800 placeholder-slate-400"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-medium transition-all shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>AI responses are tailored for study and homework guidance.</span>
          </div>
          {isListening && <span className="text-red-500 font-medium animate-pulse">Speak now...</span>}
        </div>
      </form>
    </div>
  );
}
