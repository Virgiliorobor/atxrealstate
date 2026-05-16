import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.resolve(__dirname, "..");
const websiteRoot = path.resolve(demoRoot, "..", "the_agency_website");
const outDir = path.join(demoRoot, "dist", "client", "the_agency_website");
const viteBin = path.join(websiteRoot, "node_modules", ".bin", "vite");

if (!fs.existsSync(websiteRoot)) {
  throw new Error(`Agency website directory not found: ${websiteRoot}`);
}
if (!fs.existsSync(viteBin)) {
  throw new Error(`vite not found at ${viteBin} — did npm ci run in the_agency_website?`);
}

console.log(`Building agency website → ${outDir}`);
execSync(
  `"${viteBin}" build --base=/the_agency_website/ --outDir "${outDir}" --emptyOutDir`,
  { cwd: websiteRoot, stdio: "inherit" }
);
console.log("Agency website build complete.");
