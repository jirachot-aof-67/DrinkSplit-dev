import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'ไม่พบรูปภาพสลิป' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      // Return smart simulated OCR if API key not yet set in .env
      return NextResponse.json({
        success: true,
        extracted: {
          amount: 1200,
          receiver: 'นาย จิรโชติ (PromptPay)',
          date: new Date().toISOString(),
          status: 'VALID',
          note: 'ระบบจำลองการอ่านสลิป (กรุณาใส่ GEMINI_API_KEY ใน .env.local เพื่อใช้ Gemini AI OCR จริง)',
        },
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                mimeType: mimeType || 'image/jpeg',
              },
            },
            {
              text: 'ช่วยอ่านสลิปโอนเงินนี้ และตอบกลับเป็น JSON เท่านั้นในรูปแบบ: {"amount": number, "receiver": string, "sender": string, "date": string, "transactionId": string}',
            },
          ],
        },
      ],
    });

    const text = response.text || '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, extracted: parsed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'AI OCR Failed' }, { status: 500 });
  }
}
