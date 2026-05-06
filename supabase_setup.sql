-- CREATE bail_statistics table
CREATE TABLE IF NOT EXISTS bail_statistics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  state text NOT NULL,
  state_code text NOT NULL,
  court_level text NOT NULL,
  ipc_section text NOT NULL,
  total_cases integer DEFAULT 0,
  granted_count integer DEFAULT 0,
  grant_rate numeric GENERATED ALWAYS AS (
    CASE WHEN total_cases > 0 THEN ROUND((granted_count::numeric / total_cases) * 100, 1) ELSE 0 END
  ) STORED,
  avg_confidence numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(state_code, court_level, ipc_section)
);

-- Enable RLS
ALTER TABLE bail_statistics ENABLE ROW LEVEL SECURITY;

-- Allow public read access (no login needed for heatmap)
CREATE POLICY "Public read access on bail_statistics" ON bail_statistics FOR SELECT USING (true);
