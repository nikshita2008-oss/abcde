import React, { useState, useEffect } from "react";
import { StudyPlanData } from "../types";
import { Sparkles, Calendar, Plus, Trash2, CheckCircle2, Clock, Book, AlertCircle, RefreshCw, Check } from "lucide-react";

export default function StudyPlannerComponent() {
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [duration, setDuration] = useState("4 weeks");
  const [examDate, setExamDate] = useState("");
  const [dailyHours, setDailyHours] = useState("2");
  
  const [planData, setPlanData] = useState<StudyPlanData | null>(() => {
    const saved = localStorage.getItem("studymate_active_plan");
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("studymate_completed_plan_tasks");
    return saved ? JSON.parse(saved) : {};
  });
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
    if (planData) {
      localStorage.setItem("studymate_active_plan", JSON.stringify(planData));
    } else {
      localStorage.removeItem("studymate_active_plan");
    }
  }, [planData]);

  useEffect(() => {
    localStorage.setItem("studymate_completed_plan_tasks", JSON.stringify(completedTasks));
  }, [completedTasks]);

  const addSubject = () => {
    if (!subjectInput.trim()) return;
    if (subjects.includes(subjectInput.trim())) return;
    setSubjects((prev) => [...prev, subjectInput.trim()]);
    setSubjectInput("");
  };

  const removeSubject = (sub: string) => {
    setSubjects((prev) => prev.filter((s) => s !== sub));
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subjects.length === 0) {
      setError("Please add at least one subject to plan.");
      return;
    }

    setLoading(true);
    setError(null);
    setPlanData(null);
    setCompletedTasks({});

    try {
      const response = await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          availableTime: duration,
          examDate: examDate ? new Date(examDate).toLocaleDateString() : "Flexible Deadline",
          dailyHours: `${dailyHours} Hours`,
          simplicityMode,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to organize academic planner.");
      }

      const data = await response.json();
      setPlanData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during plan calculation.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskCompleted = (phaseIndex: number, taskIndex: number) => {
    const key = `${phaseIndex}-${taskIndex}`;
    setCompletedTasks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const clearCurrentPlan = () => {
    if (window.confirm("Are you sure you want to reset your study schedule and create a new plan?")) {
      setPlanData(null);
      setSubjects([]);
      setCompletedTasks({});
    }
  };

  // Calculate stats
  const totalTasks = planData?.schedule.reduce((acc, phase) => acc + phase.tasks.length, 0) || 0;
  const completedTasksCount = Object.keys(completedTasks).filter((k) => completedTasks[k]).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  return (
    <div id="study-planner-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-210px)] overflow-hidden">
      {/* Parameters column */}
      <div className="lg:col-span-1 flex flex-col h-full overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="font-display font-semibold text-slate-900 text-base">Study Planner</h3>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Input your target subjects, commitment levels, and dates to render a detailed day-to-day study roadmap.
            </p>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Target Subjects
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    placeholder="e.g. Data Structures"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubject(); } }}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg focus:outline-hidden transition-all text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={addSubject}
                    className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Subjects list */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50/50 rounded-lg border border-slate-100">
                  {subjects.length === 0 ? (
                    <span className="text-[10px] text-slate-400 p-1 italic">No subjects added yet.</span>
                  ) : (
                    subjects.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 border border-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md"
                      >
                        <span>{sub}</span>
                        <button
                          type="button"
                          onClick={() => removeSubject(sub)}
                          className="text-emerald-500 hover:text-emerald-700 font-bold"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Target Horizon
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-hidden transition-all text-slate-800"
                >
                  <option value="1 week">1 Week Crash Program</option>
                  <option value="2 weeks">2 Weeks Intensive Program</option>
                  <option value="4 weeks">4 Weeks Complete Semester Roadmap</option>
                  <option value="8 weeks">8 Weeks Comprehensive Exam Prep</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg focus:outline-hidden transition-all text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Hours / Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-lg focus:outline-hidden transition-all text-slate-800"
                  />
                </div>
              </div>

              {/* Simplicity Mode Alert Block */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  {simplicityMode === "buddy" && <><span>🍕</span> Everyday Buddy Planner</>}
                  {simplicityMode === "scholar" && <><span>🎓</span> Deep Scholar Planner</>}
                  {simplicityMode === "teacher" && <><span>🏫</span> Clear Teacher Planner</>}
                </p>
                <p className="text-slate-500 leading-normal">
                  {simplicityMode === "buddy" && "Plan descriptions, notes, and checklist advice will use super casual peer talk with funny, motivating notes."}
                  {simplicityMode === "scholar" && "Planner schedules will use comprehensive academic terminology and structured milestones."}
                  {simplicityMode === "teacher" && "Planner schedules will be laid out in crystal-clear, plain English for direct guidance."}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || subjects.length === 0}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-medium transition-all shadow-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mapping Daily Milestones...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Study Plan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {planData && (
            <button
              onClick={clearCurrentPlan}
              className="mt-6 w-full text-xs text-red-500 hover:text-red-700 font-medium py-2 border border-dashed border-red-200 rounded-xl hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset & Create New Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* RoadMap Output Stage */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
        {/* Header Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Roadmap Dashboard</span>
          </h3>
          {planData && (
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-slate-400">
                {completedTasksCount} / {totalTasks} Tasks
              </span>
              <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-emerald-600 font-mono">
                {completionPercentage}%
              </span>
            </div>
          )}
        </div>

        {/* Display Sheet */}
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
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-emerald-600 animate-pulse" />
                </div>
              </div>
              <h4 className="font-semibold text-slate-700 text-sm">Structuring Pedagogical Study Block</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Allocating intervals, clustering computer science subjects, generating daily checkpoints, and suggesting helpful study resources...
              </p>
            </div>
          ) : planData ? (
            <div className="max-w-2xl mx-auto space-y-6 pb-10">
              {/* Header Title */}
              <div className="bg-white p-5 border border-slate-100 rounded-2xl shadow-xs">
                <h4 className="font-display font-extrabold text-slate-900 text-lg tracking-tight">
                  {planData.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {planData.description}
                </p>
              </div>

              {/* Schedule List */}
              <div className="space-y-4">
                <h5 className="font-display font-semibold text-slate-800 text-xs uppercase tracking-wider pl-1">
                  Chronological Learning Modules
                </h5>

                {planData.schedule.map((phase, pIdx) => (
                  <div key={pIdx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                    {/* Top block metadata */}
                    <div className="flex items-start justify-between gap-3 mb-3 pb-2 border-b border-slate-50">
                      <div>
                        <h6 className="font-display font-bold text-slate-900 text-sm">{phase.title}</h6>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Focus: <span className="text-slate-700 font-medium">{phase.focus}</span>
                        </p>
                      </div>
                      <span className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {phase.duration}
                      </span>
                    </div>

                    {/* Tasks checklist */}
                    <div className="space-y-2 mb-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Study Checklist</p>
                      {phase.tasks.map((task, tIdx) => {
                        const isDone = !!completedTasks[`${pIdx}-${tIdx}`];
                        return (
                          <div
                            key={tIdx}
                            onClick={() => toggleTaskCompleted(pIdx, tIdx)}
                            className={`p-2.5 border rounded-lg cursor-pointer transition-all flex items-start gap-2 text-xs hover:bg-slate-50 ${
                              isDone ? "border-emerald-100 bg-emerald-50/10 text-slate-400" : "border-slate-100 text-slate-600"
                            }`}
                          >
                            <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isDone ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 bg-white"
                            }`}>
                              {isDone && <Check className="w-3 h-3 stroke-[3px]" />}
                            </div>
                            <span className={isDone ? "line-through opacity-70" : ""}>{task}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Resources */}
                    {phase.resources.length > 0 && (
                      <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                          <Book className="w-3.5 h-3.5 text-slate-400" />
                          Recommended Materials
                        </p>
                        <ul className="list-disc ml-4 space-y-1 text-[11px] text-slate-600">
                          {phase.resources.map((res, rIdx) => (
                            <li key={rIdx}>{res}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Calendar className="w-12 h-12 text-slate-200 mb-3" />
              <h4 className="font-semibold text-slate-600 text-sm">Personal Study Stage</h4>
              <p className="text-xs max-w-xs mt-1">
                Configure your target subjects, durations, daily targets, and deadline to outline a personal roadmap with checklist boxes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
