import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
const getAi = () => {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'alfaz-app',
        },
      },
    });
  }
  return aiClient;
};

// Healthcheck API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Auto-Fill / Vocabulary Enrichment Route
app.post('/api/ai/enrich-word', async (req, res) => {
  try {
    const { arabicWord, banglaMeaning } = req.body;
    if (!arabicWord && !banglaMeaning) {
      return res.status(400).json({ error: 'At least Arabic word or Bangla meaning is required.' });
    }

    const ai = getAi();
    const prompt = `You are an expert Arabic-Bangla linguist. 
Analyze the input and provide detailed Arabic vocabulary information for an educational learning app.

Input Arabic Word: ${arabicWord || 'Not provided'}
Input Bangla Meaning: ${banglaMeaning || 'Not provided'}

Return a clean JSON object with EXACTLY these keys:
{
  "arabic": "Arabic word with full Harakat/diacritics (e.g., كِتَابٌ)",
  "transliteration": "Clear Bengali phonetic transliteration (e.g., কিতাবুন)",
  "banglaMeaning": "Accurate, natural Bengali meaning",
  "antonymArabic": "Arabic antonym/opposite with diacritics if applicable (e.g., قَبِيحٌ)",
  "antonymBangla": "Bangla meaning of the antonym",
  "category": "One category from: 'বিশেষ্য', 'বিশেষণ', 'ক্রিয়াপদ', 'শুভেচ্ছা ও সাধারণ', 'পরিবার', 'খাবার ও পানীয়', 'কুরআনিক শব্দ', 'প্রকৃতি', 'সময়', 'সংখ্যা'",
  "exampleArabic": "Short natural example sentence in Arabic with diacritics",
  "exampleBangla": "Bangla translation of the example sentence"
}

Return ONLY valid JSON. No markdown wrappers.`;

    let responseText = '';
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr: any) {
        lastError = modelErr;
        console.warn(`Model ${modelName} enrichment attempt notice:`, modelErr?.message || modelErr);
      }
    }

    if (!responseText) {
      const isQuotaOrDenied =
        lastError?.status === 429 ||
        lastError?.status === 403 ||
        lastError?.message?.includes('429') ||
        lastError?.message?.includes('403') ||
        lastError?.message?.includes('RESOURCE_EXHAUSTED') ||
        lastError?.message?.includes('PERMISSION_DENIED');

      const userMessage = isQuotaOrDenied
        ? 'এআই পরিষেবাটির আজকের দৈনিক কোটা শেষ অথবা সাময়িকভাবে ব্যস্ত আছে। অনুগ্রহ করে ম্যানুয়ালি ফর্মটি পূরণ করুন।'
        : 'এআই পরিষেবা থেকে উত্তর পেতে সমস্যা হয়েছে। অনুগ্রহ করে ম্যানুয়ালি তথ্য প্রদান করুন।';

      return res.status(200).json({
        success: false,
        error: userMessage,
        details: lastError?.message || 'Gemini API call failed',
      });
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.json({ success: true, data: parsedData });
  } catch (err: any) {
    console.warn('AI vocabulary enrichment error caught safely:', err?.message || err);
    return res.status(200).json({
      success: false,
      error: 'এআই পরিষেবাটি এই মুহূর্তে সংযোগ করতে পারছে না। অনুগ্রহ করে ম্যানুয়ালি তথ্যগুলো পূরণ করুন।',
      details: err?.message || String(err),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'development') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
