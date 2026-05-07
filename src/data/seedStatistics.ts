export const STATE_CODES = [
  "AP", "AR", "AS", "BR", "CT", "GA", "GJ", "HR", "HP", "JH", "KA", "KL", "MP", 
  "MH", "MN", "ML", "MZ", "NL", "OR", "PB", "RJ", "SK", "TN", "TG", "TR", "UP", 
  "UT", "WB", "AN", "CH", "DN", "DD", "LD", "DL", "PY", "JK", "LA"
];

export const COURT_LEVELS = [
  "Magistrate Court", "Sessions Court", "District Court", "High Court", "Supreme Court"
];

export const IPC_SECTIONS = [
  "Section 302 — Murder",
  "Section 307 — Attempt to Murder",
  "Section 376 — Rape",
  "Section 378 — Theft",
  "Section 420 — Cheating and Fraud",
  "Section 498A — Cruelty by Husband",
  "NDPS Act — Drug Offense"
];

export type BailStatisticRow = {
  state_code: string;
  court_level: string;
  ipc_section: string;
  total_cases: number;
  granted_count: number;
  grant_rate: number;
  avg_confidence: number;
};

// Generate realistic looking seed data
export const generateSeedData = () => {
  const data: BailStatisticRow[] = [];
  
  STATE_CODES.forEach(state_code => {
    // Base grant rate per state (randomized between 35% and 65%)
    const stateBaseRate = 35 + Math.random() * 30;
    
    COURT_LEVELS.forEach((court, cIdx) => {
      // Higher courts grant bail more often
      const courtMultiplier = 1 + (cIdx * 0.15); 
      
      IPC_SECTIONS.forEach(ipc => {
        // Different crimes have different base severities
        let ipcMultiplier = 1;
        if (ipc.includes("Murder") || ipc.includes("Rape")) ipcMultiplier = 0.4;
        if (ipc.includes("NDPS")) ipcMultiplier = 0.5;
        if (ipc.includes("Cheating")) ipcMultiplier = 1.3;
        
        const targetRate = Math.min(95, Math.max(5, stateBaseRate * courtMultiplier * ipcMultiplier));
        
        const total_cases = Math.floor(50 + Math.random() * 400);
        const granted_count = Math.floor(total_cases * (targetRate / 100));
        
        data.push({
          state_code,
          court_level: court,
          ipc_section: ipc,
          total_cases,
          granted_count,
          grant_rate: Number(((granted_count / total_cases) * 100).toFixed(1)),
          avg_confidence: 65 + Math.floor(Math.random() * 25)
        });
      });
    });
  });
  
  return data;
};

export const SEED_DATA = generateSeedData();
