/**
 * PDF Legal Analysis Service
 * Interface for the HuggingFace Bail PDF Analyzer API
 */

export interface PdfAnalysisResult {
  ocr_text: string;
  analysis: {
    violence_score: number;
    intent_score: number;
    weapon_involved: boolean;
    evidence_strength: number;
    witness_tampering_risk: number;
    repeat_behavior_risk: number;
    organized_crime_risk: number;
    cooperation_score: number;
    summary: string;
    supporting_factors: string[];
    opposing_factors: string[];
    risk_adjustment: number;
  };
}

// In dev, call via Vite proxy to avoid CORS.
// In prod, set VITE_PDF_ANALYZER_API_URL to your own proxy/server endpoint.
// Try to use the full URL from .env if provided, otherwise fallback to the Vite proxy.
const API_ENDPOINT = import.meta.env.DEV 
  ? '/api/analyze-pdf' 
  : (import.meta.env.VITE_PDF_ANALYZER_API_URL || '/api/analyze-pdf');

/**
 * Sends a PDF file to the analysis API
 */
export async function analyzePdf(file: File): Promise<PdfAnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const apiKey = import.meta.env.VITE_PDF_ANALYZER_API_KEY;
    console.log("PDF Analysis Request: endpoint =", API_ENDPOINT, "key_present =", !!apiKey);

    const headers: HeadersInit = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText || 'Unknown failure'}`);
    }

    const data = await response.json();
    
    // Check if the API returned a 200 OK but with an error payload (e.g. rate limits)
    if (data.error) {
       throw new Error(`HF API: ${data.error}`);
    }

    // Be tolerant to backend key variations.
    const d = (data ?? {}) as any;
    const normalized: PdfAnalysisResult = {
      ocr_text:
        d.ocr_text ??
        d.ocrText ??
        d.ocr ??
        d.text ??
        d.extracted_text ??
        d.extractedText ??
        '',
      analysis: d.analysis ?? d.result ?? d.data ?? undefined,
    };
    return normalized;
  } catch (error) {
    console.error('PDF Analysis Failed:', error);
    throw error;
  }
}
