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

/* ------------------------------------------------------------------ *
 * Nominatim geocoding proxy
 *
 * Nominatim's usage policy requires (a) at most 1 request/second and
 * (b) a valid User-Agent / Referer identifying the application. Browsers
 * forbid setting User-Agent, so all geocoding is proxied through here where
 * the header can legitimately be set. Results are cached, as the policy asks.
 * Policy: https://operations.osmfoundation.org/policies/nominatim/
 * ------------------------------------------------------------------ */

// Official Nominatim endpoint. Configurable via env so the service can be
// switched without a code change, as the usage policy requires.
const NOMINATIM_BASE =
  process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org';

// Nominatim requires a User-Agent/Referer that identifies the application with
// a real contact. Browsers cannot set User-Agent, which is why geocoding is
// proxied through this existing Express server. There is no placeholder
// fallback: if the identifier is not configured, geocoding is disabled rather
// than sending an unidentified request.
const NOMINATIM_APP = process.env.NOMINATIM_APP_IDENTIFIER;
const NOMINATIM_REFERER = process.env.NOMINATIM_REFERER;
const NOMINATIM_CONFIGURED = Boolean(NOMINATIM_APP);

const NOMINATIM_MIN_INTERVAL_MS = 1100;
const NOMINATIM_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const geocodeCache = new Map<string, { at: number; body: unknown }>();
let nominatimLastRequestAt = 0;
let nominatimQueue: Promise<unknown> = Promise.resolve();

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Server-side global rate guard: one in-flight request at a time, >= 1.1s apart.
function nominatimRateLimited<T>(task: () => Promise<T>): Promise<T> {
  const run = nominatimQueue.then(async () => {
    const waitFor = nominatimLastRequestAt + NOMINATIM_MIN_INTERVAL_MS - Date.now();
    if (waitFor > 0) await delay(waitFor);
    nominatimLastRequestAt = Date.now();
    return task();
  });
  nominatimQueue = run.then(() => undefined, () => undefined);
  return run;
}

async function callNominatim(pathAndQuery: string): Promise<unknown> {
  const cached = geocodeCache.get(pathAndQuery);
  if (cached && Date.now() - cached.at < NOMINATIM_CACHE_TTL_MS) {
    return cached.body;
  }

  const body = await nominatimRateLimited(async () => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': NOMINATIM_APP as string,
    };
    if (NOMINATIM_REFERER) headers.Referer = NOMINATIM_REFERER;

    const response = await fetch(`${NOMINATIM_BASE}${pathAndQuery}`, { headers });
    if (!response.ok) {
      throw new Error(`Nominatim responded ${response.status}`);
    }
    return response.json();
  });

  geocodeCache.set(pathAndQuery, { at: Date.now(), body });
  return body;
}

// Forward geocoding: address -> coordinates. Triggered only by "Find Location".
app.get('/api/geocode/search', async (req, res) => {
  if (!NOMINATIM_CONFIGURED) {
    console.error('NOMINATIM_APP_IDENTIFIER is not set; refusing to send an unidentified request.');
    return res.status(503).json({ error: 'Address lookup is unavailable right now.' });
  }
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 3) {
    return res.status(400).json({ error: 'A longer address is required.' });
  }
  try {
    const data = await callNominatim(
      `/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`,
    );
    res.json(data);
  } catch (error) {
    console.error('Nominatim search failed:', error);
    res.status(502).json({ error: 'Could not look up that address right now.' });
  }
});

// Reverse geocoding: coordinates -> address. Triggered only by marker dragend.
app.get('/api/geocode/reverse', async (req, res) => {
  if (!NOMINATIM_CONFIGURED) {
    console.error('NOMINATIM_APP_IDENTIFIER is not set; refusing to send an unidentified request.');
    return res.status(503).json({ error: 'Address lookup is unavailable right now.' });
  }
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const validLat = Number.isFinite(lat) && lat >= -90 && lat <= 90;
  const validLon = Number.isFinite(lon) && lon >= -180 && lon <= 180;
  if (!validLat || !validLon) {
    return res.status(400).json({ error: 'Invalid coordinates.' });
  }
  try {
    const data = await callNominatim(
      `/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lon}`,
    );
    res.json(data);
  } catch (error) {
    console.error('Nominatim reverse failed:', error);
    res.status(502).json({ error: 'Could not look up that pin right now.' });
  }
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
    // SPA fallback. Express 4 uses '*' ('*all' is Express 5 syntax and never
    // matched here, which 404'd client-side routes such as /nearby).
    app.get('*', (req, res) => {
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
