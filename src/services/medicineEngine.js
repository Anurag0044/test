// src/services/medicineEngine.js

// Simple normalized helper
export const normalize = (name) => name.toLowerCase().split(" ")[0];

// Database (you can expand anytime)
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
  }
};

export const fetchMedicineInfo = async (medicineName) => {
  try {
    const key = normalize(medicineName);
    const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(key)}`);
    if (!response.ok) return null;
    const data = await response.json();
    return {
      description: data.extract || "No description available.",
      thumbnail: data.thumbnail?.source || null
    };
  } catch (err) {
    console.error("Failed to fetch medicine info from Wikipedia", err);
    return null;
  }
};

// MAIN FUNCTION ✅
export const getAlternatives = (medicineName) => {
  const key = normalize(medicineName);

  const data = medicineDB[key];

  if (!data) {
    return [
      { name: "No alternatives found", price: "-" }
    ];
  }

  // sort by cheapest
  return data.alternatives.sort((a, b) => a.price - b.price);
};