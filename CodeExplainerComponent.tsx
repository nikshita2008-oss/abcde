import React, { useState } from "react";
import { CodeAnalysisData } from "../types";
import { Sparkles, Code, BookOpen, Layers, ShieldAlert, Cpu, AlertCircle, RefreshCw, Copy, Check } from "lucide-react";

export default function CodeExplainerComponent() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  
  const [analysisData, setAnalysisData] = useState<CodeAnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "algo" | "bugs" | "opts">("analysis");
  const [copiedCode, setCopiedCode] = useState(false);
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

  const handleExplainCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysisData(null);

    try {
      const response = await fetch("/api/explain-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), language, simplicityMode }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to analyze code structure.");
      }

      const data = await response.json();
      setAnalysisData(data);
      setActiveTab("analysis");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during code review.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const sampleCodes: Record<string, string> = {
    Python: `def binary_search(arr, low, high, x):
    if high >= low:
        mid = (high + low) // 2
        if arr[mid] == x:
            return mid
        elif arr[mid] > x:
            return binary_search(arr, low, mid - 1, x)
        else:
            return binary_search(arr, mid + 1, high, x)
    else:
        return -1`,
    C: `#include <stdio.h>

void bubbleSort(int array[], int size) {
  for (int step = 0; step < size - 1; ++step) {
    for (int i = 0; i < size - step - 1; ++i) {
      if (array[i] > array[i + 1]) {
        int temp = array[i];
        array[i] = array[i + 1];
        array[i + 1] = temp;
      }
    }
  }
}`
  };

  const loadSample = (lang: string) => {
    setLanguage(lang);
    setCode(sampleCodes[lang] || "");
  };

  return (
    <div id="code-explainer-container" className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-210px)] overflow-hidden">
      {/* Code Input (left column) */}
      <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 p-6 shadow-xs overflow-hidden">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-semibold text-slate-900 text-base">AI Code Explainer</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => loadSample("Python")}
              className="text-[10px] font-mono px-2 py-1 border border-slate-200 hover:border-slate-300 rounded text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              Sample Python
            </button>
            <button
              onClick={() => loadSample("C")}
              className="text-[10px] font-mono px-2 py-1 border border-slate-200 hover:border-slate-300 rounded text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              Sample C
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4 shrink-0">
          Paste any script (Python, C, Java, etc.) to decrypt logic, algorithms, errors, and optimizations.
        </p>

        <form onSubmit={handleExplainCode} className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste code snippet here..."
              required
              className="w-full flex-1 p-4 text-xs font-mono bg-slate-900 text-slate-100 border border-slate-800 focus:outline-hidden rounded-xl resize-none overflow-y-auto mb-4"
            />
            {code && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="absolute right-3 top-3 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-lg transition-all"
                title="Copy pasted code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="shrink-0 space-y-4">
            {/* Simplicity Mode Alert Block */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1">
                {simplicityMode === "buddy" && <><span>🍕</span> Everyday Buddy Explainer</>}
                {simplicityMode === "scholar" && <><span>🎓</span> Deep Scholar Explainer</>}
                {simplicityMode === "teacher" && <><span>🏫</span> Clear Teacher Explainer</>}
              </p>
              <p className="text-slate-500 leading-normal">
                {simplicityMode === "buddy" && "Code walkthroughs and bug descriptions will use simple everyday concepts (like a traffic light for concurrency)."}
                {simplicityMode === "scholar" && "Code reviews will use standard architectural terminology, compiler optimization theory, and time complexities."}
                {simplicityMode === "teacher" && "Code explanations will be written in simple, clear, easy-to-understand plain English."}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-1/3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-hidden transition-all text-slate-800 font-medium"
              >
                <option value="Python">Python</option>
                <option value="C">C Language</option>
                <option value="C++">C++</option>
                <option value="Java">Java</option>
                <option value="JavaScript">JavaScript</option>
                <option value="SQL">SQL</option>
                <option value="HTML/CSS">HTML/CSS</option>
                <option value="Detect">Detect Automatically</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-medium transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Decoding code logic...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Explain Code Logic</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      </div>

      {/* Code Analysis Output (right column) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
        {/* Tab selection */}
        <div className="flex items-center px-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex gap-4">
            <button
              onClick={() => { if (analysisData) setActiveTab("analysis"); }}
              disabled={!analysisData}
              className={`py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "analysis" && analysisData
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Explanation & Logic
            </button>
            <button
              onClick={() => { if (analysisData) setActiveTab("algo"); }}
              disabled={!analysisData}
              className={`py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "algo" && analysisData
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Algorithm & Complexity
            </button>
            <button
              onClick={() => { if (analysisData) setActiveTab("bugs"); }}
              disabled={!analysisData}
              className={`py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "bugs" && analysisData
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Errors & Risks
            </button>
            <button
              onClick={() => { if (analysisData) setActiveTab("opts"); }}
              disabled={!analysisData}
              className={`py-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === "opts" && analysisData
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Optimizations
            </button>
          </div>
        </div>

        {/* Display Container */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/20">
          {error && (
            <div className="max-w-xl mx-auto px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="relative mb-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h4 className="font-semibold text-slate-700 text-sm">Reviewing Code Compilation</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Parsing structures, compiling abstract syntax trees, identifying potential buffer overflows or syntax warnings, and designing optimizers...
              </p>
            </div>
          ) : analysisData ? (
            <div className="max-w-2xl mx-auto space-y-4 pb-10">
              {activeTab === "analysis" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-sm mb-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      Abstract Function
                    </span>
                    <h4 className="font-display font-bold text-slate-900 text-sm mb-2">What this code does:</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{analysisData.explanation}</p>
                  </div>

                  <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs">
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded-sm mb-2">
                      <Layers className="w-3.5 h-3.5" />
                      Control Flow
                    </span>
                    <h4 className="font-display font-bold text-slate-900 text-sm mb-2">Detailed Line-by-Line Logic:</h4>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">{analysisData.logic}</p>
                  </div>
                </div>
              )}

              {activeTab === "algo" && (
                <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs animate-fade-in space-y-3">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm">
                    <Cpu className="w-3.5 h-3.5" />
                    Complexity Report
                  </span>
                  <h4 className="font-display font-bold text-slate-900 text-sm">Algorithm & Big-O analysis:</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{analysisData.algorithm}</p>
                </div>
              )}

              {activeTab === "bugs" && (
                <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs animate-fade-in space-y-3">
                  <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-sm">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Bug Report
                  </span>
                  <h4 className="font-display font-bold text-slate-900 text-sm">Potential Bugs, Edge Cases, or Warnings:</h4>
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    analysisData.errors.toLowerCase().includes("no immediate") || analysisData.errors.toLowerCase() === "none"
                      ? "bg-green-50/50 border-green-100 text-green-800"
                      : "bg-red-50/30 border-red-100 text-red-800"
                  }`}>
                    {analysisData.errors}
                  </div>
                </div>
              )}

              {activeTab === "opts" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-display font-bold text-slate-900 text-base">Recommended Improvements</h4>
                    <p className="text-[11px] text-slate-400">Actionable modifications to boost performance and clear styling guidelines</p>
                  </div>
                  <div className="space-y-3.5">
                    {analysisData.improvements.length === 0 ? (
                      <div className="text-center p-6 border border-dashed border-slate-200 text-slate-400 text-xs rounded-2xl bg-white">
                        No immediate refactoring necessary! Excellent code quality.
                      </div>
                    ) : (
                      analysisData.improvements.map((opt, index) => (
                        <div key={index} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs flex gap-3 items-start">
                          <span className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center font-mono text-[10px] font-bold text-indigo-600 shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-xs text-slate-600 leading-relaxed font-medium">
                            {opt}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Code className="w-12 h-12 text-slate-200 mb-3" />
              <h4 className="font-semibold text-slate-600 text-sm">Analysis Board</h4>
              <p className="text-xs max-w-xs mt-1">
                Enter your code block on the left and hit explain to review algorithm complexities, Big-O metrics, vulnerabilities, and line-by-line logical logs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
