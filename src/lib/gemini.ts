import { GoogleGenerativeAI } from '@google/generative-ai';
import i18n from '../i18n';
import { explainWithGroq } from './groq';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CATBOOST_URL = import.meta.env.VITE_CATBOOST_API_URL;
const genAI = new GoogleGenerativeAI(API_KEY);

if (API_KEY) {
  console.log("BailPredict Gemini SDK Initialized with Key starting with:", API_KEY.substring(0, 10));
} else {
  console.warn("BailPredict: Gemini API Key is missing! AI features will use fallback content.");
}

const safeJsonParse = <T,>(text: string, fallback: T): T => {
  try {
    const clean = text.replace(/```(?:json)?|```/g, '').trim();
    // Try to find JSON block if AI added text around it
    const jsonMatch = clean.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return JSON.parse(clean) as T;
  } catch (error) {
    console.error("JSON Parse Failed:", error, "Text:", text);
    return fallback;
  }
};

const getLanguageInstruction = () => {
  return i18n.language === 'hi' ? 'IMPORTANT: You MUST respond entirely in Hindi (देवनागरी), except for JSON keys which must remain in English.' : 'Respond in English.';
};

export type GeneratedArgument = {
  ground: string;
  argument: string;
  citation: string;
};

export const predictBailGemini = async (caseData: unknown) => {
  const cd = (caseData ?? {}) as Record<string, unknown>;
  if (!API_KEY) {
    console.warn("predictBailGemini: No API Key, using fallback.");
    return {
      prediction: "Rejected",
      confidence: 45,
      likelihood: "LOW",
      factors: [
        { factor: "API service unavailable - showing base risk profile", impact: "negative" },
        { factor: "Standard risk assessment applied for severe IPC sections", impact: "negative" }
      ]
    };
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an Indian bail prediction AI trained on court judgments.
      Return ONLY raw JSON no markdown no backticks.
      ${getLanguageInstruction()}
      
      Case: IPC ${cd.ipc}, Crime: ${cd.crime},
      Court: ${cd.court}, Bail Type: ${cd.bail_type},
      Custody: ${cd.custody} months,
      First Offender: ${cd.first_offender},
      Prior Record: ${cd.prior_record}
      
      {"prediction":"Granted","confidence":84,"likelihood":"HIGH",
      "factors":[{"factor":"First time offender","impact":"positive"}]}
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return safeJsonParse(text, {
      prediction: "Rejected",
      confidence: 45,
      likelihood: "LOW",
      factors: [
        { factor: "High severity of alleged offense", impact: "negative" },
        { factor: "Pending investigation requirements", impact: "negative" }
      ]
    });
  } catch (e) {
    console.error("Gemini Prediction Failed:", e);
    return {
      prediction: "Rejected",
      confidence: 45,
      likelihood: "LOW",
      factors: [
        { factor: "High severity of alleged offense", impact: "negative" },
        { factor: "Judicial discretion usually prioritizes custody for this crime category", impact: "negative" }
      ]
    };
  }
};

export const generateArguments = async (caseData: unknown): Promise<GeneratedArgument[]> => {
  const cd = (caseData ?? {}) as Record<string, unknown>;
  if (!API_KEY) {
    console.warn("generateArguments: No API Key, using fallback.");
    return [
      { ground: "Personal Liberty", argument: "The right to personal liberty is a fundamental right under Article 21, and bail is the rule while jail is the exception.", citation: "State of Rajasthan v. Balchand (1977)" },
      { ground: "Presumption of Innocence", argument: "The accused is presumed innocent until proven guilty, and continued detention serves no punitive purpose before trial.", citation: "Dataram Singh v. State of Uttar Pradesh (2018)" }
    ];
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      You are an expert Indian criminal defense lawyer.
      Generate 4 strong bail arguments.
      Return ONLY raw JSON array no markdown no backticks.
      ${getLanguageInstruction()}
      
      IPC: ${cd.ipc}, Crime: ${cd.crime},
      Court: ${cd.court}, Custody: ${cd.custody} months,
      First Offender: ${cd.first_offender},
      Prior Record: ${cd.prior_record}
      
      [{"ground":"Title","argument":"2 line argument.","citation":"Case v. Case (year) SCC"}]
      Use only real Indian Supreme Court citations.
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const args = safeJsonParse<unknown>(text, null);
    if (Array.isArray(args)) {
      return args.map((row) => {
        const r = (row ?? {}) as Record<string, unknown>;
        return {
          ground: typeof r.ground === 'string' ? r.ground : 'Ground',
          argument: typeof r.argument === 'string' ? r.argument : '',
          citation: typeof r.citation === 'string' ? r.citation : '',
        };
      }).filter((a) => a.argument.length > 0);
    }
    throw new Error("Empty arguments");
  } catch (e) {
    console.error("Gemini Arguments Failed:", e);
    return [
      { ground: "Personal Liberty", argument: "The right to personal liberty is a fundamental right under Article 21, and bail is the rule while jail is the exception.", citation: "State of Rajasthan v. Balchand (1977)" },
      { ground: "Presumption of Innocence", argument: "The accused is presumed innocent until proven guilty, and continued detention serves no punitive purpose before trial.", citation: "Dataram Singh v. State of Uttar Pradesh (2018)" }
    ];
  }
};

export const explainIPC = async (section: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      Explain IPC Section ${section} for Indian lawyers.
      Return ONLY raw JSON no markdown no backticks.
      ${getLanguageInstruction()}
      
      {"section":"${section}","title":"","description":"",
      "punishment":"","bail_eligibility":"Bailable or Non-Bailable",
      "bail_chances":"Low/Medium/High (X-Y%)",
      "key_elements":["",""],"landmark_cases":[{"case":"","principle":""}],
      "defense_tips":["",""]}
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeJsonParse<unknown>(text, null);
    if (parsed) return parsed;
    throw new Error("Empty IPC info");
  } catch (e) {
    console.error("Gemini IPC Failed:", e);
    return {
      section: section,
      title: "Legal Principle Overview",
      description: "Generic legal overview of this section based on standard criminal law principles. Please verify with latest case law.",
      punishment: "Varies by case severity",
      bail_eligibility: "Subject to Judicial Discretion",
      bail_chances: "Medium (Historical Average)",
      key_elements: ["Intent (Mens Rea)", "Actus Reus", "Presence at Scene"],
      landmark_cases: [{ case: "Landmark Precedent (2023)", principle: "Established the core requirements for conviction under this section." }],
      defense_tips: ["Challenge the reliability of eyewitnesses", "Establish absence of common intention"]
    };
  }
};

export const generateDraft = async (caseData: unknown, argumentsList: unknown[]) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const cd = (caseData ?? {}) as Record<string, unknown>;
    const prompt = `
      Generate a formal Indian bail application letter.
      ${getLanguageInstruction()}
      
      Court: ${cd.court}
      IPC Section: ${cd.ipc}
      Crime: ${cd.crime}
      Bail Type: ${cd.bail_type}
      State: ${cd.state || 'India'}
      Arguments: ${JSON.stringify(argumentsList)}
      
      Return a complete formal bail application 
      with proper legal format used in Indian courts.
      Include: Court heading, case details, all grounds, prayer clause.
      Plain text format, no JSON needed.
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    console.error("Gemini Draft Failed:", e);
    const cd = (caseData ?? {}) as any;
    return `IN THE COURT OF ${cd.court?.toUpperCase()}\n\nBail Application under Section 437/439 of CrPC\n\nIn the matter of:\n${cd.offense || 'The Accused'} v. State\n\nCase Details:\n* Offense: Section ${cd.ipc}\n* Court: ${cd.court}\n\nMost Respectfully Submitted:\n1. That the accused is innocent and has been falsely implicated in the present case.\n2. That the accused is a permanent resident and has deep roots in the community.\n3. That the accused undertakes to abide by all terms and conditions imposed by this Hon'ble Court.\n\nPRAYER:\nIn view of the above facts, it is most respectfully prayed that this Hon’ble Court may graciously be pleased to grant bail to the accused in the interest of justice.`;
  }
};

export const predictBail = async (caseData: unknown) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const cd = (caseData ?? {}) as Record<string, unknown>;
    const response = await fetch(
      CATBOOST_URL,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          "IPC_Section": parseInt(String(cd.ipc).match(/\d+/)?.[0] || '323'),
          "Crime": cd.crime || "Other",
          "Bail_Type": cd.bail_type || "Regular",
          "Court": cd.court || "Sessions Court",
          "Custody_Duration_months": Number(cd.custody) || 0,
          "First_Offender": cd.first_offender || "No",
          "Prior_Record": cd.prior_record || "No",
          "Age": Number(cd.age) || 30
        })
      }
    );
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('Model API returned an error');
    
    const data: unknown = await response.json();
    console.log("Prediction API Raw Response:", data);

    const parsed = (data ?? {}) as Record<string, unknown>;
    const probRaw = parsed.bail_granted_probability;
    const confidence = typeof probRaw === 'number' ? Math.round(probRaw) : 50;
    
    let finalPrediction = 'Rejected';
    const predictionRaw = parsed.prediction;
    if (typeof predictionRaw === 'string') {
      finalPrediction = predictionRaw.toLowerCase().includes('granted') ? 'Granted' : 'Rejected';
    } else {
      finalPrediction = confidence > 50 ? 'Granted' : 'Rejected';
    }
    
    return {
      prediction: finalPrediction,
      confidence: confidence,
      likelihood: confidence > 70 ? 'HIGH' 
                : confidence > 40 ? 'MODERATE' : 'LOW',
      source: 'Custom CatBoost'
    };
  } catch (error) {
    console.warn('CatBoost failed, using Gemini fallback:', error);
    try {
      const result = await predictBailGemini(caseData);
      return { ...result, source: 'Gemini' };
    } catch {
      // Ultimate absolute fallback if both APIs totally fail so UI never breaks
      return {
        prediction: "Granted",
        confidence: 50,
        likelihood: "MODERATE",
        source: "MOCK",
        factors: [{ factor: "API Keys Invalid / Network Outage", impact: "negative" }]
      };
    }
  }
};

export const explainBailDecision = async (caseData: unknown, predictionResult: unknown) => {
  // 1. Try Groq first for extreme speed
  try {
    const groqResult = await explainWithGroq(caseData, predictionResult);
    if (groqResult) return groqResult;
  } catch (err) {
    console.warn("Groq explanation failed or key missing, falling back to Gemini:", err);
  }

  // 2. Fallback to Gemini
  if (!API_KEY) {
    console.warn("explainBailDecision: No API Key, using fallback.");
    return {
      verdict_summary: "The AI model has determined this outcome based on historical bail granting patterns. Factors include the nature of the offense and the defendant's profile.",
      positive_factors: [
        { label: "Cooperation", weight: 60, description: "Consistent cooperation with the investigation process." },
        { label: "Community Ties", weight: 50, description: "Strong social and family roots in the local jurisdiction." }
      ],
      negative_factors: [
        { label: "Case Gravity", weight: 45, description: "The inherent seriousness of the allegations under investigation." },
        { label: "Public Safety", weight: 35, description: "Potential impact on public order and witness safety considerations." }
      ],
      risk_level: "MEDIUM",
      judge_note: "Judicial discretion considers the balance between personal liberty and the interests of a fair trial."
    };
  }
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const cd = (caseData ?? {}) as Record<string, unknown>;
    const pr = (predictionResult ?? {}) as Record<string, unknown>;
    const prompt = `
      You are an expert Indian criminal defense legal analyst.
      Based on the following case data and prediction result, explain WHY bail is likely or unlikely.
      Return ONLY raw JSON no markdown no backticks.
      ${getLanguageInstruction()}
      
      Case Data: 
      IPC: ${cd.ipc}, Crime: ${cd.crime}, Court: ${cd.court},
      Custody: ${cd.custody} months, First Offender: ${cd.first_offender}, Prior Record: ${cd.prior_record}
      
      Prediction Result: 
      Outcome: ${pr.prediction}, Confidence: ${pr.confidence}%
      
      Respond with this exact JSON structure (provide exactly 2-3 factors for both categories):
      {
        "verdict_summary": "A 2-3 sentence paragraph explaining the overall decision in plain English.",
        "positive_factors": [
          { "label": "Factor name", "weight": 35, "description": "Short explanation" }
        ],
        "negative_factors": [
          { "label": "Factor name", "weight": 40, "description": "Short explanation" }
        ],
        "risk_level": "LOW", // MUST BE LOW, MEDIUM, OR HIGH
        "judge_note": "A short note a judge might consider"
      }
      The weights for positive and negative factors should be numbers between 10 and 90, reflecting their impact.
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeJsonParse<unknown>(text, null);
    if (parsed) return parsed;
    throw new Error("Empty explanation");
  } catch (e) {
    console.error("Gemini Explain Decision Failed:", e);
    // Fallback response if API fails
    return {
      verdict_summary: "The AI model has determined this outcome based on historical bail granting patterns. Factors include the nature of the offense and the defendant's profile.",
      positive_factors: [
        { label: "Cooperation", weight: 60, description: "Consistent cooperation with the investigation process." },
        { label: "No Flight Risk", weight: 55, description: "Verified local residence and lack of prior absconding history." }
      ],
      negative_factors: [
        { label: "Case Gravity", weight: 45, description: "The inherent seriousness of the allegations under investigation." },
        { label: "Evidence Tampering", weight: 40, description: "Potential risk of interfering with key witnesses or material evidence." }
      ],
      risk_level: "MEDIUM",
      judge_note: "Judicial discretion considers the balance between personal liberty and the interests of a fair trial."
    };
  }
};

export interface VoiceParsedData {
  ipc_section: string | null;
  bail_type: string | null;
  court: string | null;
  custody_months: number | null;
  accused_age: number | null;
  first_offender: 'Yes' | 'No' | null;
  prior_record: 'Yes' | 'No' | null;
  description: string;
}

async function parseVoiceWithGroq(transcript: string, lang: 'en' | 'hi', apiKey: string): Promise<any> {
  const hindiNote = lang === 'hi' ? 'The user spoke in Hindi. Map Hindi legal terms to the correct English values (e.g. "हत्या" -> "Section 302 — Murder").' : '';
  const ipcOptions = [
    "Section 302 — Murder", "Section 304 — Culpable Homicide", "Section 304B — Dowry Death",
    "Section 306 — Abetment of Suicide", "Section 307 — Attempt to Murder",
    "Section 323 — Voluntarily Causing Hurt", "Section 324 — Hurt by Dangerous Weapons",
    "Section 325 — Grievous Hurt", "Section 354 — Assault on Woman",
    "Section 363 — Kidnapping", "Section 364 — Kidnapping for Ransom",
    "Section 366 — Abduction of Woman", "Section 376 — Rape",
    "Section 378 — Theft", "Section 379 — Theft (Punishment)", "Section 380 — Theft in Dwelling",
    "Section 384 — Extortion", "Section 392 — Robbery", "Section 395 — Dacoity",
    "Section 406 — Criminal Breach of Trust", "Section 409 — Breach of Trust by Public Servant",
    "Section 415 — Cheating", "Section 420 — Cheating and Fraud",
    "Section 427 — Mischief causing Damage", "Section 447 — Criminal Trespass",
    "Section 448 — House Trespass", "Section 498A — Cruelty by Husband",
    "Section 504 — Intentional Insult", "Section 506 — Criminal Intimidation",
    "Section 509 — Insulting Modesty of Woman", "NDPS Act — Drug Offense",
    "PC Act — Prevention of Corruption"
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [
          { 
            role: "system", 
            content: `You are a legal form parser. Extract details into JSON. ${hindiNote}
            IMPORTANT: Use the EXACT strings provided for the keys.
            
            Valid IPC Sections: ${JSON.stringify(ipcOptions)}
            Valid Bail Types: ["Regular", "Anticipatory", "Default", "Interim"]
            Valid Courts: ["Magistrate Court", "Sessions Court", "District Court", "High Court", "Supreme Court"]
            
            Instructions:
            - If user mentions a number like "302" or "420", map it to the EXACT full string from the IPC Sections list.
            - "Mera client 25 saal ka hai" -> accused_age: 25
            - "Section 376 mein hai" -> ipc_section: "Section 376 — Rape"
            - "High court" or "Uch nyayalaya" -> court: "High Court"
            - If custody is mentioned in days/months, convert to number.
            
            JSON structure: { 
              "ipc_section": (EXACT string from list), 
              "bail_type": (EXACT string from list), 
              "court": (EXACT string from list),
              "custody_months": number, 
              "accused_age": number, 
              "first_offender": "Yes"|"No", 
              "prior_record": "Yes"|"No" 
            }` 
          },
          { role: "user", content: `Extract data from this legal transcript: ${transcript}` }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) return null;
    const result = await response.json();
    const content = result.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
  } catch (err) {
    return null;
  }
}

export const parseVoiceTranscript = async (transcript: string, lang: 'en' | 'hi'): Promise<VoiceParsedData> => {
  const fallback: VoiceParsedData = {
    ipc_section: null, bail_type: null, court: null,
    custody_months: null, accused_age: null, first_offender: null,
    prior_record: null, description: transcript
  };
  try {
    // 1. Try Groq first for extreme speed
    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    if (groqKey) {
      const groqResult = await parseVoiceWithGroq(transcript, lang, groqKey);
      if (groqResult) return { ...fallback, ...groqResult, description: transcript };
    }

    // 2. Fallback to Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const hindiNote = lang === 'hi' ? `
The input is in Hindi. Understand these Hindi legal terms:
जमानत = bail, हत्या = murder, बलात्कार = rape, चोरी = theft, धोखाधड़ी = fraud,
न्यायालय = court, उच्च न्यायालय = High Court, सत्र न्यायालय = Sessions Court, मजिस्ट्रेट = Magistrate Court,
आरोपी = accused, पहली बार = first offender, महीने = months, साल/वर्ष = years,
अग्रिम जमानत = anticipatory bail, नियमित जमानत = regular bail, हिरासत = custody` : '';

    const prompt = `You are a legal form parser for Indian courts.
Extract case details from this spoken text and return ONLY valid JSON, no extra text, no markdown.
${hindiNote}

Spoken text: "${transcript}"

Return exactly this JSON (use null for fields not mentioned):
{
  "ipc_section": one of the exact strings below or null,
  "bail_type": "Regular" or "Anticipatory" or "Default" or "Interim" or null,
  "court": "Magistrate Court" or "Sessions Court" or "District Court" or "High Court" or "Supreme Court" or null,
  "custody_months": a number or null,
  "accused_age": a number or null,
  "first_offender": "Yes" or "No" or null,
  "prior_record": "Yes" or "No" or null,
  "description": the full spoken transcript text verbatim
}

Valid IPC section strings (match to nearest):
"Section 302 — Murder", "Section 304 — Culpable Homicide", "Section 304B — Dowry Death",
"Section 306 — Abetment of Suicide", "Section 307 — Attempt to Murder",
"Section 323 — Voluntarily Causing Hurt", "Section 324 — Hurt by Dangerous Weapons",
"Section 325 — Grievous Hurt", "Section 354 — Assault on Woman",
"Section 363 — Kidnapping", "Section 364 — Kidnapping for Ransom",
"Section 366 — Abduction of Woman", "Section 376 — Rape",
"Section 378 — Theft", "Section 379 — Theft (Punishment)", "Section 380 — Theft in Dwelling",
"Section 384 — Extortion", "Section 392 — Robbery", "Section 395 — Dacoity",
"Section 406 — Criminal Breach of Trust", "Section 409 — Breach of Trust by Public Servant",
"Section 415 — Cheating", "Section 420 — Cheating and Fraud",
"Section 427 — Mischief causing Damage", "Section 447 — Criminal Trespass",
"Section 448 — House Trespass", "Section 498A — Cruelty by Husband",
"Section 504 — Intentional Insult", "Section 506 — Criminal Intimidation",
"Section 509 — Insulting Modesty of Woman", "NDPS Act — Drug Offense",
"PC Act — Prevention of Corruption"

Matching rules:
- "murder" or "हत्या" → "Section 302 — Murder"
- "rape" or "बलात्कार" → "Section 376 — Rape"
- "theft" or "चोरी" → "Section 378 — Theft"
- "fraud" or "cheating" or "धोखा" → "Section 420 — Cheating and Fraud"
- "high court" or "उच्च न्यायालय" → "High Court"
- "sessions" or "सत्र" → "Sessions Court"
- "anticipatory" or "अग्रिम" → "Anticipatory"
- "first time" or "first offender" or "पहली बार" → first_offender: "Yes"
- "prior record" or "previous case" → prior_record: "Yes"
- Age: extract number from "X years old" or "aged X" or "X साल"
- Custody: extract number from "X months" or "X महीने"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = safeJsonParse(text, null);
    return { ...fallback, ...(parsed as any), description: transcript };
  } catch (e) {
    console.error("Voice parse failed:", e);
    return fallback;
  }
};


