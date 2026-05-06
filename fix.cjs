
const fs = require("fs");
const files = [
  "src/pages/Dashboard.tsx",
  "src/pages/Predict.tsx",
  "src/pages/IPCGuide.tsx",
  "src/pages/MyCases.tsx",
  "src/pages/BailApplication.tsx",
  "src/pages/CaseDetails.tsx",
  "src/pages/MyDrafts.tsx",
  "src/pages/Login.tsx",
  "src/pages/Signup.tsx",
  "src/components/ExplainabilityPanel.tsx",
  "src/components/PredictionForm.tsx",
  "src/components/PredictionResults.tsx",
  "src/components/VoiceInput.tsx",
  "src/components/VoiceOutput.tsx"
];

const replacements = [
  { p: "bg-[#F8F9FB]", r: "bg-[var(--bg-primary)]" },
  { p: "bg-white", r: "bg-[var(--bg-secondary)]" },
  { p: "text-[#111]", r: "text-[var(--text-primary)]" },
  { p: "border-slate-100", r: "border-[var(--border-subtle)]" },
  { p: "border-slate-200", r: "border-[var(--border-primary)]" },
  { p: "text-slate-500", r: "text-[var(--text-secondary)]" },
  { p: "text-slate-600", r: "text-[var(--text-secondary)]" },
  { p: "text-slate-400", r: "text-[var(--text-muted)]" },
  { p: "bg-slate-50", r: "bg-[var(--bg-surface)]" },
  { p: "bg-slate-100", r: "bg-[var(--bg-surface)]" },
  { p: "bg-[#111]", r: "bg-[var(--btn-primary-bg)]" },
  { p: "text-white", r: "text-[var(--btn-primary-text)]" },
  { p: "border-[#111]", r: "border-[var(--btn-primary-bg)]" },
  { p: "hover:bg-black", r: "hover:bg-[var(--btn-primary-hover)]" },
  { p: "text-black", r: "text-[var(--text-primary)]" },
  { p: "hover:text-black", r: "hover:text-[var(--text-primary)]" }
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let c = fs.readFileSync(f, "utf8");
    replacements.forEach(({p, r}) => {
      // Split and join is a safe global replace for strings without regex escaping issues
      c = c.split(p).join(r);
    });
    fs.writeFileSync(f, c);
    console.log("Updated " + f);
  }
});

