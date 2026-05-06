
const fs = require("fs");
let c = fs.readFileSync("src/components/Navbar.tsx", "utf8");
c = c.replace(/hover:text-white dark:text-black/g, "hover:text-white dark:hover:text-black");
fs.writeFileSync("src/components/Navbar.tsx", c);
console.log("Fixed Navbar hover");

