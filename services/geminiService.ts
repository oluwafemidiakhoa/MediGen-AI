
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ChatMessage, AnatomicalStructure, RadiologyReport, SurgicalPlan } from "../types";

// Helper to get fresh client instance
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Decoding Helpers
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
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

export const playAudio = async (base64Audio: string) => {
  try {
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);

    const audioBytes = decode(base64Audio);
    const audioBuffer = await decodeAudioData(
      audioBytes,
      outputAudioContext,
      24000,
      1,
    );
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputNode);
    source.start();
  } catch (e) {
    console.error("Audio playback error:", e);
  }
};


// Existing image generation function
export const editImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("No image generated in the response.");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

export const analyzeImage = async (
  base64Image: string,
  mimeType: string
): Promise<AnatomicalStructure[]> => {
  try {
    const ai = getAiClient();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this medical image. Identify the visible anatomical structures, organs, or tissues. 
                   Return a list of identified items.
                   For each item, provide a bounding box [ymin, xmin, ymax, xmax] where values are 0-100 representing the percentage of the image dimensions.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              medicalRelevance: { type: Type.STRING },
              confidence: { type: Type.NUMBER, description: "Confidence score 0-100" },
              box_2d: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: "[ymin, xmin, ymax, xmax] in percentage 0-100"
              }
            },
            required: ["name", "description", "medicalRelevance", "box_2d"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return JSON.parse(text) as AnatomicalStructure[];
  } catch (error) {
    console.error("Error analyzing image:", error);
    return [];
  }
};

// Generate Radiology Report
export const generateRadiologyReport = async (
  base64Image: string,
  mimeType: string,
  clinicalContext: string
): Promise<RadiologyReport> => {
  try {
    const ai = getAiClient();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `Act as a senior Radiologist. Generate a professional Radiology Report for this image.
                   Clinical Context provided: "${clinicalContext}".
                   Include findings, impression, and recommendations.
                   Invent a realistic patient ID and assume today's date.
                   Infer the modality (X-Ray, MRI, CT, Ultrasound) from the image.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            patientId: { type: Type.STRING },
            modality: { type: Type.STRING },
            date: { type: Type.STRING },
            clinicalHistory: { type: Type.STRING },
            findings: { type: Type.ARRAY, items: { type: Type.STRING } },
            impression: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["findings", "impression", "recommendations", "modality"]
        }
      }
    });

    return JSON.parse(response.text) as RadiologyReport;
  } catch (error) {
    console.error("Error generating report:", error);
    throw error;
  }
};

// Generate Healthy Reference (Synthetic Normal)
export const generateHealthyReference = async (
  base64Image: string,
  mimeType: string
): Promise<string> => {
  try {
    // We use the image editing model to "heal" the image
    const prompt = "Generate a perfectly healthy, normal anatomical reference based on this medical image. Remove any pathologies, fractures, tumors, or anomalies. Maintain the exact same view, angle, lighting, and style as the original image. The output should be a healthy version of the input.";
    return await editImage(base64Image, mimeType, prompt);
  } catch (error) {
    console.error("Error generating healthy reference:", error);
    throw error;
  }
};

// Generate 3D Video
export const generateMedicalVideo = async (
  prompt: string,
  base64Image?: string,
  mimeType?: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    let operation;
    
    const enhancedPrompt = `Cinematic medical animation, 360 degree slow rotation of ${prompt}, anatomical 3D visualization, volumetric lighting, isolated on black background, high fidelity, 4k.`;

    if (base64Image && mimeType) {
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: enhancedPrompt,
        image: {
          imageBytes: cleanBase64,
          mimeType: mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9' // Use landscape for better holographic presentation
        }
      });
    } else {
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: enhancedPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    }

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed");

    // Fetch the actual video blob
    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
};

// Medical Chat Assistant
export const sendChatMessage = async (
  history: ChatMessage[],
  newMessage: string,
  base64Image: string,
  mimeType: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    // Convert app history to Gemini format
    const chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: chatHistory,
      config: {
        systemInstruction: "You are an expert medical diagnostic AI assistant. You are analyzing a specific medical image provided by the user. Answer questions about pathologies, anatomy, and potential treatments professionally but with a disclaimer that you are an AI.",
      }
    });

    const result = await chat.sendMessage({
      message: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          { text: newMessage }
        ]
      }
    });

    return result.text || "I could not generate a response.";
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

// Generate Surgical Plan
export const generateSurgicalPlan = async (
  base64Image: string,
  mimeType: string,
  findings: string
): Promise<SurgicalPlan> => {
  try {
    const ai = getAiClient();
    const cleanBase64 = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `Based on the identified findings: "${findings}", create a detailed Surgical Plan or Treatment Protocol.
                   Provide the procedure name, anesthesia type, patient positioning, a step-by-step procedural guide, and potential risks.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            procedureName: { type: Type.STRING },
            anesthesiaType: { type: Type.STRING },
            patientPositioning: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            risks: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["procedureName", "anesthesiaType", "steps", "risks"]
        }
      }
    });

    return JSON.parse(response.text) as SurgicalPlan;
  } catch (error) {
    console.error("Error generating surgical plan:", error);
    throw error;
  }
};

// Text to Speech
export const generateAudioBriefing = async (text: string) => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Medical Briefing. ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deep, professional voice
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      await playAudio(base64Audio);
    }
  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
};
