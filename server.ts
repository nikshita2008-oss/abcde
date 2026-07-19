import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Safe client initialization
  let ai: GoogleGenAI | null = null;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini API client initialized successfully.");
    } else {
      console.warn("GEMINI_API_KEY environment variable is not set. API features will require setup.");
    }
  } catch (err) {
    console.error("Failed to initialize Gemini API client:", err);
  }

  // Middleware to ensure AI is initialized
  const requireAI = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API client is not configured. Please add your GEMINI_API_KEY in the Secrets panel."
      });
    }
    next();
  };

  // API Route: AI Chat Tutor
  app.post("/api/chat-tutor", requireAI, async (req: express.Request, res: express.Response) => {
    try {
      const { message, history, simplicityMode } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const contents = [];
      if (history && Array.isArray(history)) {
        for (const item of history) {
          contents.push({
            role: item.role === "user" ? "user" : "model",
            parts: [{ text: item.text }]
          });
        }
      }
      contents.push({ role: "user", parts: [{ text: message }] });

      // Determine system instruction based on simplicity mode
      let systemInstruction = "";
      if (simplicityMode === "buddy") {
        systemInstruction = `You are StudyMate AI, a super friendly, upbeat Study Buddy. You explain academic concepts using simple, everyday language and totally avoid academic jargon. Instead of fancy academic words, explain everything using extremely fun, memorable, relatable everyday metaphors (e.g., comparing computer memory to a kitchen cabinet, or chemical reactions to people mingling at a party!). Speak in a warm, casual, and highly encouraging tone. Keep your paragraphs very short, simple, and digestible. Always end your response with a playful, friendly question to check their understanding! Use clean Markdown for formatting.`;
      } else if (simplicityMode === "scholar") {
        systemInstruction = `You are StudyMate AI, a structured and comprehensive academic tutor. You explain concepts with detailed accuracy, retaining formal academic terminology, but structuring it elegantly so it remains easy to read and digest. Provide clean, clear definitions, detailed breakdowns, and high-quality study guidance. Encourage the student and ask a thoughtful question at the end to check their depth of understanding. Use clean Markdown.`;
      } else {
        // Default to "teacher"
        systemInstruction = `You are StudyMate AI, an expert teacher. You explain concepts in crystal-clear, normal English that is extremely easy for any average human to understand. Avoid complex technical jargon; if you must use a technical term, explain it immediately with a simple, intuitive real-world analogy. Your goal is to make any difficult academic topic feel accessible, warm, and straightforward. Structure your response beautifully with paragraphs, simple bullet points, and high readability. Encourage the student and ask a guiding, helpful question at the end to check their progress. Use clean Markdown.`;
      }

      const response = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ reply: response.text || "I was unable to formulate a response. Please try again!" });
    } catch (error: any) {
      console.error("Chat Tutor Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate tutor response." });
    }
  });

  // API Route: AI Notes Generator
  app.post("/api/generate-notes", requireAI, async (req: express.Request, res: express.Response) => {
    try {
      const { topic, subject, simplicityMode } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }

      const subjectContext = subject ? ` for the subject of ${subject}` : "";
      
      let prompt = "";
      let sysInstruction = "";

      if (simplicityMode === "buddy") {
        sysInstruction = "You are a friendly peer tutor who excels at translating complex science and humanities topics into funny, ultra-relatable, plain everyday language for normal humans.";
        prompt = `Generate a super simple, highly engaging set of study notes for the topic: "${topic}"${subjectContext}.
The notes must be written in incredibly simple, warm, everyday human-to-human language. Avoid complex academic terms unless they are explained with funny, memorable metaphors.

Structure the notes with these exact headings:
# 🌟 The Big Picture (In Plain English)
Explain the core idea in 2-3 extremely simple sentences, like you are talking to a friend over lunch.

# 🍕 The Pizza Analogy (Or other hilarious everyday comparison)
Create a vivid, funny, and unforgettable analogy using everyday concepts (like baking, traffic, pizza, movies, or puppies) to explain exactly how this works.

# 📝 Easy Core Points (Explained Simply)
Break down the main components or steps into short bullet points with zero complicated jargon.

# ⚠️ Trap Alert! (Common Pitfalls)
Explain what people usually get confused about, using simple language.

# 💡 A Quick Summary
One sentence wrapping everything up.

Format your response in clean, beautiful standard Markdown.`;
      } else if (simplicityMode === "scholar") {
        sysInstruction = "You are an expert university professor. You write dense, high-quality, professional study sheets with strong academic vocabulary, structured beautifully using markdown.";
        prompt = `Generate detailed, comprehensive, exam-focused academic study notes for the topic: "${topic}"${subjectContext}.
The notes should be rich, structured, and deep.

Structure the notes with these exact headings:
# 📘 Executive Summary
An academic high-level summary of the concept.

# ⚙️ Theoretical Mechanics
The fundamental technical components, mechanics, or formulas behind this concept.

# 🎯 Critical Exam Focus Points
Advanced bullet points outlining what is highly likely to be tested on college-level exams.

# 🔍 Detailed Illustrated Case Study
A concrete, detailed technical walkthrough or demonstration.

# ⚠️ Misconceptions & Pitfalls
Common student mistakes, explained in academic detail.

Format in clean, professional Markdown.`;
      } else {
        // Default to "teacher" - plain normal english
        sysInstruction = "You are an expert teacher who specializes in explaining difficult topics in simple, accessible, normal everyday English that anyone can grasp.";
        prompt = `Generate clear, easy-to-understand, exam-focused study notes for the topic: "${topic}"${subjectContext}.
The notes must be written in clear, normal English for average human understanding. Ensure the style is friendly and helpful.

Structure the notes with these exact headings:
# 📝 Simple Explanation (Plain English)
A quick, friendly summary of what this topic is and why it matters.

# 🚗 Real-World Analogy
A simple, everyday comparison that makes the concept instantly click.

# 🔑 Key Points to Remember
Easy, bulleted points explaining the main parts.

# ⚠️ Common Mistakes to Avoid
What students usually get wrong and how to keep it straight.

# 📌 Quick Takeaway
A 1-sentence plain-English summary.

Format your response in beautiful, standard Markdown.`;
      }

      const response = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: sysInstruction,
          temperature: 0.3,
        }
      });

      res.json({ notes: response.text || "" });
    } catch (error: any) {
      console.error("Generate Notes Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate notes." });
    }
  });

  // API Route: AI Quiz Generator (JSON schema)
  app.post("/api/generate-quiz", requireAI, async (req: express.Request, res: express.Response) => {
    try {
      const { topic, difficulty, count, simplicityMode } = req.body;
      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }

      const qCount = count || 5;
      const qDifficulty = difficulty || "Medium";

      let systemInstruction = "";
      if (simplicityMode === "buddy") {
        systemInstruction = "You are an academic test maker. Always generate educational multiple-choice questions (MCQs). In your 'explanation' field, explain the correct answer like a friendly peer using extremely simple, funny, relatable everyday analogies (e.g., pizzas, puppies, movies). Avoid complex technical jargon.";
      } else if (simplicityMode === "scholar") {
        systemInstruction = "You are a university professor. Always generate challenging, highly rigorous college-level MCQs. In your 'explanation' field, provide a deeply academic, rigorous breakdown of the underlying scientific/theoretical principles of the correct answer.";
      } else {
        // Default to "teacher"
        systemInstruction = "You are an expert schoolteacher. Always generate educational MCQs. In your 'explanation' field, explain why the answer is correct using crystal-clear, plain everyday English that is easy for any average human to understand. Keep definitions simple and intuitive.";
      }

      const prompt = `Generate exactly ${qCount} multiple-choice questions (MCQs) on the topic: "${topic}" at a ${qDifficulty} difficulty level. 
Each question must be challenging, educational, and have exactly 4 options. Include the index of the correct answer (0 to 3) and a comprehensive explanation of why it is correct.`;

      const response = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.4,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                description: "List of multiple choice questions",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "The MCQ question text." },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "List of exactly 4 options."
                    },
                    answerIndex: { type: Type.INTEGER, description: "The index of the correct option (0, 1, 2, or 3)." },
                    explanation: { type: Type.STRING, description: "Detailed explanation of why this answer is correct." }
                  },
                  required: ["question", "options", "answerIndex", "explanation"]
                }
              }
            },
            required: ["questions"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const quiz = JSON.parse(jsonStr);
      res.json(quiz);
    } catch (error: any) {
      console.error("Generate Quiz Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate quiz." });
    }
  });

  // API Route: Text Summarizer (JSON schema)
  app.post("/api/summarize", requireAI, async (req: express.Request, res: express.Response) => {
    try {
      const { text, length, simplicityMode } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      let systemInstruction = "";
      if (simplicityMode === "buddy") {
        systemInstruction = "You are a friendly peer tutor. Your goal is to synthesize dense materials into super simple summaries written like a text from a smart friend. In the 'summary' field, provide an ultra-simple everyday explanation. For each item in 'definitions', define terms using hilarious, intuitive everyday analogies.";
      } else if (simplicityMode === "scholar") {
        systemInstruction = "You are an academic journal editor. Synthesize dense literature into highly detailed, advanced academic study guides. Retain rigorous scientific language, advanced vocabulary, and strict context.";
      } else {
        // Default to "teacher"
        systemInstruction = "You are an expert schoolteacher. Synthesize dense materials into crystal-clear, simple summaries written in plain, normal English for average human understanding. Ensure the summary is highly intuitive and key points are clear.";
      }

      const prompt = `Summarize the following educational text/passage. 
Target length format: ${length || "detailed"}.
Extract the ultimate core summary, the top critical key takeaways, and list any academic or technical terms with their precise definitions.

Passage to summarize:
${text}`;

      const response = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING, description: "A fluid, dense summary paragraph of the content, written in clear, plain everyday English with relatable metaphors." },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of top 3 to 7 critical takeaways from the text."
              },
              definitions: {
                type: Type.ARRAY,
                description: "Key terminology and vocab definitions found in the text.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING, description: "The term or concept name." },
                    definition: { type: Type.STRING, description: "A clear, concise definition explained in simple terms." }
                  },
                  required: ["term", "definition"]
                }
              }
            },
            required: ["summary", "keyPoints", "definitions"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const summaryResult = JSON.parse(jsonStr);
      res.json(summaryResult);
    } catch (error: any) {
      console.error("Summarizer Error:", error);
      res.status(500).json({ error: error.message || "Failed to summarize content." });
    }
  });

  // API Route: Study Planner (JSON schema)
  app.post("/api/study-plan", requireAI, async (req: express.Request, res: express.Response) => {
    try {
      const { subjects, availableTime, examDate, dailyHours, simplicityMode } = req.body;
      if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
        return res.status(400).json({ error: "Subjects array is required" });
      }

      let systemInstruction = "";
      if (simplicityMode === "buddy") {
        systemInstruction = "You are an encouraging Study Buddy who creates fun, stress-free, bite-sized study plans. Formulate tasks like playful micro-steps (e.g. 'Play with an interactive app', 'Doodle a quick sketch of the concept', 'Tell a family member about the topic'). Use casual, motivating language.";
      } else if (simplicityMode === "scholar") {
        systemInstruction = "You are an elite academic advisor. Build structured, highly detailed, rigorous study schedules. Focus on deep work blocks, literature synthesis, proof verification, and academic milestones.";
      } else {
        // Default to "teacher"
        systemInstruction = "You are an expert student counselor. Your goal is to build clear, realistic, and practical study plans written in plain, clear English. Keep tasks highly actionable, easy to follow, and motivating for any normal student.";
      }

      const prompt = `Create a highly tailored step-by-step personalized study schedule.
Subjects to learn: ${subjects.join(", ")}
Available overall duration: ${availableTime || "4 weeks"}
Exam Date / Deadline: ${examDate || "No set date"}
Daily study commitment: ${dailyHours || "2 hours"} per day.

Generate a highly structured layout with a motivating description and an ordered schedule of phases/blocks.`;

      const response = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the study plan." },
              description: { type: Type.STRING, description: "A personalized, motivating opening statement written in friendly plain English." },
              schedule: {
                type: Type.ARRAY,
                description: "The phase-by-phase chronological schedule.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Phase/Week/Day title (e.g., 'Phase 1: Foundations' or 'Week 1')." },
                    duration: { type: Type.STRING, description: "Time allotted to this block (e.g., '6 Hours' or '3 Days')." },
                    focus: { type: Type.STRING, description: "The main topics and target outcomes of this block, explained in plain terms." },
                    tasks: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Concrete, simple, step-by-step checklists of things to study or practice."
                    },
                    resources: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Suggested easy-to-use study resources (e.g. YouTube channels, interactive visualizers, simple flashcards)."
                    }
                  },
                  required: ["title", "duration", "focus", "tasks", "resources"]
                }
              }
            },
            required: ["title", "description", "schedule"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const plan = JSON.parse(jsonStr);
      res.json(plan);
    } catch (error: any) {
      console.error("Study Planner Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate study plan." });
    }
  });

  // API Route: AI Code Explainer (JSON schema)
  app.post("/api/explain-code", requireAI, async (req: express.Request, res: express.Response) => {
    try {
      const { code, language, simplicityMode } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Code is required" });
      }

      let systemInstruction = "";
      if (simplicityMode === "buddy") {
        systemInstruction = "You are a friendly peer software engineer. Your goal is to explain code logic using extremely funny and relatable real-world physical metaphors (like baking recipes, conveyor belts, a stack of dinner plates, or post-it notes). Avoid advanced computer science jargon; explain everything like you are explaining it to someone who has never coded before in their life.";
      } else if (simplicityMode === "scholar") {
        systemInstruction = "You are an elite Computer Science researcher. Provide rigorous, highly scientific analyses of code execution flow. Reference algorithms, precise memory safety, Big-O complexity, cache locality, and lower-level CPU/compiler execution stages.";
      } else {
        // Default to "teacher"
        systemInstruction = "You are an expert programming teacher. Explain code logic in crystal-clear, plain, normal English that any average human can immediately grasp. Use relatable real-world analogies to describe variable changes, loops, and conditional statements.";
      }

      const prompt = `Analyze the following programming code block (Language: ${language || "Detect automatically"}).
Provide:
1. Executive Explanation: What this code does in simple, plain English.
2. Code Logic: A thorough walk-through of how the code operates line-by-line or section-by-section.
3. Algorithm/Approach: The computer science algorithm, data structures, or patterns utilized (e.g., recursion, dynamic programming, sorting, complexity).
4. Errors & Risks: Point out any potential bugs, compiler warnings, runtime risks, or memory leak dangers. If none, write 'No immediate errors detected'.
5. Key Improvements: List actionable recommendations to optimize performance, clean up readability, or implement best-practice styles.

Code to analyze:
\`\`\`${language || ""}
${code}
\`\`\``;

      const response = await ai!.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING, description: "High-level summary of the code function, written in crystal-clear plain English." },
              logic: { type: Type.STRING, description: "Logical breakdown of variables and state changes using relatable analogies." },
              algorithm: { type: Type.STRING, description: "Algorithm details and Big-O complexity, translated into clear terms." },
              errors: { type: Type.STRING, description: "Code bugs, safety issues, warnings or logical errors, explained in plain language." },
              improvements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of exact refactoring, performance, or styling suggestions."
              }
            },
            required: ["explanation", "logic", "algorithm", "errors", "improvements"]
          }
        }
      });

      const jsonStr = response.text?.trim() || "{}";
      const codeAnalysis = JSON.parse(jsonStr);
      res.json(codeAnalysis);
    } catch (error: any) {
      console.error("Code Explainer Error:", error);
      res.status(500).json({ error: error.message || "Failed to explain code." });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", aiConfigured: !!ai });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
});
