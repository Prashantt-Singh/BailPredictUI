
const fs = require("fs");
const files = ["src/pages/Login.tsx", "src/pages/Signup.tsx"];
files.forEach(f => {
  let c = fs.readFileSync(f, "utf8");
  // Fix button background and text
  c = c.replace(/bg-\\[#0a0f1e\\] text-\\[#C9A84C\\]/g, "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]");
  // Fix "Or continue with" text color
  c = c.replace(/text-slate-300/g, "text-[var(--text-muted)]");
  // Fix Link colors
  c = c.replace(/text-\\[#0a0f1e\\] hover:text-\\[#C9A84C\\]/g, "text-[var(--text-primary)] hover:text-[var(--gold)]");
  // Fix Check your email text
  c = c.replace(/text-\\[#0a0f1e\\]/g, "text-[var(--text-primary)]");
  
  fs.writeFileSync(f, c);
  console.log("Updated " + f);
});

