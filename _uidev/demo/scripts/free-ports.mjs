import killPort from "kill-port";

const ports = [19877, 9777, 8787, 5173, 5174, 5175];
for (const p of ports) {
  try {
    await killPort(p);
    console.log(`[predev] freed port ${p}`);
  } catch {
    // no listener
  }
}
