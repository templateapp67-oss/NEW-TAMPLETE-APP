import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for generating team member bio using Gemini API
app.post('/api/generate-bio', async (req, res) => {
  try {
    const { name, role, specialties, salonName } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is required' });
    }

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

    let bio = '';
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is required');
      }

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
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      bio = response.text?.trim() || '';
    } catch (error: any) {
      console.warn('Gemini API call encountered quota or rate limit error, using intelligent fallback bio:', error?.message);
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
