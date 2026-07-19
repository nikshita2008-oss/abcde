import React, { useState } from "react";
import { SummaryData } from "../types";
import { Sparkles, FileText, CheckCircle, BookOpen, AlertCircle, RefreshCw, Copy, Check } from "lucide-react";

export default function SummarizerComponent() {
  const [inputText, setInputText] = useState("");
  const [length, setLength] = useState("detailed");
  
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "points" | "vocab">("summary");
  const [copied, setCopied] = useState(false);
  const [checkedPoints, setCheckedPoints] = useState<Record<number, boolean>>({});
  const [simplicityMode, setSimplicityMode] = useState(() => {
    return localStorage.getItem("studymate_simplicity_mode") || "teacher";
  });

  React.useEffect(() => {
    const handleModeChange = () => {
      setSimplicityMode(localStorage.getItem("studymate_simplicity_mode") || "teacher");
    };
    window.addEventListener("studymate_mode_changed", handleModeChange);
    return () => window.removeEventListener("studymate_mode_changed", handleModeChange);
  }, []);

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setSummaryData(null);
    setCheckedPoints({});

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText.trim(), length, simplicityMode }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to parse text and summarize.");
      }

      const data = await response.json();
      setSummaryData(data);
      setActiveTab("summary");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during summarization.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!summaryData) return;
    let textToCopy = "";
    if (activeTab === "summary") {
      textToCopy = summaryData.summary;
    } else if (activeTab === "points") {
      textToCopy = summaryData.keyPoints.map((p) => `• ${p}`).join("\n");
    } else if (activeTab === "vocab") {
      textToCopy = summaryData.definitions.map((d) => `${d.term}: ${d.definition}`).join("\n");
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePointCheck = (idx: number) => {
    setCheckedPoints((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div id="summarizer-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-210px)] overflow-hidden">
      {/* Input panel (1/3 width) */}
      <div className="lg:col-span-1 flex flex-col h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xs overflow-hidden">
        <div className="flex items-center gap-2 mb-4 shrink-0">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="font-display font-semibold text-slate-900 text-base">Text Summarizer</h3>
        </div>

        <p className="text-xs text-slate-500 mb-4 shrink-0">
          Paste textbook paragraphs, research papers, or articles to distill complex details.
        </p>

        <form onSubmit={handleSummarize} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste study materials or textbook passages here (minimum 2-3 sentences)..."
              required
              className="w-full flex-1 p-4 text-sm bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-hidden transition-all text-slate-800 placeholder-slate-400 resize-none overflow-y-auto mb-4 min-h-[150px]"
            />
          </div>

          <div className="shrink-0 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Summary Style
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-4 py-2 text-sm bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-hidden transition-all text-slate-800"
              >
                <option value="brief">Brief (Concise outline & vocabulary)</option>
                <option value="detailed">Detailed (Thorough walk-through & takeaways)</option>
              </select>
            </div>

            {/* Simplicity Mode Alert Block */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1">
                {simplicityMode === "buddy" && <><span>🍕</span> Everyday Buddy Summaries</>}
                {simplicityMode === "scholar" && <><span>🎓</span> Deep Scholar Summaries</>}
                {simplicityMode === "teacher" && <><span>🏫</span> Clear Teacher Summaries</>}
              </p>
              <p className="text-slate-500 leading-normal">
                {simplicityMode === "buddy" && "Synthesized summaries and bullet points will use funny comparisons and simple conversational sentences."}
                {simplicityMode === "scholar" && "Summaries will keep original high-level jargon and highlight advanced theoretical mechanics."}
                {simplicityMode === "teacher" && "Summaries will be written in highly clear, easy-to-digest plain English."}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-medium transition-all shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Summary...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Summarize Content</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Output Display (2/3 width) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => { if (summaryData) setActiveTab("summary"); }}
              disabled={!summaryData}
              className={`py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "summary" && summaryData
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Executive Summary
            </button>
            <button
              onClick={() => { if (summaryData) setActiveTab("points"); }}
              disabled={!summaryData}
              className={`py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "points" && summaryData
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Key Takeaways
            </button>
            <button
              onClick={() => { if (summaryData) setActiveTab("vocab"); }}
              disabled={!summaryData}
              className={`py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "vocab" && summaryData
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Vocabulary Gloss ({summaryData?.definitions.length || 0})
            </button>
          </div>

          {summaryData && (
            <button
              onClick={handleCopyText}
              className="p-1.5 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 bg-white rounded-lg transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Copy active tab content"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Tab"}</span>
            </button>
          )}
        </div>

        {/* Output Sheet */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/20">
          {error && (
            <div className="max-w-xl mx-auto px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="relative mb-4 animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <h4 className="font-semibold text-slate-700 text-sm">Distilling Dense Material</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Parsing terminology, analyzing syntax, and synthesizing summaries, key concepts, and jargon glossaries...
              </p>
            </div>
          ) : summaryData ? (
            <div className="max-w-2xl mx-auto pb-10">
              {activeTab === "summary" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-display font-bold text-slate-900 text-base">Executive Synthesis</h4>
                    <p className="text-[11px] text-slate-400">Cohesive paragraph outline of the study source</p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed bg-white p-5 border border-slate-100 rounded-2xl shadow-xs">
                    {summaryData.summary}
                  </p>
                </div>
              )}

              {activeTab === "points" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-display font-bold text-slate-900 text-base">Core Takeaway Checklist</h4>
                    <p className="text-[11px] text-slate-400">Tick items off once you understand them</p>
                  </div>
                  <div className="space-y-3">
                    {summaryData.keyPoints.map((pt, idx) => {
                      const isChecked = !!checkedPoints[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => togglePointCheck(idx)}
                          className={`p-4 border rounded-xl cursor-pointer transition-all flex items-start gap-3 bg-white hover:border-slate-300 ${
                            isChecked ? "border-green-100 bg-green-50/20 text-slate-500" : "border-slate-100 text-slate-700"
                          }`}
                        >
                          <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isChecked ? "bg-green-600 border-green-600 text-white" : "border-slate-300 bg-white"
                          }`}>
                            {isChecked && <Check className="w-3 h-3 stroke-[3px]" />}
                          </div>
                          <span className={`text-xs font-medium leading-relaxed ${isChecked ? "line-through opacity-60" : ""}`}>
                            {pt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "vocab" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-display font-bold text-slate-900 text-base">Technical Glossary</h4>
                    <p className="text-[11px] text-slate-400">Crucial terms, definitions, and acronyms extracted</p>
                  </div>
                  
                  {summaryData.definitions.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                      No advanced terminologies detected.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {summaryData.definitions.map((item, idx) => (
                        <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs flex flex-col justify-between">
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm mb-2">
                              <BookOpen className="w-3 h-3" />
                              Concept
                            </span>
                            <h5 className="font-display font-bold text-slate-900 text-xs tracking-tight mb-1">
                              {item.term}
                            </h5>
                            <p className="text-slate-500 text-[11px] leading-relaxed">
                              {item.definition}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <FileText className="w-12 h-12 text-slate-200 mb-3" />
              <h4 className="font-semibold text-slate-600 text-sm">Summary Display Arena</h4>
              <p className="text-xs max-w-xs mt-1">
                Paste dense articles or text on the left hand menu and hit Summarize to view distilled executive insights, points, and dictionary glossary.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
