
const fs = require('fs');
const files = [
  'src/pages/Dashboard.tsx',
  'src/pages/Predict.tsx',
  'src/pages/IPCGuide.tsx',
  'src/pages/MyCases.tsx',
  'src/pages/BailApplication.tsx',
  'src/pages/CaseDetails.tsx',
  'src/pages/MyDrafts.tsx',
  'src/pages/Login.tsx',
  'src/pages/Signup.tsx',
  'src/components/ExplainabilityPanel.tsx',
  'src/components/PredictionForm.tsx',
  'src/components/PredictionResults.tsx',
  'src/components/VoiceInput.tsx',
  'src/components/VoiceOutput.tsx'
];

const replacements = [
  { p: /bg-\\[#F8F9FB\\]/g, r: 'bg-[var(--bg-primary)]' },
  { p: /bg-white/g, r: 'bg-[var(--bg-secondary)]' },
  { p: /text-\\[#111\\]/g, r: 'text-[var(--text-primary)]' },
  { p: /border-slate-100/g, r: 'border-[var(--border-subtle)]' },
  { p: /border-slate-200/g, r: 'border-[var(--border-primary)]' },
  { p: /text-slate-500/g, r: 'text-[var(--text-secondary)]' },
  { p: /text-slate-600/g, r: 'text-[var(--text-secondary)]' },
  { p: /text-slate-400/g, r: 'text-[var(--text-muted)]' },
  { p: /bg-slate-50/g, r: 'bg-[var(--bg-surface)]' },
  { p: /bg-slate-100/g, r: 'bg-[var(--bg-surface)]' },
  { p: /bg-\\[#111\\]/g, r: 'bg-[var(--btn-primary-bg)]' },
  { p: /text-white/g, r: 'text-[var(--btn-primary-text)]' },
  { p: /border-\\[#111\\]/g, r: 'border-[var(--btn-primary-bg)]' },
  { p: /hover:bg-black/g, r: 'hover:bg-[var(--btn-primary-hover)]' }
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, 'utf8');
    replacements.forEach(({p, r}) => {
      c = c.replace(p, r);
    });
    fs.writeFileSync(f, c);
    console.log('Updated ' + f);
  }
});

