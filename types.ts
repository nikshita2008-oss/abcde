export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface QuizData {
  questions: QuizQuestion[];
}

export interface SummaryDefinition {
  term: string;
  definition: string;
}

export interface SummaryData {
  summary: string;
  keyPoints: string[];
  definitions: SummaryDefinition[];
}

export interface StudyPlanScheduleItem {
  title: string;
  duration: string;
  focus: string;
  tasks: string[];
  resources: string[];
}

export interface StudyPlanData {
  title: string;
  description: string;
  schedule: StudyPlanScheduleItem[];
}

export interface CodeAnalysisData {
  explanation: string;
  logic: string;
  algorithm: string;
  errors: string;
  improvements: string[];
}
