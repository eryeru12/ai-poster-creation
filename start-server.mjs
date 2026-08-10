import "dotenv/config";
if (!process.env.ARK_API_KEY) {
  console.error("ARK_API_KEY environment variable is not set. Please set it before running the server.");
  process.exit(1);
}

// Use dynamic imports so the env var assignment above runs first
const [expressModule, corsModule, pathModule, urlModule, fsPromises, fsModule, uuidModule, sharedModule, stateModule, qwenModule, wanxiangModule, securityModule] = await Promise.all([
  import("express"),
  import("cors"),
  import("path"),
  import("url"),
  import("fs/promises"),
  import("fs"),
  import("uuid"),
  import("./packages/shared/dist/index.js"),
  import("./packages/mcp-server/dist/services/state.js"),
  import("./packages/mcp-server/dist/services/qwen.js"),
  import("./packages/mcp-server/dist/services/wanxiang.js"),
  import("./packages/mcp-server/dist/services/security.js"),
]);

const express = expressModule.default;
const cors = corsModule.default;
const path = pathModule.default;
const { fileURLToPath } = urlModule;
const { readFile, writeFile, mkdir } = fsPromises;
const { existsSync } = fsModule;
const { v4: uuidv4 } = uuidModule;
const { LAYOUTS } = sharedModule;
const { StateService } = stateModule;
const { QwenService } = qwenModule;
const { WanxiangService } = wanxiangModule;
const { SecurityService } = securityModule;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

const stateService = new StateService();
const qwenService = new QwenService();
const wanxiangService = new WanxiangService();
const securityService = new SecurityService();

// --- API routes ---

app.get("/api/project/:id", async (req, res) => {
  try {
    const state = await stateService.loadProject(req.params.id);
    res.json(state);
  } catch { res.status(404).json({ error: "Project not found" }); }
});

app.post("/api/project/:id", async (req, res) => {
  try {
    const saved = await stateService.saveProject(req.params.id, req.body);
    res.json(saved);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/generate/copy", async (req, res) => {
  try {
    const copy = await qwenService.generateCopy(req.body);
    res.json({ status: "succeeded", copy });
  } catch (e) { res.status(500).json({ status: "failed", error: e.message }); }
});

app.post("/api/generate/images", async (req, res) => {
  const jobId = `job-${uuidv4()}`;
  wanxiangService.startGeneration(jobId, req.body.requestId, req.body.params);
  res.json({ jobId, status: "queued" });
});

app.get("/api/job/:id/status", (req, res) => {
  const s = wanxiangService.getJobStatus(req.params.id);
  if (!s) return res.status(404).json({ error: "Job not found" });
  const succeededImages = s.images?.filter((i) => i.status === "succeeded") || [];
  const isMultiCandidate = succeededImages.length > 1 && s.total === 4;
  const promoImage = !isMultiCandidate
    ? (s.images?.find((i) => i.status === "succeeded") || null)
    : null;
  res.json({
    jobId: s.jobId,
    status: s.status,
    progress: s.progress,
    total: s.total,
    images: s.images,
    promoImage: promoImage ? { imagePath: promoImage.imagePath, width: 1440, height: 2560, suggestion: promoImage.suggestion || undefined } : undefined,
    promoCopy: s.promoCopy || undefined,
    detailPageImages: s.detailPageImages || undefined,
    detailProgress: s.detailProgress,
    detailTotal: s.detailTotal,
    initialCandidates: isMultiCandidate
      ? succeededImages.map((i) => ({ imagePath: i.imagePath, status: i.status, suggestion: i.suggestion || undefined }))
      : undefined,
  });
});

app.post("/api/job/:id/cancel", (req, res) => {
  wanxiangService.cancelJob(req.params.id);
  res.json({ status: "cancelled" });
});

app.get("/api/layouts", (_req, res) => res.json(LAYOUTS));

app.get("/api/image", async (req, res) => {
  const p = req.query.path;
  if (!p) return res.status(400).json({ error: "Missing path" });
  const cacheDir = path.join(process.cwd(), ".ai-poster-creation", "cache");
  const resolved = path.resolve(p);
  if (!resolved.startsWith(cacheDir)) return res.status(403).json({ error: "Access denied" });
  if (!existsSync(resolved)) return res.status(404).json({ error: "Not found" });
  const data = await readFile(resolved);
  // Detect actual image format from magic bytes
  let contentType = "image/png";
  if (data[0] === 0xff && data[1] === 0xd8) contentType = "image/jpeg";
  else if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46) contentType = "image/webp";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(data);
});

app.post("/api/upload/reference", express.raw({ type: "image/*", limit: "10mb" }), async (req, res) => {
  try {
    const buf = req.body;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isWebP = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
    if (!isPng && !isJpeg && !isWebP) return res.status(400).json({ error: "Invalid image format" });
    const dir = path.join(process.cwd(), ".ai-poster-creation", "uploads");
    await mkdir(dir, { recursive: true });
    const ext = isPng ? ".png" : isJpeg ? ".jpg" : ".webp";
    const filename = `ref-${Date.now()}${ext}`;
    await writeFile(path.join(dir, filename), buf);
    res.json({ path: path.join(dir, filename), filename });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/export", async (req, res) => {
  try {
    const r = await stateService.exportPoster(
      req.body.projectId, req.body.posterId, req.body.format, undefined, req.body.imageData, req.body.imagePath
    );
    res.json(r);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/download", async (req, res) => {
  const fp = req.query.path;
  if (!fp) return res.status(400).json({ error: "Missing path" });
  const stateDir = path.join(process.cwd(), ".ai-poster-creation");
  const resolved = path.resolve(fp);
  if (!resolved.startsWith(stateDir)) return res.status(403).json({ error: "Access denied" });
  if (!existsSync(resolved)) return res.status(404).json({ error: "File not found" });
  const data = await readFile(resolved);
  let contentType = "image/png";
  if (data[0] === 0xff && data[1] === 0xd8) contentType = "image/jpeg";
  else if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46) contentType = "image/webp";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(resolved))}`);
  res.send(data);
});

// === v0.3 promo routes ===

app.post("/api/upload/product-image", express.raw({ type: "image/*", limit: "10mb" }), async (req, res) => {
  try {
    const buf = req.body;
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    const isWebP = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
    if (!isPng && !isJpeg && !isWebP) return res.status(400).json({ error: "Invalid image format" });
    const dir = path.join(process.cwd(), ".ai-poster-creation", "uploads");
    await mkdir(dir, { recursive: true });
    const ext = isPng ? ".png" : isJpeg ? ".jpg" : ".webp";
    const filename = `product-${Date.now()}${ext}`;
    const filePath = path.join(dir, filename);
    await writeFile(filePath, buf);
    // Defense-in-depth: re-validate saved file
    const validation = await securityService.validateProductImage(filePath);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || "Invalid image" });
    }
    res.json({ imagePath: filePath, filename });
  } catch (e) { res.status(500).json({ error: e.message || "Upload failed" }); }
});

app.post("/api/generate/promo", async (req, res) => {
  try {
    const { requestId, prompt, promoId, productImagePath } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    if (prompt.length > 500) return res.status(400).json({ error: "Prompt must be 500 characters or fewer" });
    if (productImagePath) {
      const validation = await securityService.validateProductImage(productImagePath);
      if (!validation.valid) return res.status(400).json({ error: validation.error || "Invalid product image" });
    }
    const jobId = `job-${uuidv4()}`;
    wanxiangService.generatePromoImage(jobId, requestId, { productImagePath, prompt });
    qwenService.generatePromoCopy(prompt).then((promoCopy) => {
      const job = wanxiangService.getJobStatus(jobId);
      if (job) job.promoCopy = promoCopy;
    }).catch(() => {});
    res.json({ jobId, status: "queued" });
  } catch (e) { res.status(500).json({ error: e.message || "Generation failed" }); }
});

// === v0.4: Optimization routes ===

app.post("/api/generate/promo/suggestions", async (req, res) => {
  try {
    const { originalPrompt, accumulatedPrompt, targetPhase, phaseHistory } = req.body;
    if (!originalPrompt || !accumulatedPrompt || !targetPhase) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const phaseOperations = await qwenService.generateOptimizationSuggestions({
      originalPrompt,
      accumulatedPrompt,
      targetPhase,
      phaseHistory,
    });
    res.json({ phaseOperations });
  } catch (e) { res.status(500).json({ error: e.message || "Suggestion generation failed" }); }
});

app.post("/api/generate/promo/optimize", async (req, res) => {
  try {
    const { requestId, promoId, productImagePath, accumulatedPrompt, referenceImagePath } = req.body;
    if (!accumulatedPrompt) {
      return res.status(400).json({ error: "Missing accumulatedPrompt" });
    }
    const jobId = `job-${uuidv4()}`;
    wanxiangService.generatePromoOptimizedImage(jobId, requestId, { productImagePath, prompt: accumulatedPrompt, referenceImagePath });
    qwenService.generatePromoCopy(accumulatedPrompt).then((promoCopy) => {
      const job = wanxiangService.getJobStatus(jobId);
      if (job) job.promoCopy = promoCopy;
    }).catch(() => {});
    res.json({ jobId, status: "queued" });
  } catch (e) { res.status(500).json({ error: e.message || "Optimization failed" }); }
});

app.post("/api/generate/promo/detail-pages", async (req, res) => {
  try {
    const { requestId, promoId, productImagePath, accumulatedPrompt, referenceImagePath } = req.body;
    if (!accumulatedPrompt) {
      return res.status(400).json({ error: "Missing accumulatedPrompt" });
    }
    const jobId = `job-${uuidv4()}`;
    wanxiangService.generateDetailPages(jobId, requestId, { productImagePath, accumulatedPrompt, referenceImagePath });
    res.json({ jobId, status: "queued" });
  } catch (e) { res.status(500).json({ error: e.message || "Detail pages generation failed" }); }
});

app.get("/api/projects", async (_req, res) => {
  try {
    const items = await stateService.listAllProjects();
    res.json({ items });
  } catch (e) { res.status(500).json({ error: e.message || "Failed to list projects" }); }
});

app.get("/api/promo/:id", async (req, res) => {
  try {
    const state = await stateService.loadPromoProject(req.params.id);
    if (!state) return res.status(404).json({ error: "Promo project not found" });
    res.json(state);
  } catch (e) { res.status(404).json({ error: "Promo project not found" }); }
});

app.post("/api/promo/:id/save", async (req, res) => {
  try {
    const saved = await stateService.savePromoProject(req.params.id, req.body);
    res.json(saved);
  } catch (e) { res.status(500).json({ error: e.message || "Unknown error" }); }
});

// Static UI + SPA fallback
const uiPath = path.resolve(__dirname, "packages/ui/dist");
app.use(express.static(uiPath));
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(uiPath, "index.html")));

// Start
const PORT = 3456;
app.listen(PORT, () => {
  console.log(`\n===== AI Poster MCP Server =====`);
  console.log(`UI:     http://localhost:${PORT}`);
  console.log(`Layouts: http://localhost:${PORT}/api/layouts`);
  console.log(`================================\n`);
});
