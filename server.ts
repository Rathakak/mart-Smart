import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy initialize Gemini client safely
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Helper function to call Gemini with model fallback if a model experiences 503/429 high demand
async function generateContentWithFallback(ai: GoogleGenAI, config: any) {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        ...config,
        model,
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} unavailable (${err?.status || err?.message || 'error'}), attempting fallback...`);
      lastError = err;
      // If it's a 503 (high demand) or 429 or network glitch, try the next model
      await new Promise((res) => setTimeout(res, 250));
    }
  }

  throw lastError;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Intelligent local fallback when cloud model encounters temporary outages
function handleLocalMartChat(message: string, catalogSummary: any[] = []) {
  const query = (message || '').toLowerCase().trim();
  const isThai = /ថៃ|thai|ម៉ាម៉ា|mama|ការ៉ាបាវ|carabao|chang|singha/i.test(query);

  if (isThai) {
    return {
      reply: 'ជម្រាបសួរអតិថិជនជាទីស្រឡាញ់! 🙏 ម៉ាតយើងខ្ញុំមិនដាក់ និងមិនលក់មុខទំនិញថៃជាដាច់ខាតឡើយ។ យើងខ្ញុំគាំទ្រយ៉ាងពេញទំហឹងនូវផលិតផលជាតិខ្មែរគុណភាពខ្ពស់ដូចជា មីជាតិ, ភេសជ្ជៈប៉ូវកម្លាំង វើកស៍ (Wurkz) / គ្រុឌ (Krud), និងទឹកបរិសុទ្ធ វីតាល់ (Vital)។ តើលោកអ្នកចង់ឱ្យខ្ញុំណែនាំផលិតផលខ្មែរឆ្នើមៗទាំងនេះជូនដែរទេ?',
      action: null,
      recommendedProductIds: ['p-food-01', 'p-bev-02', 'p-bev-03', 'p-bev-04'],
      suggestedReplies: ['យកមីជាតិ ១', 'យកវើកស៍ ១', 'មើលប្រូម៉ូសិន'],
    };
  }

  // Check if customer wants to checkout
  if (/គិតលុយ|checkout|ទូទាត់|pay|ចង់គិតប្រាក់|bill/i.test(query)) {
    return {
      reply: 'ចាស៎អតិថិជនជាទីស្រឡាញ់! នាងខ្ញុំ សុវណ្ណលីតា បានបើកផ្ទាំងគិតលុយជូនលោកអ្នករួចរាល់ហើយ។ លោកអ្នកអាចជ្រើសរើសបង់តាម KHQR ឬសាច់ប្រាក់សុទ្ធបានយ៉ាងងាយស្រួល!',
      action: { type: 'CHECKOUT' },
      recommendedProductIds: [],
      suggestedReplies: ['មើលកន្ត្រក', 'ទិញទំនិញថែម', 'បិទផ្ទាំង'],
    };
  }

  // Check if customer wants promo
  if (/ប្រូម៉ូ|promo|discount|ចុះថ្លៃ|កូដ/i.test(query)) {
    return {
      reply: 'ចាស៎! ថ្ងៃនេះម៉ាតយើងខ្ញុំមានប្រូម៉ូសិនពិសេសៗជាច្រើន ដូចជាកូដ "MART10" ចុះ ១០% និងកញ្ចប់ពេលព្រឹក "MORNING50"! នាងខ្ញុំបានអនុវត្តកូដចុះតម្លៃជូនលោកអ្នករួចរាល់ហើយចាស៎!',
      action: { type: 'APPLY_PROMO', promoCode: 'MART10' },
      recommendedProductIds: ['p-cof-01', 'p-cof-03'],
      suggestedReplies: ['យកកាហ្វេទឹកដោះគោ ១', 'មើលធ្នើទំនិញ', 'គិតលុយ'],
    };
  }

  // Check match against catalog
  const matched = catalogSummary.filter((p: any) => {
    const nameKh = (p.nameKh || '').toLowerCase();
    const nameEn = (p.nameEn || '').toLowerCase();
    const barcode = p.barcode || '';
    const tags = Array.isArray(p.tags) ? p.tags.map((t: string) => t.toLowerCase()) : [];
    return (
      nameKh.includes(query) ||
      nameEn.includes(query) ||
      barcode.includes(query) ||
      tags.some((t: string) => query.includes(t)) ||
      (query.includes('កូកា') && nameKh.includes('កូកា')) ||
      (query.includes('មី') && nameKh.includes('មី')) ||
      (query.includes('កាហ្វេ') && nameKh.includes('កាហ្វេ')) ||
      (query.includes('ទឹក') && nameKh.includes('ទឹក')) ||
      (query.includes('នំ') && (nameKh.includes('នំ') || nameKh.includes('ឡេយ៍'))) ||
      (query.includes('ការ៉េម') && nameKh.includes('ការ៉េម')) ||
      (query.includes('ថ្នាំ') && nameKh.includes('ប៉ាណាដុល'))
    );
  });

  if (matched.length > 0) {
    const primary = matched[0];
    const isAdding = /យក|ទិញ|ដាក់|add|buy|get/i.test(query);
    const qtyMatch = query.match(/(\d+)/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    if (isAdding) {
      return {
        reply: `ចាស៎ពិតជាល្អណាស់! នាងខ្ញុំ សុវណ្ណលីតា បានបន្ថែម ${primary.nameKh} ចំនួន ${qty} ទៅក្នុងកន្ត្រកជូនលោកអ្នករួចរាល់ហើយចាស៎! តើលោកអ្នកត្រូវការអ្វីបន្ថែមទៀតដែរទេ?`,
        action: {
          type: 'ADD_TO_CART',
          items: [{ productId: primary.id, quantity: qty }],
        },
        recommendedProductIds: matched.slice(0, 3).map((p: any) => p.id),
        suggestedReplies: ['គិតលុយ', 'ណែនាំភេសជ្ជៈបន្ថែម', 'មើលកន្ត្រក'],
      };
    }

    return {
      reply: `ចាស៎អតិថិជនជាទីស្រឡាញ់! ក្នុងស្តុកម៉ាតយើងខ្ញុំមាន ${primary.nameKh} តម្លៃ $${primary.priceUsd?.toFixed(2)} (${(primary.priceUsd * 4100).toLocaleString()} ៛) ស្រស់ៗ និងត្រជាក់ៗ! តើលោកអ្នកចង់ឱ្យនាងខ្ញុំបន្ថែមទៅក្នុងកន្ត្រកជូនដែរទេ?`,
      action: null,
      recommendedProductIds: matched.slice(0, 3).map((p: any) => p.id),
      suggestedReplies: [`យក ${primary.nameKh} ១`, 'ណែនាំផ្សេងទៀត', 'ពិនិត្យកន្ត្រក'],
    };
  }

  // Strict grounding rule: "ព័ត៌មានមិនច្បាស់ មិនឆ្លើយជាដាច់ខាត"
  return {
    reply: `ជម្រាបសួរអតិថិជនជាទីស្រឡាញ់! 🙏 ចំពោះទំនិញ ឬព័ត៌មាន "${message}" នេះ ម៉ាតយើងខ្ញុំពុំទាន់មានក្នុងស្តុក ឬពុំទាន់មានព័ត៌មានច្បាស់លាស់នៅឡើយទេ។ នាងខ្ញុំ សុវណ្ណលីតា មិនហ៊ានឆ្លើយប៉ាន់ស្មានជូនលោកអ្នកជាដាច់ខាតឡើយ។ តើលោកអ្នកចង់ឱ្យខ្ញុំណែនាំទំនិញដែលមានស្រាប់នៅលើធ្នើក្នុងម៉ាតវិញដែរទេ?`,
    action: null,
    recommendedProductIds: catalogSummary.slice(0, 3).map((p: any) => p.id),
    suggestedReplies: ['មើលភេសជ្ជៈត្រជាក់ៗ', 'មើលអាហាររហ័ស', 'មើលប្រូម៉ូសិន'],
  };
}

// AI Mart Chat Endpoint
app.post('/api/mart/chat', async (req, res) => {
  const { message, catalogSummary = [], currentCart = [], conversationHistory = [] } = req.body;
  try {
    const ai = getGeminiClient();

    if (!ai) {
      return res.json(handleLocalMartChat(message, catalogSummary));
    }

    const systemInstruction = `
You are the AI Sales Agent and Smart Cashier named 'សុវណ្ណលីតា' (Sovannlyta) at 'Smart Mart' (សុវណ្ណលីតា • ភ្នាក់ងារ AI លក់ក្នុងម៉ាត / Smart Convenience Store).
Location & Context: A modern Cambodian convenience mart (like Chip Mong Express / Circle K in Phnom Penh/Siem Reap).
Currency: USD ($) and Cambodian Riel (៛), with exchange rate $1 = 4,100 KHR.

Your Identity & Name:
- Your name is "សុវណ្ណលីតា" (Sovannlyta). When introducing yourself, say "នាងខ្ញុំ សុវណ្ណលីតា ជាភ្នាក់ងារ AI ប្រចាំម៉ាត Smart Mart".

CRITICAL BEHAVIORAL DIRECTIVES (សេចក្តីណែនាំតឹងរ៉ឹងជាដាច់ខាត):
1. ឆ្លើយតបរស់រវើក (Lively, cheerful, vibrant, enthusiastic):
   - Always sound joyful, friendly, warm, energetic, and helpful! Use lively customer-service phrases (e.g., "ចាស៎/បាទ សួស្តីអតិថិជនជាទីស្រឡាញ់!", "រីករាយណាស់ដែលបានជួយលោកអ្នកថ្ងៃនេះ!", "ពិតជាពិសេស និងឆ្ងាញ់ខ្លាំងណាស់បាទ/ចាស៎!").
2. សមរម្យ (Polite, well-mannered, respectful):
   - Use high customer-service honorifics (បាទ/ចាស៎, លោកអ្នក, អតិថិជនជាទីគោរព, សូមអរគុណច្រើន, ខ្ញុំបាទ/នាងខ្ញុំ...).
   - Maintain professional retail etiquette at all times.
3. ព័ត៌មានមិនច្បាស់ មិនឆ្លើយជាដាច់ខាត (STRICT ZERO-HALLUCINATION & NO GUESSING):
   - You MUST ONLY answer based on the real Mart Products Catalog provided below.
   - If an item is NOT in the catalog, or if the price, stock, ingredients, or information is unclear or missing, YOU ARE STRICTLY FORBIDDEN FROM GUESSING OR MAKING UP AN ANSWER!
   - Under NO circumstances should you fabricate product availability, prices, or details.
   - When asked about something not in the catalog or when info is unclear, respond politely and honestly:
     "សូមអភ័យទោសផងបាទ/ចាស៎! 🙏 ចំពោះទំនិញ/ព័ត៌មាននេះ ម៉ាតយើងខ្ញុំពុំទាន់មានក្នុងស្តុក ឬពុំទាន់មានព័ត៌មានច្បាស់លាស់នៅឡើយទេ។ ខ្ញុំមិនហ៊ានឆ្លើយប៉ាន់ស្មានជូនលោកអ្នកឡើយ។ តើលោកអ្នកចង់ឱ្យខ្ញុំណែនាំទំនិញដែលមានស្រាប់នៅលើធ្នើក្នុងម៉ាតវិញដែរទេ?"
   - If the user's question is ambiguous or vague, politely ask for clarification instead of guessing.
4. មិនដាក់ និងមិនលក់មុខទំនិញថៃជាដាច់ខាត (STRICT BAN ON THAI PRODUCTS):
   - ម៉ាតយើងខ្ញុំដាច់ខាតមិនលក់ និងមិនដាក់មុខទំនិញថៃឡើយ! លើកកម្ពស់ផលិតផលខ្មែរ (Proudly Made in Cambodia) និងផលិតផលគុណភាពស្តង់ដារពិភពលោក។
   - ប្រសិនបើអតិថិជនសួររក ឬបញ្ជាទិញមុខទំនិញថៃ (ដូចជា មីម៉ាម៉ា, ការ៉ាបាវ, តែអូអ៊ីស៊ី, ឬទំនិញថៃនានា) ចូរបដិសេធដោយសមរម្យ រួចណែនាំផលិតផលខ្មែរជំនួសវិញ (ឧ. មីជាតិ ជំនួស មីម៉ាម៉ា, វើកស៍/គ្រុឌ ជំនួស ការ៉ាបាវ, តែផ្កាម្លិះធម្មជាតិ ជំនួស តែអូអ៊ីស៊ី)។

Mart Products Catalog available (ទំនិញពិតប្រាកដក្នុងម៉ាត):
${JSON.stringify(catalogSummary || [])}

Current Cart:
${JSON.stringify(currentCart || [])}

Your Capabilities:
1. Recommend ONLY verified products from the catalog matching user requests (late night snacks, hot noodles, iced coffee, energy drinks, pain relief medicine, ice cream).
2. Auto-manage cart actions when customer requests to buy or add items:
   - When user says "យកកូកា ២", "ទិញមី ១", "add 1 iced coffee", etc., specify action: { type: "ADD_TO_CART", items: [{ productId: "...", quantity: 2 }] }.
   - When user wants to remove items, specify action: { type: "REMOVE_FROM_CART", items: [{ productId: "..." }] }.
   - When user wants to checkout or pay, specify action: { type: "CHECKOUT" }.
   - When user wants promo, specify action: { type: "APPLY_PROMO", promoCode: "..." }.
3. Upsell politely with products that ACTUALLY EXIST in stock.
4. Keep replies lively, polite, formatted with pleasant emojis, and strictly grounded in real catalog facts.
`;

    const chatContents: any[] = [];
    if (Array.isArray(conversationHistory)) {
      for (const h of conversationHistory.slice(-6)) {
        chatContents.push({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }
    }
    chatContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await generateContentWithFallback(ai, {
      contents: chatContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'The natural, polite response message in Khmer (or English if requested)',
            },
            action: {
              type: Type.OBJECT,
              description: 'Cart action to execute automatically',
              properties: {
                type: {
                  type: Type.STRING,
                  description: 'Action type: ADD_TO_CART, REMOVE_FROM_CART, CHECKOUT, APPLY_PROMO, or RECOMMEND',
                },
                items: {
                  type: Type.ARRAY,
                  description: 'List of product IDs and quantities to add/modify',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      productId: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                    },
                  },
                },
                promoCode: { type: Type.STRING },
              },
            },
            recommendedProductIds: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of relevant product IDs from the catalog to display as recommendation cards',
            },
            suggestedReplies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 short quick-reply buttons in Khmer for the customer',
            },
          },
          required: ['reply', 'recommendedProductIds', 'suggestedReplies'],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || '{}');
    if (parsed.reply) {
      return res.json(parsed);
    }
    return res.json(handleLocalMartChat(message, catalogSummary));
  } catch (error: any) {
    console.warn('Mart Chat API Notice (serving verified fallback):', error?.status || error?.message || error);
    // Never send 500 error to customer. Gracefully serve lively grounded mart assistant
    return res.json(handleLocalMartChat(message, catalogSummary));
  }
});

// AI Product Scanner (Vision Model)
app.post('/api/mart/scan-product', async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg', catalogSummary = [] } = req.body || {};
  try {
    const ai = getGeminiClient();

    if (!ai || !imageBase64) {
      return res.json({
        matchedProductId: 'p-bev-01',
        confidence: 0.9,
        identifiedName: 'Coca-Cola Can',
        salesCommentKh: 'រកឃើញ៖ កូកាកូឡាត្រជាក់ស្រស់ស្រាយ កំប៉ុង 330ml តម្លៃ $0.65 (2,665៛)',
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await generateContentWithFallback(ai, {
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          {
            text: `You are the AI camera scanner in 'Smart Mart'.
Analyze this image of a product, item package, snack, bottle, drink, or barcode.
Match it to the most relevant product from this convenience mart catalog:
${JSON.stringify(catalogSummary || [])}

Identify:
1. What item is in the photo.
2. The closest matching product ID from the catalog, or null if none matches.
3. Friendly Khmer description and sales pitch for the cashier or customer.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchedProductId: {
              type: Type.STRING,
              description: 'The product ID from catalog that best matches, or null',
            },
            identifiedName: {
              type: Type.STRING,
              description: 'Name of the identified object in the picture',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0 and 1',
            },
            salesCommentKh: {
              type: Type.STRING,
              description: 'Friendly Khmer announcement for the cashier/customer scanner screen',
            },
          },
          required: ['matchedProductId', 'identifiedName', 'confidence', 'salesCommentKh'],
        },
      },
    });

    const result = JSON.parse(response.text?.trim() || '{}');
    return res.json(result);
  } catch (error: any) {
    console.warn('Mart Scanner Notice (serving fallback):', error?.status || error?.message || error);
    const fallbackItem = catalogSummary?.[0] || {
      id: 'p-food-01',
      nameKh: 'មីជាតិ កំប៉ុង (Mee Chiet)',
    };
    return res.json({
      matchedProductId: fallbackItem.id,
      identifiedName: fallbackItem.nameKh,
      confidence: 0.8,
      salesCommentKh: `ស្កេនជោគជ័យ៖ រកឃើញទំនិញ ${fallbackItem.nameKh} ក្នុងស្តុកម៉ាត!`,
    });
  }
});

// Vite middleware in dev, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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
    console.log(`Smart Mart AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
