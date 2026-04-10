// src/services/geminiService.js
// ============================================================
// MedIntel — Gemini AI Intelligence Layer
// Production-grade medical reasoning via OpenRouter → Gemini
// ============================================================


const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ---- System Prompt ----
const SYSTEM_PROMPT = `You are a professional medical intelligence assistant for MedIntel, a clinical healthcare platform.

Rules:
- Provide accurate, safe, and structured medical information
- Use simple but professional language
- Suggest medicine alternatives with approximate Indian market prices when possible
- Include cost-awareness insights
- Never provide harmful, dangerous, or risky medical advice
- Always include a medical disclaimer
- If you are unsure about something, say so clearly
- Format responses as structured JSON when requested
- Focus on evidence-based medical information only`;

const callGemini = async (userMessage, systemOverride = null) => {
  if (!API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const response = await fetch(GOOGLE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemOverride || SYSTEM_PROMPT }]
      },
      contents: [{
        role: 'user',
        parts: [{ text: userMessage }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[Gemini API Error]', response.status, errorData);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

/**
 * Extract clean JSON from a Gemini response that may contain markdown fences
 */
const extractJSON = (text) => {
  // Try to extract from markdown code fences first
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return JSON.parse(fenceMatch[1].trim());
  }
  // Try direct parse
  return JSON.parse(text.trim());
};

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Get structured medical information about a medicine.
 * Replaces Wikipedia API entirely.
 *
 * @param {string} medicineName
 * @returns {{ title, description, usage, safetyNotes, image, source }}
 */
export const getMedicineInfoFromGemini = async (medicineName) => {
  const safeReturn = {
    title: medicineName || 'Unknown Medicine',
    description: 'Unable to retrieve medical information at this time.',
    usage: '',
    safetyNotes: '',
    image: null,
    source: 'gemini',
  };

  try {
    const prompt = `Provide detailed medical information about "${medicineName}".

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "title": "Full medicine name",
  "description": "A clear, 2-3 sentence medical description of what this medicine is and what it treats.",
  "usage": "How this medicine is typically used (dosage form, common doses, route of administration).",
  "safetyNotes": "Key safety information: common side effects, major contraindications, and important warnings.",
  "category": "Drug category (e.g., Antibiotic, Analgesic, Antihypertensive, etc.)"
}`;

    const raw = await callGemini(prompt);
    const parsed = extractJSON(raw);

    return {
      title: parsed.title || medicineName,
      description: parsed.description || safeReturn.description,
      usage: parsed.usage || '',
      safetyNotes: parsed.safetyNotes || '',
      category: parsed.category || '',
      image: null,
      source: 'gemini',
    };
  } catch (err) {
    console.error('[MedIntel] Gemini medicine info failed:', err.message);
    return safeReturn;
  }
};

/**
 * Generate a full medical chat response with structured output.
 * Used by the chatbot.
 *
 * @param {string} userMessage
 * @param {string} medicineContext - Context from analyzer results
 * @returns {{ summary, alternatives, costInsight, warning, disclaimer }}
 */
export const generateMedicalResponse = async (userMessage, medicineContext = '') => {
  const safeReturn = {
    summary: 'I apologize, but I was unable to process your request at this time. Please try again.',
    alternatives: [],
    costInsight: '',
    warning: '',
    disclaimer: 'This information is for educational purposes only. Consult a healthcare professional before making any medical decisions.',
  };

  try {
    const contextBlock = medicineContext
      ? `\n\nCurrent Clinical Context:\n${medicineContext}`
      : '';

    const prompt = `${userMessage}${contextBlock}

Based on the above, provide a professional medical response.

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "summary": "A clear, professional medical explanation (2-4 sentences).",
  "alternatives": ["Alternative 1 name - ₹price", "Alternative 2 name - ₹price"],
  "costInsight": "Brief cost comparison insight if applicable, otherwise empty string.",
  "warning": "Any important safety warnings or drug interactions, otherwise empty string.",
  "disclaimer": "This information is for educational purposes only. Consult a healthcare professional before making any medical decisions."
}`;

    const raw = await callGemini(prompt);
    const parsed = extractJSON(raw);

    return {
      summary: parsed.summary || safeReturn.summary,
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
      costInsight: parsed.costInsight || '',
      warning: parsed.warning || '',
      disclaimer: parsed.disclaimer || safeReturn.disclaimer,
    };
  } catch (err) {
    console.error('[MedIntel] Gemini chat response failed:', err.message);
    return safeReturn;
  }
};

/**
 * Identify medicines from OCR-extracted text using Gemini reasoning.
 * Much more accurate than regex/dictionary matching.
 *
 * @param {string} ocrText - Raw text extracted from image via Tesseract
 * @returns {Array<{name, dose, rawName}>} Identified medicines
 */
export const identifyMedicinesFromText = async (ocrText) => {
  try {
    const prompt = `You are a medical prescription reader. Analyze the following text extracted from a prescription image via OCR. The text may contain errors, noise, or partial words.

OCR TEXT:
"""
${ocrText}
"""

Identify ALL medicines/drugs mentioned in this text. For each medicine found, extract:
- The clean, correct medicine name (fix any OCR spelling errors)
- The dosage if mentioned (e.g., "500 mg", "10 ml")

Return ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "medicines": [
    { "name": "Amoxicillin", "dose": "500 mg", "rawName": "amoxicillin" },
    { "name": "Paracetamol", "dose": "650 mg", "rawName": "paracetamol" }
  ]
}

If no medicines are found, return: { "medicines": [] }
Important: rawName must be the lowercase, simplified version of the name (no salts, no dosage forms).`;

    const raw = await callGemini(prompt);
    const parsed = extractJSON(raw);

    if (Array.isArray(parsed.medicines) && parsed.medicines.length > 0) {
      return parsed.medicines.map(m => ({
        name: m.name || 'Unknown',
        dose: m.dose || 'As prescribed',
        rawName: (m.rawName || m.name || '').toLowerCase().trim(),
      }));
    }
    return [];
  } catch (err) {
    console.error('[MedIntel] Gemini medicine identification failed:', err.message);
    return [];
  }
};

export default {
  getMedicineInfoFromGemini,
  generateMedicalResponse,
  identifyMedicinesFromText,
  callGemini,
};
