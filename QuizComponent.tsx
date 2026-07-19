import React, { useState } from "react";
import { QuizData, QuizQuestion } from "../types";
import { Sparkles, Trophy, RotateCcw, ChevronRight, HelpCircle, AlertCircle, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

export default function QuizComponent() {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [qCount, setQCount] = useState(5);
  
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [answersHistory, setAnswersHistory] = useState<Array<{ questionIndex: number, chosenIndex: number, isCorrect: boolean }>>([]);
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

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setQuizData(null);
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setQuizFinished(false);
    setAnswersHistory([]);

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), difficulty, count: qCount, simplicityMode }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate academic practice test.");
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error("Invalid academic response structure. Try another topic!");
      }

      setQuizData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during quiz synthesis.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOptionIndex !== null || quizFinished) return; // Answered already

    setSelectedOptionIndex(optionIndex);
    const currentQuestion = quizData!.questions[currentIndex];
    const isCorrect = optionIndex === currentQuestion.answerIndex;
    
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    setAnswersHistory((prev) => [
      ...prev,
      { questionIndex: currentIndex, chosenIndex: optionIndex, isCorrect }
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 < quizData!.questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
    } else {
      setQuizFinished(true);
    }
  };

  const restartSameQuiz = () => {
    setCurrentIndex(0);
    setSelectedOptionIndex(null);
    setScore(0);
    setQuizFinished(false);
    setAnswersHistory([]);
  };

  const currentQuestion = quizData?.questions[currentIndex];

  return (
    <div id="quiz-generator-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-210px)] overflow-hidden">
      {/* Settings Column */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-semibold text-slate-900 text-base">Practice Quizzes</h3>
            </div>
            
            <p className="text-xs text-slate-500 mb-5">
              Generate customizable multiple-choice assessments with real-time feedback and tutoring reviews.
            </p>

            <form onSubmit={handleStartQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Test Subject / Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Python programming for beginners"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-hidden transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["Easy", "Medium", "Hard"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setDifficulty(lvl)}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                        difficulty === lvl
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Number of Questions
                </label>
                <select
                  value={qCount}
                  onChange={(e) => setQCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl focus:outline-hidden transition-all text-slate-800"
                >
                  <option value={3}>3 Questions (Quick Test)</option>
                  <option value={5}>5 Questions (Recommended)</option>
                  <option value={10}>10 Questions (Complete Practice)</option>
                </select>
              </div>

              {/* Simplicity Mode Alert Block */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <p className="font-semibold text-slate-700 flex items-center gap-1">
                  {simplicityMode === "buddy" && <><span>🍕</span> Everyday Buddy Explanations</>}
                  {simplicityMode === "scholar" && <><span>🎓</span> Deep Scholar Explanations</>}
                  {simplicityMode === "teacher" && <><span>🏫</span> Clear Teacher Explanations</>}
                </p>
                <p className="text-slate-500 leading-normal">
                  {simplicityMode === "buddy" && "Quiz question reviews and answers will be explained simply like a smart friend using fun, relatable comparisons."}
                  {simplicityMode === "scholar" && "Quiz results will use advanced theoretical concepts and strict college-level vocabulary."}
                  {simplicityMode === "teacher" && "Quiz explanations will use clean, direct English so anyone can easily understand."}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-medium transition-all shadow-xs flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Structuring Practice Test...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Practice Quiz</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6 text-[11px] text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-300" />
            <span>Scores are saved on-device for session assessment.</span>
          </div>
        </div>
      </div>

      {/* Main Board */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-full">
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-slate-400" />
            <span>Interactive Test Stage</span>
          </h3>
          {quizData && !quizFinished && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono font-medium">
              Question {currentIndex + 1} of {quizData.questions.length}
            </span>
          )}
        </div>

        {/* Board Panel */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/10 flex flex-col justify-center">
          {error && (
            <div className="max-w-xl mx-auto px-4 py-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-4">
                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
                </div>
              </div>
              <h4 className="font-semibold text-slate-700 text-sm">Drafting Academic MCQ Bank</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Compiling academic-grade questions, distractors, correct answers, and thorough pedagogical explanations...
              </p>
            </div>
          ) : quizFinished ? (
            /* SCORE SUMMARY BOARD */
            <div className="max-w-md mx-auto text-center py-6">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-100 shadow-xs">
                <Trophy className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900">Quiz Completed!</h3>
              <p className="text-sm text-slate-500 mt-1">Great effort on reviewing {topic}!</p>
              
              {/* Score ring */}
              <div className="my-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 inline-block">
                <div className="text-4xl font-extrabold text-indigo-600 font-display">
                  {score} <span className="text-slate-400 font-light">/</span> {quizData!.questions.length}
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1.5">
                  Your Score ({Math.round((score / quizData!.questions.length) * 100)}%)
                </div>
              </div>

              {/* Summary table */}
              <div className="text-left max-h-48 overflow-y-auto mb-6 border border-slate-100 rounded-xl divide-y divide-slate-100">
                {quizData!.questions.map((q, idx) => {
                  const hist = answersHistory.find((h) => h.questionIndex === idx);
                  return (
                    <div key={idx} className="p-3 flex items-start gap-3 bg-white text-xs">
                      {hist?.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{q.question}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Correct: <span className="text-green-600 font-medium">{q.options[q.answerIndex]}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={restartSameQuiz}
                  className="px-4 py-2.5 text-xs font-semibold border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl bg-white transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Test</span>
                </button>
                <button
                  onClick={() => setQuizData(null)}
                  className="px-4 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-xs"
                >
                  Choose New Topic
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            /* ACTIVE QUESTION BOARD */
            <div className="max-w-xl mx-auto w-full py-2">
              {/* Question text */}
              <div className="mb-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-sm">
                  Academic Practice Module
                </span>
                <h4 className="font-display font-bold text-base text-slate-900 mt-2.5 leading-snug">
                  {currentQuestion.question}
                </h4>
              </div>

              {/* Options array */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOptionIndex === idx;
                  const isCorrectAnswer = idx === currentQuestion.answerIndex;
                  const hasAnswered = selectedOptionIndex !== null;

                  let cardStyle = "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50";
                  let indicator: React.ReactNode = (
                    <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center shrink-0 font-mono text-[10px] font-bold text-slate-400">
                      {String.fromCharCode(65 + idx)}
                    </div>
                  );

                  if (hasAnswered) {
                    if (isCorrectAnswer) {
                      cardStyle = "border-green-500 bg-green-50/50 text-green-900";
                      indicator = <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />;
                    } else if (isSelected) {
                      cardStyle = "border-red-500 bg-red-50/50 text-red-900";
                      indicator = <XCircle className="w-5 h-5 text-red-500 shrink-0" />;
                    } else {
                      cardStyle = "border-slate-100 bg-white text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-4 border rounded-xl flex items-center gap-3 transition-all text-sm font-medium ${cardStyle}`}
                    >
                      {indicator}
                      <span className="flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation panel upon answering */}
              {selectedOptionIndex !== null && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-6 animate-fade-in text-xs leading-relaxed text-slate-600">
                  <p className="font-semibold text-slate-800 mb-1">
                    {selectedOptionIndex === currentQuestion.answerIndex ? "🎉 Correct Answer!" : "❌ Let's Learn Why:"}
                  </p>
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}

              {/* Next/Complete Button */}
              {selectedOptionIndex !== null && (
                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <span>
                      {currentIndex + 1 === quizData.questions.length ? "Finish Quiz" : "Next Question"}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* EMPTY INITIAL BOARD */
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <Trophy className="w-12 h-12 text-slate-200 mb-3" />
              <h4 className="font-semibold text-slate-600 text-sm">Academic MCQ Practice Area</h4>
              <p className="text-xs max-w-xs mt-1">
                Enter a custom learning topic on the left sidebar to generate a fully interactive multiple choice evaluation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
