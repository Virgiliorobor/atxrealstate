import path from "node:path";

/** Repo root containing AI_README.md (parent of _uidev). */
export function getAgencyRoot(): string {
  const env = process.env.AGENCY_ROOT?.trim();
  if (env) return path.resolve(env);
  const cwd = process.cwd();
  if (cwd.includes("_uidev" + path.sep + "demo")) {
    return path.resolve(cwd, "..", "..");
  }
  return path.resolve(cwd, "..", "..");
}

export function dealsDir(root: string): string {
  return path.join(root, "_database", "deals");
}

export function propertiesDir(root: string): string {
  return path.join(root, "_catalog", "properties");
}

export function safeDealFilename(channel: string): string | null {
  const m = channel.match(/^#?(\d+)-(buyer|seller)$/i);
  if (!m) return null;
  return `${m[1]}-${m[2].toLowerCase()}.json`;
}

export function assertSafeDealFile(name: string): void {
  if (!/^\d+-(buyer|seller)\.json$/i.test(name)) {
    throw new Error("Invalid deal file name");
  }
}

export function assertSafePropertyId(id: string): void {
  if (!/^ATX-\d{3}$/i.test(id)) {
    throw new Error("Invalid property id");
  }
}

export function propertyFilePath(root: string, propertyId: string): string {
  assertSafePropertyId(propertyId);
  const safe = propertyId.toUpperCase();
  return path.join(propertiesDir(root), `${safe}.md`);
}
