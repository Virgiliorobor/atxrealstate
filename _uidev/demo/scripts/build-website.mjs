import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.resolve(__dirname, "..");
const websiteRoot = path.resolve(demoRoot, "..", "the_agency_website");
const outDir = path.join(demoRoot, "dist", "client", "the_agency_website");

if (!fs.existsSync(websiteRoot)) {
  throw new Error(`Agency website directory not found: ${websiteRoot}\nConfirm Railway Root Directory includes _uidev/the_agency_website.`);
}

// Install deps here (not in nixpacks install phase) because nixpacks copies
// only the root package files into the install layer for caching — the sibling
// the_agency_website/ directory is only available in the build layer.
console.log("Installing agency website dependencies...");
execSync("npm ci --no-audit --no-fund", { cwd: websiteRoot, stdio: "inherit" });

const viteBin = path.join(websiteRoot, "node_modules", ".bin", "vite");
if (!fs.existsSync(viteBin)) {
  throw new Error(`vite not found at ${viteBin} after npm ci — check the_agency_website/package.json`);
}

console.log(`Building agency website → ${outDir}`);
execSync(
  `"${viteBin}" build --base=/the_agency_website/ --outDir "${outDir}" --emptyOutDir`,
  { cwd: websiteRoot, stdio: "inherit" }
);
console.log("Agency website build complete.");
