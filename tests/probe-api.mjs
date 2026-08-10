// Probe Volcengine ARK APIs
const API_KEY = process.env.ARK_API_KEY;
if (!API_KEY) {
  console.error("ARK_API_KEY not set");
  process.exit(1);
}

const IMG_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const CHAT_URL = "https://ark.cn-beijing.volces.com/api/coding/v1/chat/completions";
const TEXT_MODEL = process.env.ARK_TEXT_MODEL || "doubao-seed-2.1-turbo";

// Probe 1: Text generation (chat completions)
async function probeChat() {
  console.log("=== Probe: ARK Chat Completions ===");
  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: "你是文案生成助手，只返回JSON格式的文案内容。" },
        {
          role: "user",
          content: `你是一个专业的海报文案生成器。根据以下需求生成一套完整的海报文案：

主题：双十一促销
场景：电商
风格：简约

请严格按以下JSON格式返回，不要包含任何其他文字：
{
  "mainTitle": "主标题（4-8个字，醒目有力）",
  "subTitle": "副标题（10-20个字，补充说明）",
  "hookLine": "引流短句（8-15个字，吸引点击）",
  "activityInfo": "活动说明（20-40个字，具体信息）",
  "footerNote": "底部备注（10-20个字，补充说明）"
}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.log(`  HTTP ${response.status}: FAIL`);
    console.log(`  ${err.substring(0, 500)}`);
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.log("  Empty response: FAIL");
    return null;
  }

  try {
    const parsed = JSON.parse(content);
    console.log("  Response (parsed):");
    console.log(JSON.stringify(parsed, null, 2));
    const hasFields = parsed.mainTitle && parsed.subTitle;
    console.log(`  Structured copy: ${hasFields ? "PASS" : "FAIL"}`);
    return parsed;
  } catch {
    console.log(`  Raw response: ${content}`);
    console.log("  JSON parse failed: FAIL");
    return null;
  }
}

// Probe 2: Image generation
async function probeImage() {
  console.log("\n=== Probe: Seedream Image Generation ===");

  const response = await fetch(IMG_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "doubao-seedream-4-5-251128",
      prompt: "一张简约风格的海报底图，纯净无文字，版式为上下居中，尺寸1080x1920像素。高质量商业海报背景，专业设计感。",
      n: 1,
      size: "1440x2560",
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.log(`  HTTP ${response.status}: FAIL`);
    console.log(`  ${err.substring(0, 500)}`);
    return null;
  }

  const data = await response.json();
  if (data.error) {
    console.log(`  Error: ${data.error.code} - ${data.error.message}`);
    return null;
  }

  const imageUrl = data.data?.[0]?.url;
  if (!imageUrl) {
    console.log("  No image URL in response: FAIL");
    console.log(JSON.stringify(data, null, 2).substring(0, 500));
    return null;
  }

  console.log(`  Image URL: ${imageUrl.substring(0, 100)}...`);
  console.log("  Image generation: PASS");

  // Download and save
  const { writeFileSync, mkdirSync } = await import("fs");
  const { join } = await import("path");
  const cacheDir = join(import.meta.dirname, "../.ai-poster-creation/cache");
  mkdirSync(cacheDir, { recursive: true });
  const imgPath = join(cacheDir, "probe-test.png");

  const imgRes = await fetch(imageUrl);
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  writeFileSync(imgPath, buffer);
  console.log(`  Saved to: ${imgPath} (${buffer.length} bytes)`);

  return imageUrl;
}

// Main
const copy = await probeChat();
const imageUrl = await probeImage();

console.log("\n=== Summary ===");
console.log(`Chat copy: ${copy ? "PASS" : "FAIL"}`);
console.log(`Seedream image: ${imageUrl ? "PASS" : "FAIL"}`);

process.exit(copy && imageUrl ? 0 : 1);
