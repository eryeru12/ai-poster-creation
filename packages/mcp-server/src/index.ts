import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { StateService } from "./services/state.js";
import { QwenService } from "./services/qwen.js";
import { WanxiangService } from "./services/wanxiang.js";
import { SecurityService } from "./services/security.js";
import { LAYOUTS } from "../../shared/dist/index.js";
import { readFile, stat, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const stateService = new StateService();
const qwenService = new QwenService();
const wanxiangService = new WanxiangService();
const securityService = new SecurityService();

// Idempotency cache: requestId → cached result
const copyResultCache = new Map<string, unknown>();
const imageResultCache = new Map<string, unknown>();
const promoResultCache = new Map<string, unknown>();

const mcpServer = new McpServer({
  name: "ai-poster-creation",
  version: "0.3.0",
});

// Tool: open_poster_editor
mcpServer.tool(
  "open_poster_editor",
  "Open the poster editor web UI",
  { projectId: z.string().optional() },
  async ({ projectId }) => {
    const pid = projectId || `proj-${uuidv4()}`;
    const port = await startWebServer(pid);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            url: `http://localhost:${port}`,
            projectId: pid,
          }),
        },
      ],
    };
  }
);

// Tool: generate_copy
mcpServer.tool(
  "generate_copy",
  "Generate poster copy using Qwen AI",
  {
    requestId: z.string(),
    params: z.object({
      theme: z.string(),
      scene: z.string(),
      style: z.string(),
    }),
  },
  async ({ requestId, params }) => {
    // Idempotency: return cached result if same requestId
    const cached = copyResultCache.get(requestId);
    if (cached) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(cached),
          },
        ],
      };
    }
    try {
      const copy = await qwenService.generateCopy(params);
      const result = { requestId, status: "succeeded", copy };
      copyResultCache.set(requestId, result);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              requestId,
              status: "failed",
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: generate_poster_images
mcpServer.tool(
  "generate_poster_images",
  "Generate poster background images for 8 layouts using Wanxiang AI",
  {
    requestId: z.string(),
    params: z.object({
      style: z.string(),
      size: z.object({ width: z.number(), height: z.number() }),
      referenceImage: z
        .object({
          path: z.string(),
          mode: z.enum(["composition", "color"]),
        })
        .optional(),
    }),
  },
  async ({ requestId, params }) => {
    // Idempotency: return cached result if same requestId
    const cached = imageResultCache.get(requestId);
    if (cached) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(cached),
          },
        ],
      };
    }
    const jobId = `job-${uuidv4()}`;
    // Start async generation
    wanxiangService.startGeneration(jobId, requestId, params);
    const result = { jobId, status: "queued" };
    imageResultCache.set(requestId, result);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result),
        },
      ],
    };
  }
);

// Tool: project_state
mcpServer.tool(
  "project_state",
  "Load or save project state",
  {
    action: z.enum(["load", "save"]),
    projectId: z.string(),
    data: z.any().optional(),
  },
  async ({ action, projectId, data }) => {
    try {
      if (action === "load") {
        const state = await stateService.loadProject(projectId);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                data: state,
                version: state?.version || 0,
              }),
            },
          ],
        };
      } else {
        const saved = await stateService.saveProject(projectId, data);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                data: saved,
                version: saved.version,
              }),
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: export_poster
mcpServer.tool(
  "export_poster",
  "Export poster as PNG or JPG",
  {
    projectId: z.string(),
    posterId: z.string(),
    format: z.enum(["png", "jpg"]),
    quality: z.number().optional(),
    imageData: z.string().optional(),
  },
  async ({ projectId, posterId, format, quality, imageData }) => {
    try {
      const result = await stateService.exportPoster(
        projectId,
        posterId,
        format,
        quality,
        imageData
      );
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// === v0.3 NEW TOOLS ===

// Tool: generate_promo_image
mcpServer.tool(
  "generate_promo_image",
  "Generate product promotional image using Wanxiang image-to-image + Qwen copy",
  {
    requestId: z.string(),
    params: z.object({
      productImagePath: z.string(),
      prompt: z.string(),
      size: z.object({ width: z.number(), height: z.number() }).optional(),
    }),
  },
  async ({ requestId, params }) => {
    const cached = promoResultCache.get(requestId);
    if (cached) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify(cached) }],
      };
    }
    try {
      const jobId = `job-${uuidv4()}`;
      wanxiangService.generatePromoImage(jobId, requestId, params);
      const result = { jobId, status: "queued" };
      promoResultCache.set(requestId, result);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              requestId,
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: list_projects
mcpServer.tool(
  "list_projects",
  "List all projects (posters and promo images) in the workspace",
  {},
  async () => {
    try {
      const items = await stateService.listAllProjects();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ items }),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool: promo_project_state
mcpServer.tool(
  "promo_project_state",
  "Load or save promo project state",
  {
    action: z.enum(["load", "save"]),
    promoId: z.string(),
    data: z.any().optional(),
  },
  async ({ action, promoId, data }) => {
    try {
      if (action === "load") {
        const state = await stateService.loadPromoProject(promoId);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                data: state,
                version: state?.projectVersion || 0,
              }),
            },
          ],
        };
      } else {
        const saved = await stateService.savePromoProject(promoId, data);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                data: saved,
                version: saved.projectVersion,
              }),
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  }
);

// Web server for UI
async function startWebServer(projectId: string): Promise<number> {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const uiPath = path.resolve(__dirname, "../../ui/dist");
  app.use(express.static(uiPath));

  // API endpoints for UI
  app.get("/api/project/:id", async (req, res) => {
    try {
      const state = await stateService.loadProject(req.params.id);
      res.json(state);
    } catch (error) {
      res.status(404).json({ error: "Project not found" });
    }
  });

  app.post("/api/project/:id", async (req, res) => {
    try {
      const saved = await stateService.saveProject(req.params.id, req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/generate/copy", async (req, res) => {
    try {
      const copy = await qwenService.generateCopy(req.body);
      res.json({ status: "succeeded", copy });
    } catch (error) {
      res.status(500).json({
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/generate/images", async (req, res) => {
    const jobId = `job-${uuidv4()}`;
    wanxiangService.startGeneration(jobId, req.body.requestId, req.body.params);
    res.json({ jobId, status: "queued" });
  });

  app.get("/api/job/:id/status", (req, res) => {
    const status = wanxiangService.getJobStatus(req.params.id);
    if (!status) {
      return res.status(404).json({ error: "Job not found" });
    }
    // Include promo-specific data (promoImage from first succeeded image)
    const promoImage = status.images?.find((i) => i.status === "succeeded");
    const promoCopy = (status as unknown as Record<string, unknown>).promoCopy;
    res.json({
      jobId: status.jobId,
      status: status.status,
      progress: status.progress,
      total: status.total,
      images: status.images,
      promoImage: promoImage ? { imagePath: promoImage.imagePath, width: 1440, height: 2560 } : undefined,
      promoCopy: promoCopy || undefined,
    });
  });

  app.post("/api/job/:id/cancel", (req, res) => {
    wanxiangService.cancelJob(req.params.id);
    res.json({ status: "cancelled" });
  });

  app.get("/api/layouts", (_req, res) => {
    res.json(LAYOUTS);
  });

  // Serve generated images
  app.get("/api/image", async (req, res) => {
    const imagePath = req.query.path as string;
    if (!imagePath) {
      return res.status(400).json({ error: "Missing path parameter" });
    }
    // Security: only allow images from project cache dir
    const cacheDir = path.join(process.cwd(), ".ai-poster-creation", "cache");
    const resolved = path.resolve(imagePath);
    if (!resolved.startsWith(cacheDir)) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (!existsSync(resolved)) {
      return res.status(404).json({ error: "Image not found" });
    }
    try {
      const data = await readFile(resolved);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(data);
    } catch {
      res.status(500).json({ error: "Failed to read image" });
    }
  });

  // === v0.3 NEW API ROUTES ===

  // Upload product image
  app.post("/api/upload/product-image", express.raw({ type: "image/*", limit: "10mb" }), async (req, res) => {
    try {
      const buf = req.body as Buffer;
      const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
      const isWebP = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
      if (!isPng && !isJpeg && !isWebP) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      const dir = path.join(process.cwd(), ".ai-poster-creation", "uploads");
      await mkdir(dir, { recursive: true });
      const ext = isPng ? ".png" : isJpeg ? ".jpg" : ".webp";
      const filename = `product-${Date.now()}${ext}`;
      const filePath = path.join(dir, filename);
      await writeFile(filePath, buf);
      res.json({ imagePath: filePath, filename });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  });

  // Generate promo image
  app.post("/api/generate/promo", async (req, res) => {
    try {
      const { requestId, prompt, promoId, productImagePath } = req.body;
      const jobId = `job-${uuidv4()}`;
      // Start Wanxiang generation in background
      wanxiangService.generatePromoImage(jobId, requestId, {
        productImagePath,
        prompt,
      });
      // Start Qwen copy generation in background
      qwenService.generatePromoCopy(prompt).then((promoCopy) => {
        // Store result for job status endpoint
        const job = wanxiangService.getJobStatus(jobId);
        if (job) {
          (job as unknown as Record<string, unknown>).promoCopy = promoCopy;
        }
      }).catch(() => { /* copy failure is non-fatal */ });
      res.json({ jobId, status: "queued" });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Generation failed",
      });
    }
  });

  // List all projects (dashboard)
  app.get("/api/projects", async (_req, res) => {
    try {
      const items = await stateService.listAllProjects();
      res.json({ items });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Failed to list projects",
      });
    }
  });

  // Load promo project
  app.get("/api/promo/:id", async (req, res) => {
    try {
      const state = await stateService.loadPromoProject(req.params.id);
      res.json(state);
    } catch (error) {
      res.status(404).json({ error: "Promo project not found" });
    }
  });

  // Save promo project
  app.post("/api/promo/:id/save", async (req, res) => {
    try {
      const saved = await stateService.savePromoProject(req.params.id, req.body);
      res.json(saved);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Upload reference image
  app.post("/api/upload/reference", express.raw({ type: "image/*", limit: "10mb" }), async (req, res) => {
    try {
      const buf = req.body as Buffer;
      // Validate magic bytes: PNG (89 50 4E 47), JPEG (FF D8 FF), WebP (52 49 46 46)
      const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
      const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
      const isWebP = buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46;
      if (!isPng && !isJpeg && !isWebP) {
        return res.status(400).json({ error: "Invalid image format" });
      }
      const dir = path.join(process.cwd(), ".ai-poster-creation", "uploads");
      await mkdir(dir, { recursive: true });
      const ext = isPng ? ".png" : isJpeg ? ".jpg" : ".webp";
      const filename = `ref-${Date.now()}${ext}`;
      const filePath = path.join(dir, filename);
      await writeFile(filePath, buf);
      res.json({ path: filePath, filename });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  });

  // Export poster
  app.post("/api/export", async (req, res) => {
    try {
      const { projectId, posterId, format, imageData } = req.body;
      const result = await stateService.exportPoster(projectId, posterId, format, undefined, imageData);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Export failed",
      });
    }
  });

  // Download exported file (also serves cache and uploads for preview)
  app.get("/api/download", async (req, res) => {
    const filePath = req.query.path as string;
    if (!filePath) return res.status(400).json({ error: "Missing path" });
    const stateDir = path.join(process.cwd(), ".ai-poster-creation");
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(stateDir)) {
      return res.status(403).json({ error: "Access denied" });
    }
    if (!existsSync(resolved)) {
      return res.status(404).json({ error: "File not found" });
    }
    res.download(resolved);
  });

  // SPA fallback
  app.get("*", (_req, res) => {
    res.sendFile(path.join(uiPath, "index.html"));
  });

  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 3000;
      resolve(port);
    });
  });
}

// Start MCP server
async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

main().catch(console.error);
