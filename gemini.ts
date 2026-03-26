import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Student, Submission, AIAnalysisResult, Faculty } from "../types";

// --- Analytics Service ---

export const analyzeStudentData = async (
  student: Student,
  submissions: Submission[]
): Promise<AIAnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analyze the following student data for academic performance monitoring.
    Student: ${student.name}, Dept: ${student.department}, Score: ${student.performanceScore}%, Attendance: ${student.attendance}%.
    Submissions: ${submissions.map(s => `${s.type}: ${s.title}`).join(", ")}.

    Provide a JSON response with:
    1. A short summary paragraph.
    2. A list of 3 key strengths.
    3. A list of 3 areas for improvement (weaknesses).
    4. A recommended learning path sentence.
  `;

  // Define Schema
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
      recommendedPath: { type: Type.STRING },
    },
    required: ["summary", "strengths", "weaknesses", "recommendedPath"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("AI Analysis Failed", error);
    throw error;
  }
};

export const queryDatabase = async (
  prompt: string,
  students: Student[],
  facultyList: Faculty[]
): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are an AI assistant for a College Management Portal.
    You have access to the current database of students and faculty.
    
    Students: ${JSON.stringify(students.map(s => ({ id: s.id, name: s.name, regNo: s.regNo, dept: s.department, attendance: s.attendance, performance: s.performanceScore })))}
    Faculty: ${JSON.stringify(facultyList.map(f => ({ id: f.id, name: f.name, role: f.facultyRole, dept: f.department })))}
    
    Answer the user's query based on this data. 
    If they ask for a list, provide it in a clear, formatted way (Markdown).
    If they ask for statistics, calculate them.
    Be professional and concise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return response.text || "I couldn't process that request.";
  } catch (error) {
    console.error("AI Query Failed", error);
    return "Sorry, I encountered an error while processing your query.";
  }
};

// --- Live Audio Utilities ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      // remove data url part
      resolve(base64data.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export function createPcmBlob(data: Float32Array): { mimeType: string; data: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export function decodeAudio(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}