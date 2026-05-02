import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);

// Hugging Face Mistral-7B-Instruct endpoint
const modelUrl = 'https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2';
const requestTimeoutMs = 12000;

// Parse JSON body
app.use(express.json());

// Fallback reflection if AI fails
const buildFallbackReflection = (minutes) => [
  `- What mattered most in your ${minutes}-minute session?`,
  '- What would make your next focus block even smoother?',
  '- Tip: Take a short break, then restart with the single next action.',
].join('\n');

// Extract generated text from HF response
const extractGeneratedText = (payload) => {
  if (Array.isArray(payload) && payload[0]?.generated_text) {
    return payload[0].generated_text;
  }

  if (typeof payload?.generated_text === 'string') {
    return payload.generated_text;
  }

  if (typeof payload?.error === 'string') {
    throw new Error(payload.error);
  }

  return '';
};

// Normalize AI output to exactly 2 questions + 1 tip
const normalizeReflection = (rawText, minutes) => {
  const cleaned = rawText
    .replace(/<\/?s>/g, '')
    .replace(/\[\/?INST\]/g, '')
    .trim();

  const lines = cleaned
    .split('\n')
    .map((line) => line.replace(/^[\s*\-0-9.)]+/, '').trim())
    .filter(Boolean);

  const questions = [];
  let tip = '';

  for (const line of lines) {
    if (!tip && /^tip[:\s-]/i.test(line)) {
      tip = line.replace(/^tip[:\s-]*/i, '').trim();
      continue;
    }

    if (questions.length < 2) {
      questions.push(line.endsWith('?') ? line : `${line.replace(/[.!,;:]+$/, '')}?`);
      continue;
    }

    if (!tip) {
      tip = line;
    }
  }

  if (questions.length < 2 || !tip) {
    return buildFallbackReflection(minutes);
  }

  return [
    `- ${questions[0]}`,
    `- ${questions[1]}`,
    `- Tip: ${tip.replace(/^tip[:\s-]*/i, '').trim()}`,
  ].join('\n');
};

// Reflection endpoint
app.post('/reflection', async (req, res) => {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  const sessionMinutes = Number.isFinite(Number(req.body?.minutes)) ? Math.max(1, Math.round(Number(req.body.minutes))) : 25;

  if (!apiKey) {
    return res.json({
      text: buildFallbackReflection(sessionMinutes),
      fallback: true,
      error: 'Missing Hugging Face API key.',
    });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'A prompt is required.' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

    const hfResponse = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `<s>[INST] ${prompt}

Respond with exactly 3 bullet points:
- question 1
- question 2
- Tip: one short practical tip
Keep the full response under 60 words. [/INST]`,
        parameters: {
          max_new_tokens: 90,
          temperature: 0.5,
          return_full_text: false,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const payload = await hfResponse.json();

    if (!hfResponse.ok) {
      const message = typeof payload?.error === 'string' ? payload.error : 'Hugging Face request failed.';
      return res.json({
        text: buildFallbackReflection(sessionMinutes),
        fallback: true,
        error: message,
      });
    }

    const text = normalizeReflection(extractGeneratedText(payload), sessionMinutes);
    return res.json({ text, fallback: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected reflection error.';
    return res.json({
      text: buildFallbackReflection(sessionMinutes),
      fallback: true,
      error: message,
    });
  }
});

app.listen(port, () => {
  console.log(`Reflection server listening on http://127.0.0.1:${port}`);
});
