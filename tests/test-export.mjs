// Export functionality test
// Verifies: base64 image data decoded, PNG written, magic bytes valid

import { StateService } from "../packages/mcp-server/dist/services/state.js";
import { stat, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const svc = new StateService();

const testPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";

const result = await svc.exportPoster("test-proj", "poster-001", "png", 90, `data:image/png;base64,${testPng}`);

console.log("Export result:", JSON.stringify(result, null, 2));

if (!existsSync(result.filePath)) {
  console.log("FAIL: Output file does not exist");
  process.exit(1);
}

const stats = await stat(result.filePath);
const buf = await readFile(result.filePath);

console.log(`File size: ${stats.size} bytes`);
console.log(`Magic bytes: ${buf[0].toString(16)} ${buf[1].toString(16)} ${buf[2].toString(16)} ${buf[3].toString(16)}`);

const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
const fileSizeOk = stats.size === result.fileSize;

console.log(`Valid PNG: ${isPng ? "PASS" : "FAIL"}`);
console.log(`File size match: ${fileSizeOk ? "PASS" : "FAIL"}`);

const finalResult = isPng && fileSizeOk;
console.log(`\nExport: ${finalResult ? "PASS" : "FAIL"}`);
process.exit(finalResult ? 0 : 1);
