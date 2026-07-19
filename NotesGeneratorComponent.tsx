import React, { useState, useEffect } from "react";
import { FileText, Copy, Download, Sparkles, AlertCircle, RefreshCw, Check } from "lucide-react";

interface SavedNote {
  id: string;
  topic: string;
  subject: string;
  content: string;
  timestamp: string;
}

export default function NotesGeneratorComponent() {
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>(() => {
    const saved = localStorage.getItem("studymate_saved_notes");
    return saved ? JSON.parse(saved) : [];
  });
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
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

  useEffect(() => {
    localStorage.setItem("studymate_saved_notes", JSON.stringify(savedNotes));
  }, [savedNotes]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setNotes(null);

    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, subject, simplicityMode }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate notes from academic server.");
      }

      const data = await response.json();
      setNotes(data.notes);

      // Save to history
      const newNote: SavedNote = {
        id: `note-${Date.now()}`,
        topic: topic.trim(),
        subject: subject.trim() || "General Study",
        content: data.notes,
        timestamp: new Date().toLocaleDateString(),
      };

      setSavedNotes((prev) => [newNote, ...prev]);
      setActiveNoteId(newNote.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while generating notes.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!notes) return;
    navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!notes) return;
    const element = document.createElement("a");
    const file = new Blob([notes], { type: "text/plain;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `${topic.replace(/\s+/g, "_")}_notes.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const selectSavedNote = (note: SavedNote) => {
    setNotes(note.content);
    setTopic(note.topic);
    setSubject(note.subject);
    setActiveNoteId(note.id);
  };

  const deleteSavedNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      setNotes(null);
      setTopic("");
      setSubject("");
      setActiveNoteId(null);
    }
  };

  return (
    <div id="notes-generator-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-210px)] overflow-hidden">
      {/* Side Control panel */}
      <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-semibold text-slate-900 text-base">Generate Study Notes</h3>
          </div>
          
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Topic Name *
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Operating Systems - Deadlocks"
                required
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-hidden transition-all text-slate-800"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Subject (Optional)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-hidden transition-all text-slate-800"
              />
            </div>

            {/* Simplicity Mode Alert Block */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1">
                {simplicityMode === "buddy" && <><span>🍕</span> Everyday Buddy Notes</>}
                {simplicityMode === "scholar" && <><span>🎓</span> Deep Scholar Notes</>}
                {simplicityMode === "teacher" && <><span>🏫</span> Clear Teacher Notes</>}
              </p>
              <p className="text-slate-500 leading-normal">
                {simplicityMode === "buddy" && "Notes will use a casual, highly relatable study-buddy tone with simple real-world metaphors like pizza or cars."}
                {simplicityMode === "scholar" && "Notes will utilize college-level terminology, theoretical mechanics, and advanced exam-focus detail."}
                {simplicityMode === "teacher" && "Notes will be generated in plain, clean English for easy average human understanding."}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-medium transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Drafting Academic Notes...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Generate Notes</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History of Saved Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex-1 shadow-xs overflow-hidden flex flex-col">
          <h4 className="font-display font-semibold text-slate-800 text-sm mb-3">Saved Notes Library</h4>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {savedNotes.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl p-4 text-center">
                <FileText className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">No notes generated yet.</p>
              </div>
            ) : (
              savedNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => selectSavedNote(note)}
                  className={`group p-3 border rounded-xl cursor-pointer transition-all flex items-start justify-between gap-2 ${
                    activeNoteId === note.id
                      ? "border-indigo-500 bg-indigo-50/50"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 text-xs truncate">{note.topic}</p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono font-medium truncate">{note.subject}</span>
                      <span>•</span>
                      <span>{note.timestamp}</span>
                    </p>
                  </div>
                  <button
                    onClick={(e) => deleteSavedNote(note.id, e)}
                    className="text-slate-300 hover:text-red-500 p-1 rounded-md hover:bg-white/80 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete notes"
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Content Display Panel */}
      <div className="lg:col-span-2 flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Study Sheet Reader</span>
          </h3>
          {notes && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg bg-white transition-all flex items-center gap-1.5"
                title="Copy markdown content"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 hover:border-slate-300 text-slate-600 rounded-lg bg-white transition-all flex items-center gap-1.5"
                title="Download as TXT file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download TXT</span>
              </button>
            </div>
          )}
        </div>

        {/* Display Sheet */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/20">
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h4 className="font-semibold text-slate-700 text-sm">Synthesizing Notes from Textbooks</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Our AI tutor is checking computer science references to structure key points, exam details, and analogies.
              </p>
            </div>
          ) : notes ? (
            <div className="markdown-body text-slate-700 text-sm max-w-3xl mx-auto pb-10">
              {/* Parse headers dynamically for custom beautiful header block */}
              <div className="border-b border-slate-100 pb-4 mb-6">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-sm">
                  {subject || "General Study Sheet"}
                </span>
                <h1 className="font-display font-extrabold text-2xl text-slate-900 mt-2 mb-1 tracking-tight">
                  {topic}
                </h1>
                <p className="text-xs text-slate-400">Generated on demand by StudyMate AI</p>
              </div>
              
              {/* Replace markdown code blocks with nicely colored code segments in JSX if we want, but since standard .markdown-body css styling handles it perfectly, we can just split and parse, or just render as a clean readable format. Because we set up .markdown-body CSS perfectly in src/index.css, this will render beautifully! */}
              {notes.split("\n").map((line, i) => {
                // Simple parsing helper for markdown rendering inside React safely without importing heavy libraries
                if (line.startsWith("# ")) {
                  return <h1 key={i} className="font-display font-bold text-xl text-slate-900 mt-6 mb-3 border-b border-slate-100 pb-1">{line.slice(2)}</h1>;
                } else if (line.startsWith("## ")) {
                  return <h2 key={i} className="font-display font-semibold text-lg text-slate-900 mt-5 mb-2">{line.slice(3)}</h2>;
                } else if (line.startsWith("### ")) {
                  return <h3 key={i} className="font-display font-semibold text-base text-slate-800 mt-4 mb-1.5">{line.slice(4)}</h3>;
                } else if (line.startsWith("- ") || line.startsWith("* ")) {
                  return (
                    <ul key={i} className="list-disc ml-6 mb-2 text-slate-700">
                      <li>{line.slice(2)}</li>
                    </ul>
                  );
                } else if (line.startsWith("> ")) {
                  return (
                    <blockquote key={i} className="border-l-4 border-indigo-500 pl-4 py-1 my-3 bg-indigo-50/30 rounded-r-lg text-slate-600 italic">
                      {line.slice(2)}
                    </blockquote>
                  );
                } else if (line.trim() === "") {
                  return <div key={i} className="h-2"></div>;
                } else {
                  // Standard line, make bolding work simply
                  let content: React.ReactNode = line;
                  if (line.includes("**")) {
                    const parts = line.split("**");
                    content = parts.map((part, index) => index % 2 === 1 ? <strong key={index} className="text-slate-900 font-semibold">{part}</strong> : part);
                  }
                  return <p key={i} className="mb-2.5 leading-relaxed text-slate-600">{content}</p>;
                }
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <FileText className="w-12 h-12 text-slate-200 mb-3" />
              <h4 className="font-semibold text-slate-600 text-sm">Study Sheet Viewer</h4>
              <p className="text-xs max-w-xs mt-1">
                Enter a topic name in the control panel to generate an exam-focused study guide instantly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
