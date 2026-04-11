import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyARY7dpdoDViFLUivHRdmBGQcZURJxvlxY';
const genAI = new GoogleGenerativeAI(API_KEY);

console.log("BailPredict Gemini SDK Initialized with Key starting with:", API_KEY.substring(0, 10));

export const predictBailGemini = async (caseData: any) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const prompt = `
      You are an Indian bail prediction AI trained on court judgments.
      Return ONLY raw JSON no markdown no backticks.
      
      Case: IPC ${caseData.ipc}, Crime: ${caseData.crime},
      Court: ${caseData.court}, Bail Type: ${caseData.bail_type},
      Custody: ${caseData.custody} months,
      First Offender: ${caseData.first_offender},
      Prior Record: ${caseData.prior_record}
      
      {"prediction":"Granted","confidence":84,"likelihood":"HIGH",
      "factors":[{"factor":"First time offender","impact":"positive"}]}
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```(?:json)?|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Gemini Prediction Failed:", e);
    return {
      prediction: "Rejected",
      confidence: 45,
      likelihood: "LOW",
      factors: [{ factor: "API Key failed (Mock data)", impact: "negative" }]
    };
  }
};

export const generateArguments = async (caseData: any) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const prompt = `
      You are an expert Indian criminal defense lawyer.
      Generate 4 strong bail arguments.
      Return ONLY raw JSON array no markdown no backticks.
      
      IPC: ${caseData.ipc}, Crime: ${caseData.crime},
      Court: ${caseData.court}, Custody: ${caseData.custody} months,
      First Offender: ${caseData.first_offender},
      Prior Record: ${caseData.prior_record}
      
      [{"ground":"Title","argument":"2 line argument.","citation":"Case v. Case (year) SCC"}]
      Use only real Indian Supreme Court citations.
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```(?:json)?|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Gemini Arguments Failed:", e);
    return [
      { ground: "API Restriction", argument: "It appears your Gemini API key is throwing a 404/403 connection error.", citation: "Fix via src/lib/gemini.ts" },
      { ground: "Mock Argument #2", argument: "This is a placeholder argument due to the AI generation failure.", citation: "State v. Default Model (2026)" },
      { ground: "Mock Argument #3", argument: "The accused has strong ties to the community and will not abscond.", citation: "Placeholder Citation (123) SC" },
      { ground: "Mock Argument #4", argument: "There is no prima facie case established by the prosecution.", citation: "Placeholder Citation (456) SC" }
    ];
  }
};

export const explainIPC = async (section: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const prompt = `
      Explain IPC Section ${section} for Indian lawyers.
      Return ONLY raw JSON no markdown no backticks.
      
      {"section":"${section}","title":"","description":"",
      "punishment":"","bail_eligibility":"Bailable or Non-Bailable",
      "bail_chances":"Low/Medium/High (X-Y%)",
      "key_elements":["",""],"landmark_cases":[{"case":"","principle":""}],
      "defense_tips":["",""]}
    `;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```(?:json)?|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Gemini IPC Failed:", e);
    return {
      section: section,
      title: "API Key Validation Failed",
      description: "We could not fetch the actual IPC details because the configured Gemini API key returned an error. This is a mock response.",
      punishment: "Update API Key",
      bail_eligibility: "Non-Bailable (Mock)",
      bail_chances: "0% (Mock)",
      key_elements: ["Check network payload", "Ensure Generative API enabled in Google Cloud", "Replace API_KEY in gemini.ts"],
      landmark_cases: [{ case: "System v. Invalid Key (2026)", principle: "Keys must have billing/APIs enabled" }],
      defense_tips: ["Provide valid Google Gemini Key"]
    };
  }
};

export const generateDraft = async (caseData: any, argumentsList: any[]) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const prompt = `
      Generate a formal Indian bail application letter.
      
      Court: ${caseData.court}
      IPC Section: ${caseData.ipc}
      Crime: ${caseData.crime}
      Bail Type: ${caseData.bail_type}
      State: ${caseData.state || 'India'}
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
    return `[SYSTEM WARNING: Gemini API Key exhausted or restricted. This is a local fallback layout draft.]\n\nIN THE COURT OF ${caseData.court?.toUpperCase()}\n\nBail Application under Section 437/439 CrPC\n\nCase Details:\n* Offense: Section ${caseData.ipc} - ${caseData.crime}\n* Court: ${caseData.court}\n\nMost Respectfully Submitted:\n1. Mock argument standing in for failed API generation.\n2. Please restore a valid Gemini API key inside src/lib/gemini.ts.\n\nPRAYER:\nIt is therefore prayed that this Hon’ble Court may kindly grant bail.`;
  }
};

export const predictBail = async (caseData: any) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(
      'https://kushagra734-bail-prediction-api.hf.space/predict',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          "Custody Duration": Number(caseData.custody) || 0,
          "First Offender": caseData.first_offender === 'Yes' ? 1 : 0,
          "Prior Record": caseData.prior_record === 'Yes' ? 1 : 0,
          "Age": Number(caseData.age) || 30,
          "Crime Severity": Number(caseData.crime_severity) || 3
        })
      }
    );
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('Model API returned an error');
    
    const data = await response.json();
    console.log("XGBoost API Raw Response:", data);

    // Expected format: { "prediction": 1, "probability": 0.85 }
    const prob = data.probability !== undefined ? data.probability : 0.5;
    const confidence = Math.round(prob * 100);
    
    // Fix: If prediction is 1 or 0, map it strictly to "Granted" / "Rejected"
    let finalPrediction = 'Unknown';
    if (typeof data.prediction === 'number') {
      finalPrediction = data.prediction === 1 ? 'Granted' : 'Rejected';
    } else if (typeof data.prediction === 'string') {
      finalPrediction = data.prediction;
    } else {
      finalPrediction = prob > 0.5 ? 'Granted' : 'Rejected';
    }
    
    return {
      prediction: finalPrediction,
      confidence: confidence,
      likelihood: confidence > 70 ? 'HIGH' 
                : confidence > 40 ? 'MODERATE' : 'LOW',
      source: 'XGBoost'
    };
  } catch (error) {
    console.warn('XGBoost failed, using Gemini fallback:', error);
    try {
      const result = await predictBailGemini(caseData);
      return { ...result, source: 'Gemini' };
    } catch (e) {
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

export const explainBailDecision = async (caseData: any, predictionResult: any) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
    const prompt = `
      You are an expert Indian criminal defense legal analyst.
      Based on the following case data and prediction result, explain WHY bail is likely or unlikely.
      Return ONLY raw JSON no markdown no backticks.
      
      Case Data: 
      IPC: ${caseData.ipc}, Crime: ${caseData.crime}, Court: ${caseData.court},
      Custody: ${caseData.custody} months, First Offender: ${caseData.first_offender}, Prior Record: ${caseData.prior_record}
      
      Prediction Result: 
      Outcome: ${predictionResult.prediction}, Confidence: ${predictionResult.confidence}%
      
      Respond with this exact JSON structure:
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
    const clean = text.replace(/```(?:json)?|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error("Gemini Explain Decision Failed:", e);
    // Fallback response if API fails
    return {
      verdict_summary: "Based on the provided case profile, the AI model has determined this outcome. A detailed breakdown is currently unavailable due to an API connection error.",
      positive_factors: [
        { label: "AI Analysis Complete", weight: 50, description: "Base prediction generated." }
      ],
      negative_factors: [
        { label: "Detailed Factors Unavailable", weight: 50, description: "Please check your Gemini API key." }
      ],
      risk_level: "MEDIUM",
      judge_note: "Unable to synthesize judicial perspective. Please check network connection."
    };
  }
};
