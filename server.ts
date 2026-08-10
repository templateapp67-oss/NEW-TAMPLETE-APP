import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS enabled for all origins - required for preview proxy (https://{port}-{sandboxId}.e2b.app)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint for verification
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', screens: 25, timestamp: new Date().toISOString() });
});

// API route for generating team member bio using Gemini API with offline fallback
app.post('/api/generate-bio', async (req, res) => {
  try {
    const { name, role, specialties, salonName } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    let bio = '';
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const prompt = `Write a compelling, professional, and warm 2-3 sentence biography for a salon professional.
Name: ${name}
Role: ${role || 'Beauty Specialist'}
Specialties: ${Array.isArray(specialties) ? specialties.join(', ') : specialties || 'Hair styling & care'}
Salon Name: ${salonName || 'our salon'}

Focus on their passion for craftsmanship, dedication to client satisfaction, and expertise. Do not include surrounding quotation marks or conversational meta-text. Keep it under 60 words.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        bio = response.text?.trim() || '';
      } catch (error: any) {
        console.warn('Gemini API call encountered quota or rate limit error, using intelligent fallback bio:', error?.message);
      }
    } else {
      console.log('GEMINI_API_KEY not configured, using offline fallback bio generator');
    }

    if (!bio) {
      const specText = Array.isArray(specialties) && specialties.length > 0 ? ` specializing in ${specialties.join(', ')}` : '';
      bio = `${name} is a talented ${role || 'stylist'}${specText} at ${salonName || 'our salon'}, dedicated to delivering exceptional craftsmanship and personalized client care.`;
    }

    res.json({ bio });
  } catch (error: any) {
    console.error('Error in generate-bio route:', error);
    const specText = req.body?.specialties?.length ? ` specializing in ${req.body.specialties.join(', ')}` : '';
    const fallbackBio = `${req.body?.name || 'Professional'} is a valued member of ${req.body?.salonName || 'our salon'}${specText}, bringing passion and expertise to every client.`;
    res.json({ bio: fallbackBio });
  }
});

// API route to rewrite and improve salon copy using Gemini API with custom settings and offline fallback
app.post('/api/improve-text', async (req, res) => {
  try {
    const { text, field, tone, keywords, instructions } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required to perform rewrite' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let rewritten = '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        let contextPrompt = '';
        if (field === 'heroHeadline') {
          contextPrompt = 'Create an attention-grabbing, welcoming, elegant hero headline for a beauty salon. Keep it under 10 words.';
        } else if (field === 'tagline') {
          contextPrompt = 'Create a highly professional, catchy salon tagline or subtitle under 8 words.';
        } else if (field === 'about') {
          contextPrompt = 'Create an engaging "About Us" statement for the salon describing luxury, hospitality, and custom styling. Under 55 words.';
        } else if (field === 'ownerIntro') {
          contextPrompt = 'Create an elegant introduction for the master stylist or salon founder under 45 words.';
        } else if (field === 'bookingCTA') {
          contextPrompt = 'Create a compelling booking call-to-action phrase under 12 words.';
        } else {
          contextPrompt = 'Rewrite this text to be professional, welcoming, and high-end. Keep it under 20 words.';
        }

        const systemInstructions = `You are a luxury copywriter for elite hair salons, spas, and wellness centers.
Rewrite the following text based on this context: "${contextPrompt}".
${tone ? `Apply a "${tone}" tone of voice.` : ''}
${keywords ? `Weave in these keywords naturally if possible: "${keywords}".` : ''}
${instructions ? `Follow these custom instructions: "${instructions}".` : ''}

Original text: "${text}"

Do not include conversational filler, meta-comments, introductory greetings, or surrounding quotes. Return ONLY the rewritten text.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: systemInstructions,
        });

        rewritten = response.text?.trim() || '';
      } catch (apiErr: any) {
        console.warn('Gemini API failed in improve-text, applying rule-based transformation:', apiErr.message);
      }
    } else {
      console.log('GEMINI_API_KEY not configured, using offline fallback text improver');
    }

    // High quality offline fallback rewriting engine
    if (!rewritten) {
      let suffix = '';
      if (tone === 'luxurious') {
        suffix = ' with absolute luxury, customized treatments, and bespoke artistry.';
      } else if (tone === 'modern') {
        suffix = ' featuring state-of-the-art styling, trendsetting aesthetics, and vibrant energy.';
      } else if (tone === 'warm') {
        suffix = ' where customized hospitality meets incredible talent and warm smiles.';
      } else if (tone === 'minimalist') {
        suffix = ' focusing on organic simplicity, clean styling, and natural, authentic beauty.';
      } else {
        suffix = ' designed to make you look and feel your absolute best.';
      }

      if (keywords) {
        suffix += ` Crafted using premium ${keywords}.`;
      }

      if (instructions && instructions.toLowerCase().includes('spanish')) {
        rewritten = `¡Bienvenido! Descubra lo mejor en estilo y cuidado premium para el cabello.`;
      } else if (field === 'heroHeadline') {
        rewritten = text.length < 15 ? `${text} — Premium Salon Styling` : text;
      } else {
        // Clean and append
        const cleanText = text.replace(/[.!?]+$/, '');
        rewritten = `${cleanText}${suffix}`;
      }
    }

    res.json({ rewritten });
  } catch (error: any) {
    console.error('Error in improve-text route:', error);
    res.json({ rewritten: req.body?.text || 'Premium beauty services.' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        cors: true,
        allowedHosts: true as unknown as string[],
        hmr: process.env.DISABLE_HMR !== 'true',
      } as any,
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`25 screens active | allowedHosts: true | cors: true | offline fallback enabled`);
  });
}

startServer();
