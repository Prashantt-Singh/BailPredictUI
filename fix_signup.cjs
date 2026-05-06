
const fs = require("fs");
let c = fs.readFileSync("src/pages/Signup.tsx", "utf8");
c = c.replace(/text-slate-800/g, "text-[var(--text-primary)]");
fs.writeFileSync("src/pages/Signup.tsx", c);
console.log("Updated Signup.tsx");

