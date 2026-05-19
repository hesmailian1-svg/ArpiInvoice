import { GoogleGenAI, Type } from "@google/genai";
import { SERVICE_OPTIONS } from "./constants";

// Initialize the client with the API Key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface MediaPart {
  mimeType: string;
  data: string;
}

/**
 * Parses unstructured text and optional media (images/PDFs) into structured invoice items using Gemini.
 * Uses the powerful gemini-3-pro-preview for complex extraction and reasoning.
 */
export async function parseInvoiceItems(text: string, defaultDate: string, media?: MediaPart) {
  const serviceList = SERVICE_OPTIONS.map(s => s.name).join(", ");
  
  const promptText = `You are an invoice assistant for a Home Health Nurse.
    Extract invoice items from the provided text and/or attached document/image.
    
    Context:
    - Current Year: ${new Date().getFullYear()}
    - Default Date (if not specified): ${defaultDate}
    - Available Services: ${serviceList} (Try to map loosely to these, otherwise use the text provided)
    
    Instructions:
    - Return a JSON array of items.
    - If a specific date is mentioned (e.g. "Monday", "10/24"), calculate the date based on the current context or use the explicit date.
    - Extract miles if mentioned.
    - Default quantity is 1 unless specified.
    - If the input is an image of a handwritten log, do your best to transcribe it accurately.
    
    Additional Text Context: "${text}"`;

  const parts: any[] = [{ text: promptText }];

  if (media) {
    parts.unshift({
      inlineData: {
        mimeType: media.mimeType,
        data: media.data
      }
    });
  }
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "YYYY-MM-DD" },
            patientName: { type: Type.STRING, nullable: true },
            serviceName: { type: Type.STRING, nullable: true },
            description: { type: Type.STRING, nullable: true },
            miles: { type: Type.NUMBER, nullable: true },
            quantity: { type: Type.NUMBER, nullable: true },
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "[]");
}

/**
 * Polishes text to be more professional using the fast Gemini Flash model.
 */
export async function polishText(text: string) {
  if (!text || text.trim().length === 0) return "";
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Rewrite the following text to be professional, clear, and polite. It is for a nursing invoice. Keep it concise.
    
    Original Text: "${text}"`,
  });

  return response.text?.trim() || text;
}

/**
 * Generates a visual representation of the invoice using Nano Banana (gemini-2.5-flash-image).
 */
export async function generateInvoiceImage(data: any, total: number) {
  const prompt = `Create a high-quality, professional image of a printed invoice document.
  
  HEADER:
  Arpi Moradi, RN - Registered Nurse
  5239 Harter Lane, La Canada, CA 91101
  Phone: 818-515-8980
  
  CLIENT: ${data.billToName || 'Client Name'}
  
  DETAILS:
  Invoice #${data.invoiceNumber}
  Date: ${data.date}
  Total Amount Due: $${total.toFixed(2)}
  
  The design should be clean, professional, medical aesthetic, with Navy Blue branding.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "3:4"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Image generation failed");
}