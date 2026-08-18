
import { GoogleGenAI, Type } from "@google/genai";
import { AppData } from "../types";

export const getSettlementAdvice = async (data: AppData, userQuery?: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are "DrinkSplit AI", a sophisticated party expense assistant. 
    You have access to the following party data:
    Friends: ${JSON.stringify(data.friends)}
    Venues: ${JSON.stringify(data.venues)}
    Bills: ${JSON.stringify(data.bills)}
    
    Rules for response:
    1. Always answer in Thai.
    2. Use a friendly, energetic "party animal" tone.
    3. If the user asks a specific question, answer it accurately based on the data provided.
    4. If no specific question is asked, provide a general summary of who owes whom and the Banker of the night.
    5. Use Markdown for formatting.
  `;

  const prompt = userQuery || "ช่วยสรุปภาพรวมหนี้สินและแนะนำวิธีจัดการให้หน่อย";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "ขออภัยครับ ระบบ AI วิเคราะห์ข้อมูลขัดข้องในขณะนี้ แต่คุณยังสามารถดูยอดค้างชำระได้ตามปกติครับ";
  }
};
