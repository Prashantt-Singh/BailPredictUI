import i18n from '../i18n';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

const getLanguageInstruction = () => {
  return i18n.language === 'hi' ? 'IMPORTANT: You MUST respond entirely in Hindi (देवनागरी), except for JSON keys which must remain in English.' : 'Respond in English.';
};

export const explainWithGroq = async (caseData: any, predictionResult: any) => {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API Key is missing");
  }

  const prompt = `
    You are an expert Indian criminal defense legal analyst.
    Based on the following case data and prediction result, explain WHY bail is likely or unlikely.
    Return ONLY raw JSON, no markdown, no backticks.
    ${getLanguageInstruction()}
    
    Case Data: 
    IPC: ${caseData.ipc}, Crime: ${caseData.crime}, Court: ${caseData.court},
    Custody: ${caseData.custody} months, First Offender: ${caseData.first_offender}, Prior Record: ${caseData.prior_record}
    
    Prediction Result: 
    Outcome: ${predictionResult.prediction}, Confidence: ${predictionResult.confidence}%
    
    Respond with this exact JSON structure:
    {
      "verdict_summary": "A 2-3 sentence paragraph explaining the overall decision in plain English.",
      "positive_factors": [
        { "label": "Factor name", "weight": 75, "description": "Short explanation" }
      ],
      "negative_factors": [
        { "label": "Factor name", "weight": 40, "description": "Short explanation" }
      ],
      "risk_level": "LOW",
      "judge_note": "A short note a judge might consider"
    }
  `;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API Error: ${response.statusText}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  return JSON.parse(content);
};

export const generateArgumentsWithGroq = async (caseData: any) => {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API Key is missing");
  }

  const cd = (caseData ?? {}) as Record<string, unknown>;
  const prompt = `
    You are a Senior Indian Criminal Defense Lawyer drafting a high-stakes bail application.
    Generate 4 strong, highly detailed bail arguments (3-5 sentences each).
    Use professional legal terminology (e.g., 'pre-trial punishment', 'deep roots in society', 'no flight risk').
    Return ONLY raw JSON array, no markdown, no backticks.
    ${getLanguageInstruction()}
    
    CASE DATA:
    IPC: ${cd.ipc}, Crime: ${cd.crime},
    Court: ${cd.court}, Custody: ${cd.custody} months,
    First Offender: ${cd.first_offender},
    Prior Record: ${cd.prior_record}
    
    JSON STRUCTURE:
    [{"ground":"Detailed Title","argument":"3-5 sentences of professional legal reasoning.","citation":"Case Name (Year) SCC/AIR Reference"}]
    Use ONLY real Indian Supreme Court citations.
  `;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API Error: ${response.statusText}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;
  
  // Clean potential markdown
  const cleanContent = content.replace(/```(?:json)?|```/g, '').trim();
  const jsonMatch = cleanContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(cleanContent);
  return parsed;
};
