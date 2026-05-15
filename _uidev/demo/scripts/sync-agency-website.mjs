import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoRoot = path.resolve(__dirname, "..");
const websiteDistDir = path.resolve(demoRoot, "..", "the_agency_website", "dist");
const targetDir = path.resolve(demoRoot, "dist", "client", "the_agency_website");

if (!fs.existsSync(path.join(websiteDistDir, "index.html"))) {
  throw new Error(
    `Agency website build output not found at ${websiteDistDir}. Run "npm --prefix ../the_agency_website run build" first.`
  );
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(websiteDistDir, targetDir, { recursive: true });

console.log(`Synced agency website to ${targetDir}`);
