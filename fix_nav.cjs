
const fs = require("fs");
let c = fs.readFileSync("src/components/Navbar.tsx", "utf8");

// Fix Get Started and Sign In button texts
c = c.replace(/text-\\[var\\(--bg-primary\\)\\]/g, "text-white dark:text-black");

// Fix nav links being dull gray
c = c.replace(/text-\\[var\\(--text-secondary\\)\\]/g, "text-[var(--text-primary)] opacity-80");
c = c.replace(/hover:text-\\[var\\(--text-primary\\)\\]/g, "hover:opacity-100");

// Fix Logo
c = c.replace(
  /<span className="text-\\[18px\\] font-black tracking-tight text-\\[var\\(--text-primary\\)\\]">\\s*BailPredict\\s*<\\/span>/g,
  `<span className="text-[18px] font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-primary)] via-[#C9A84C] to-[var(--text-primary)] bg-[length:200%_auto] animate-gradient">
            BailPredict
          </span>`
);

fs.writeFileSync("src/components/Navbar.tsx", c);
console.log("Updated Navbar.tsx");

// Fix Language Switcher
let l = fs.readFileSync("src/components/LanguageSwitcher.tsx", "utf8");
l = l.replace(/text-\\[var\\(--bg-primary\\)\\]/g, "text-white dark:text-black");
fs.writeFileSync("src/components/LanguageSwitcher.tsx", l);
console.log("Updated LanguageSwitcher.tsx");

