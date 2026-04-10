// src/services/medicineEngine.js
// ============================================================
// MedIntel — Medicine Data Engine
// Gemini-powered medical intelligence (Wikipedia fully removed)
// ============================================================

import { getMedicineInfoFromGemini, identifyMedicinesFromText } from './geminiService';

// ---- Input Cleaning ----
const STRIP_WORDS = new Set([
  'tablets', 'tablet', 'capsules', 'capsule', 'injection', 'syrup',
  'suspension', 'drops', 'cream', 'ointment', 'gel', 'solution',
  'ip', 'bp', 'usp', 'nf', 'sr', 'xr', 'er', 'cr', 'dr', 'ir',
  'trihydrate', 'dihydrate', 'hydrochloride', 'hcl', 'sodium',
  'potassium', 'maleate', 'succinate', 'fumarate', 'besylate',
  'forte', 'plus', 'extra', 'mg', 'ml', 'gm', 'mcg'
]);

const DOSAGE_REGEX = /\d+\s*(mg|ml|gm|mcg|%|g)\b/gi;

export const cleanMedicineName = (rawName) => {
  if (!rawName || typeof rawName !== 'string') return '';
  let cleaned = rawName.replace(DOSAGE_REGEX, '').replace(/[()[\]{}]/g, '').trim();
  const words = cleaned.split(/\s+/);
  const meaningful = words.filter(w => !STRIP_WORDS.has(w.toLowerCase()));
  return meaningful.length > 0 ? meaningful[0] : words[0] || '';
};

export const normalize = (name) => cleanMedicineName(name).toLowerCase();

// ---- Local Medicine Database (cost/alternative reference) ----
export const medicineDB = {
  amoxicillin: {
    name: "Amoxicillin Trihydrate",
    dose: "500 mg",
    instructions: "Take one capsule by mouth three times daily (every 8 hours) for 7 consecutive days.",
    alternatives: [
      { name: "Moxikind-CV", price: 95 },
      { name: "Amoxyclav", price: 120 },
      { name: "Augmentin", price: 180 }
    ]
  },
  paracetamol: {
    name: "Paracetamol",
    dose: "500 mg",
    instructions: "Take one tablet as needed for fever or pain. Do not exceed 4 tablets in 24 hours.",
    alternatives: [
      { name: "Calpol", price: 25 },
      { name: "Crocin", price: 30 },
      { name: "Dolo 650", price: 35 }
    ]
  },
  lisinopril: {
    name: "Lisinopril Tablets",
    dose: "10 mg",
    instructions: "Take one tablet once daily at the same time each morning.",
    alternatives: [
      { name: "Lipril", price: 60 },
      { name: "Listril", price: 55 },
      { name: "Zestril", price: 75 }
    ]
  },
  ibuprofen: {
    name: "Ibuprofen",
    dose: "400 mg",
    instructions: "Take one tablet every 6-8 hours as needed. Take with food to reduce stomach irritation.",
    alternatives: [
      { name: "Brufen", price: 30 },
      { name: "Combiflam", price: 40 },
      { name: "Ibugesic", price: 25 }
    ]
  },
  metformin: {
    name: "Metformin Hydrochloride",
    dose: "500 mg",
    instructions: "Take one tablet twice daily with meals. Your doctor may gradually increase the dose.",
    alternatives: [
      { name: "Glycomet", price: 45 },
      { name: "Glucophage", price: 80 },
      { name: "Obimet", price: 38 }
    ]
  },
  azithromycin: {
    name: "Azithromycin",
    dose: "500 mg",
    instructions: "Take once daily for 3 days, or as directed by your physician.",
    alternatives: [
      { name: "Azee", price: 85 },
      { name: "Zithromax", price: 160 },
      { name: "Azicip", price: 70 }
    ]
  },
  cetirizine: {
    name: "Cetirizine Hydrochloride",
    dose: "10 mg",
    instructions: "Take one tablet once daily. May cause drowsiness.",
    alternatives: [
      { name: "Alerid", price: 22 },
      { name: "Zyrtec", price: 55 },
      { name: "Okacet", price: 28 }
    ]
  },
  omeprazole: {
    name: "Omeprazole",
    dose: "20 mg",
    instructions: "Take one capsule before breakfast on an empty stomach.",
    alternatives: [
      { name: "Omez", price: 45 },
      { name: "Prilosec", price: 120 },
      { name: "Ocid", price: 38 }
    ]
  }
};

// ---- Gemini-Powered Medicine Info (replaces Wikipedia) ----

/**
 * Get medicine information using Gemini AI.
 * @param {string} medicineName
 * @returns {{ title, description, usage, safetyNotes, image, source }}
 */
export const getMedicineInfo = async (medicineName) => {
  return await getMedicineInfoFromGemini(medicineName);
};

/**
 * Identify medicines from OCR text using Gemini AI reasoning.
 * @param {string} ocrText - Raw OCR text from image
 * @returns {Array<{name, dose, rawName}>}
 */
export const identifyMedicines = async (ocrText) => {
  return await identifyMedicinesFromText(ocrText);
};

// Legacy compat wrapper
export const fetchMedicineInfo = async (medicineName) => {
  const info = await getMedicineInfo(medicineName);
  return {
    description: info.description,
    thumbnail: info.image,
    title: info.title
  };
};

// ---- Alternatives Engine ----
export const getAlternatives = (medicineName) => {
  const key = normalize(medicineName);
  const data = medicineDB[key];
  if (!data) {
    return [{ name: "No alternatives found", price: "-" }];
  }
  return [...data.alternatives].sort((a, b) => a.price - b.price);
};