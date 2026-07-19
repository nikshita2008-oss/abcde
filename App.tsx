import React, { useState, useEffect } from "react";
import ChatTutorComponent from "./components/ChatTutorComponent";
import NotesGeneratorComponent from "./components/NotesGeneratorComponent";
import QuizComponent from "./components/QuizComponent";
import SummarizerComponent from "./components/SummarizerComponent";
import StudyPlannerComponent from "./components/StudyPlannerComponent";
import CodeExplainerComponent from "./components/CodeExplainerComponent";

import {
  MessageSquare,
  FileText,
  Trophy,
  Activity,
  Calendar,
  Code,
  Sparkles,
  BookOpen,
  Clock,
  Menu,
  X
} from "lucide-react";

type ActiveTab = "chat" | "notes" | "quiz" | "summary" | "planner" | "code";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simplicityMode, setSimplicityMode] = useState<"buddy" | "teacher" | "scholar">(
    () => (localStorage.getItem("studymate_simplicity_mode") as any) || "teacher"
  );

  const changeSimplicityMode = (mode: "buddy" | "teacher" | "scholar") => {
    setSimplicityMode(mode);
    localStorage.setItem("studymate_simplicity_mode", mode);
    window.dispatchEvent(new Event("studymate_mode_changed"));
  };

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Basic stats counts from localStorage for dashboard metrics
  const [stats, setStats] = useState({
    notesCount: 0,
    chatMsgCount: 0,
    plannerTaskProgress: 0,
    isPlanActive: false,
  });

  const refreshStats = () => {
    const savedNotes = localStorage.getItem("studymate_saved_notes");
    const notesCount = savedNotes ? JSON.parse(savedNotes).length : 0;

    const savedChats = localStorage.getItem("studymate_chat_history");
    const chatMsgCount = savedChats ? JSON.parse(savedChats).length : 0;

    const savedPlan = localStorage.getItem("studymate_active_plan");
    const isPlanActive = !!savedPlan;

    let plannerTaskProgress = 0;
    if (savedPlan) {
      const planObj = JSON.parse(savedPlan);
      const totalTasks = planObj.schedule?.reduce((acc: number, p: any) => acc + p.tasks.length, 0) || 0;
      const completedTasksObj = localStorage.getItem("studymate_completed_plan_tasks");
      const completedTasksMap = completedTasksObj ? JSON.parse(completedTasksObj) : {};
      const completedTasksCount = Object.keys(completedTasksMap).filter((k) => completedTasksMap[k]).length;
      plannerTaskProgress = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;
    }

    setStats({
      notesCount,
      chatMsgCount,
      plannerTaskProgress,
      isPlanActive,
    });
  };

  // Run on mount and periodically upon tab changes
  useEffect(() => {
    refreshStats();
  }, [activeTab]);

  const navItems: { id: ActiveTab; label: string; icon: any; highlight?: boolean }[] = [
    { id: "chat", label: "AI Chat Tutor", icon: MessageSquare },
    { id: "notes", label: "AI Notes Generator", icon: FileText },
    { id: "quiz", label: "AI Practice Quizzes", icon: Trophy },
    { id: "summary", label: "AI Text Summarizer", icon: BookOpen },
    { id: "planner", label: "AI Study Planner", icon: Calendar },
    { id: "code", label: "AI Code Explainer", icon: Code, highlight: true },
  ];

  return (
    <div id="studymate-root" className="flex flex-col lg:flex-row h-screen w-full bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden">
      
      {/* Mobile Header Navigation */}
      <header className="lg:hidden shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-800">StudyMate AI</h1>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/40 z-40" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-64 max-w-[80vw] h-full bg-white flex flex-col justify-between py-6 px-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <h1 className="text-lg font-bold tracking-tight text-slate-800">StudyMate AI</h1>
              </div>

              {/* Mobile Persona Simplifier Selector */}
              <div className="pb-4 border-b border-slate-100">
                <p className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-slate-400 pl-4 mb-2">Tutor Persona</p>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => changeSimplicityMode("buddy")}
                    className={`py-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer ${
                      simplicityMode === "buddy" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Buddy 🍕
                  </button>
                  <button
                    onClick={() => changeSimplicityMode("teacher")}
                    className={`py-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer ${
                      simplicityMode === "teacher" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Teacher 🏫
                  </button>
                  <button
                    onClick={() => changeSimplicityMode("scholar")}
                    className={`py-1.5 rounded-lg text-[10px] font-bold text-center cursor-pointer ${
                      simplicityMode === "scholar" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Scholar 🎓
                  </button>
                </div>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const IconComponent = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 font-semibold"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <IconComponent className={`w-4.5 h-4.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Credits Card */}
            <div className="p-4 bg-slate-900 rounded-2xl text-white">
              <p className="text-[10px] text-slate-400 mb-1 font-medium uppercase tracking-wider">Learning Progress</p>
              <p className="text-sm font-semibold">
                {stats.isPlanActive ? `${stats.plannerTaskProgress}% Complete` : "Ready to Learn"}
              </p>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-300" 
                  style={{ width: `${stats.isPlanActive ? stats.plannerTaskProgress : 35}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex w-64 border-r border-slate-200 bg-white flex-col justify-between py-8 px-6 shrink-0 h-screen overflow-y-auto">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">StudyMate AI</h1>
          </div>
          
          <p className="text-[10px] uppercase font-mono font-extrabold tracking-widest text-slate-400 pl-4 mb-3">
            Tutor Modules
          </p>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all text-sm font-medium cursor-pointer ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-4.5 h-4.5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="px-1.5 py-0.5 bg-indigo-100/60 text-indigo-800 rounded text-[8px] font-bold">CSE</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Metrics Progress Card inside Sidebar */}
        <div className="space-y-4">
          {/* Quick Mini stats breakdown */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-500 space-y-1.5">
            <div className="flex justify-between">
              <span>Saved Sheets</span>
              <span className="font-bold text-slate-800 font-mono">{stats.notesCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Chats with Tutor</span>
              <span className="font-bold text-slate-800 font-mono">{stats.chatMsgCount}</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-2xl text-white">
            <p className="text-[10px] text-slate-400 mb-1 font-medium uppercase tracking-wider">Learning Progress</p>
            <p className="text-base font-semibold">
              {stats.isPlanActive ? `${stats.plannerTaskProgress}% Complete` : "Ready to Learn"}
            </p>
            <div className="w-full bg-slate-700 h-1 rounded-full mt-3 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full transition-all duration-300" 
                style={{ width: `${stats.isPlanActive ? stats.plannerTaskProgress : 35}%` }}
              ></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden p-4 sm:p-6 lg:p-8">
        
        {/* Header bar mirroring clean minimalism */}
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">Hello Student</h2>
            <p className="text-slate-500 text-sm">What would you like to master today?</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Desktop Persona Simplifier Selector */}
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 gap-0.5 items-center">
              <span className="text-[9px] uppercase font-mono font-extrabold text-slate-400 px-2 tracking-wider">AI Persona</span>
              <button
                onClick={() => changeSimplicityMode("buddy")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  simplicityMode === "buddy"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Explain Like I'm 5 (Super simple everyday analogies)"
              >
                <span>🍕 Buddy</span>
              </button>
              <button
                onClick={() => changeSimplicityMode("teacher")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  simplicityMode === "teacher"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Crystal-clear plain English for average human understanding (Default)"
              >
                <span>🏫 Teacher</span>
              </button>
              <button
                onClick={() => changeSimplicityMode("scholar")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  simplicityMode === "scholar"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title="Rigorous academic explanations with advanced college terminology"
              >
                <span>🎓 Scholar</span>
              </button>
            </div>

            {/* Real-time Time Widget */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">
                {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600 font-mono text-sm">
              ST
            </div>
          </div>
        </header>

        {/* Dynamic Inner Component Screen */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {activeTab === "chat" && <ChatTutorComponent />}
          {activeTab === "notes" && <NotesGeneratorComponent />}
          {activeTab === "quiz" && <QuizComponent />}
          {activeTab === "summary" && <SummarizerComponent />}
          {activeTab === "planner" && <StudyPlannerComponent />}
          {activeTab === "code" && <CodeExplainerComponent />}
        </div>

        {/* Infrastructure disclaimer from Mockup */}
        <footer className="mt-4 shrink-0">
          <p className="text-center text-[9px] text-slate-400 uppercase tracking-[0.2em] font-semibold">
            Powered by Google Gemini & Premium AI Workspace Infrastructure
          </p>
        </footer>
      </main>

    </div>
  );
}
