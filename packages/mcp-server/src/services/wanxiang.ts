import { v4 as uuidv4 } from "uuid";
import { LAYOUTS } from "../../../shared/dist/index.js";
import { SecurityService } from "./security.js";
import { QwenService } from "./qwen.js";
import path from "path";
import { writeFile, mkdir } from "fs/promises";

const securityService = new SecurityService();
const qwenService = new QwenService();

interface JobStatus {
  jobId: string;
  requestId: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  images: Array<{
    layoutId: string;
    imagePath: string;
    status: "succeeded" | "failed";
    error?: string;
    suggestion?: string;
  }>;
  progress: number;
  total: number;
  callbacks: Array<(event: unknown) => void>;
  abortController: AbortController;
  detailPageImages?: Array<{
    subType: string;
    imagePath: string;
    status: "succeeded" | "failed";
    error?: string;
  }>;
  detailProgress?: number;
  detailTotal?: number;
}

export class WanxiangService {
  private jobs = new Map<string, JobStatus>();

  async startGeneration(
    jobId: string,
    requestId: string,
    params: {
      style: string;
      size: { width: number; height: number };
      referenceImage?: { path: string; mode: "composition" | "color" };
    }
  ): Promise<void> {
    const abortController = new AbortController();
    const job: JobStatus = {
      jobId,
      requestId,
      status: "running",
      images: [],
      progress: 0,
      total: LAYOUTS.length,
      callbacks: [],
      abortController,
    };
    this.jobs.set(jobId, job);

    // Generate images in parallel
    const promises = LAYOUTS.map(async (layout) => {
      if (abortController.signal.aborted) {
        job.images.push({
          layoutId: layout.layoutId,
          imagePath: "",
          status: "failed",
          error: "Cancelled",
        });
        job.progress++;
        return;
      }
      try {
        const imagePath = await this.generateSingleImage(
          layout.layoutId,
          params,
          abortController.signal
        );
        if (abortController.signal.aborted) {
          job.images.push({
            layoutId: layout.layoutId,
            imagePath: "",
            status: "failed",
            error: "Cancelled",
          });
          job.progress++;
          return;
        }
        job.images.push({
          layoutId: layout.layoutId,
          imagePath,
          status: "succeeded",
        });
        job.progress++;
        this.notifyCallbacks(job);
      } catch (error) {
        job.images.push({
          layoutId: layout.layoutId,
          imagePath: "",
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
        job.progress++;
        this.notifyCallbacks(job);
      }
    });

    await Promise.all(promises);
    if (abortController.signal.aborted) {
      job.status = "cancelled";
    } else {
      job.status = job.images.some((i) => i.status === "succeeded")
        ? "succeeded"
        : "failed";
    }
    this.notifyCallbacks(job);
  }

  // ARK images API minimum pixel requirement
  private static readonly MIN_PIXELS = 3686400;

  private computeSeedreamSize(params: {
    size: { width: number; height: number };
  }): string {
    const { width, height } = params.size;
    if (width * height >= WanxiangService.MIN_PIXELS) {
      return `${width}x${height}`;
    }
    const scale = Math.sqrt(WanxiangService.MIN_PIXELS / (width * height));
    return `${Math.ceil(width * scale)}x${Math.ceil(height * scale)}`;
  }

  private detectImageExt(buffer: Buffer): string {
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return ".png";
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return ".jpg";
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return ".webp";
    return ".png";
  }

  private async generateSingleImage(
    layoutId: string,
    params: {
      style: string;
      size: { width: number; height: number };
      referenceImage?: { path: string; mode: "composition" | "color" };
    },
    signal?: AbortSignal
  ): Promise<string> {
    const apiKey = securityService.getApiKey();
    const layout = LAYOUTS.find((l) => l.layoutId === layoutId);

    const rawPrompt = `一张${params.style}风格的海报底图，纯净无文字，版式为${layout?.name || layoutId}，尺寸${params.size.width}x${params.size.height}像素。高质量商业海报背景，专业设计感。`;
    const prompt = await qwenService.optimizeImagePrompt(rawPrompt, `海报-${layoutId}`);
    const size = this.computeSeedreamSize(params);

    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "doubao-seedream-4-5-251128",
          prompt,
          n: 1,
          size,
          temperature: 0.4,
          watermark: true,
        }),
        signal,
      }
    );

    if (signal?.aborted) {
      throw new Error("Cancelled");
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Seedream API error: ${response.status}${errText ? " - " + errText.slice(0, 200) : ""}`);
    }

    const data = (await response.json()) as {
      data?: Array<{ url?: string }>;
      error?: { code?: string; message?: string };
    };

    if (data.error) {
      throw new Error(`Seedream error: ${data.error.code} - ${data.error.message}`);
    }

    const imageUrl = data.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL in response");
    }

    // Download and save
    const root = process.env.AI_POSTER_PROJECT_ROOT || process.cwd();
    const dir = path.join(root, ".ai-poster-creation", "cache");
    await mkdir(dir, { recursive: true });

    const imgResponse = await fetch(imageUrl, { signal });
    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    const ext = this.detectImageExt(buffer);
    const imagePath = path.join(dir, `img-${uuidv4()}${ext}`);
    await writeFile(imagePath, buffer);

    return imagePath;
  }

  // === v0.3: Promo image generation (text-to-image via Seedream) ===
  async generatePromoImage(
    jobId: string,
    requestId: string,
    params: {
      productImagePath?: string;
      prompt: string;
      size?: { width: number; height: number };
      referenceImagePath?: string;
    }
  ): Promise<void> {
    const abortController = new AbortController();
    const targetSize = params.size || { width: 1440, height: 2560 };
    const size = this.computeSeedreamSize({ size: targetSize });
    const hasProductImage = !!params.productImagePath;
    const hasRefImage = !!params.referenceImagePath;
    const batchCount = hasProductImage ? 1 : 4;

    const job: JobStatus = {
      jobId,
      requestId,
      status: "running",
      images: [],
      progress: 0,
      total: batchCount,
      callbacks: [],
      abortController,
    };
    this.jobs.set(jobId, job);

    const apiKey = securityService.getApiKey();
    const { readFile } = await import("fs/promises");
    const root = process.env.AI_POSTER_PROJECT_ROOT || process.cwd();
    const dir = path.join(root, ".ai-poster-creation", "cache");
    await mkdir(dir, { recursive: true });

    // Prepare reference images (shared across all batch calls)
    const refImages: string[] = [];
    if (hasProductImage) {
      try {
        const prodBuffer = await readFile(params.productImagePath!);
        const prodExt = this.detectImageExt(prodBuffer).replace(".", "");
        refImages.push(`data:image/${prodExt};base64,${prodBuffer.toString("base64")}`);
      } catch { /* continue */ }
    }
    if (hasRefImage) {
      try {
        const refBuffer = await readFile(params.referenceImagePath!);
        const refExt = this.detectImageExt(refBuffer).replace(".", "");
        refImages.push(`data:image/${refExt};base64,${refBuffer.toString("base64")}`);
      } catch { /* continue */ }
    }

    // Build prompt based on reference mode
    const hasDualRef = refImages.length >= 2;
    const isInitial = !hasRefImage;
    let basePrompt: string;
    if (isInitial) {
      basePrompt = params.prompt;
    } else if (hasDualRef) {
      basePrompt = `${params.prompt}。生成一幅高质量商业宣传图。重要：保持图1中商品的外观完全一致（颜色、形状、材质、品牌特征不变），在图2的整体构图和风格基础上做优化修改，不要大幅改动图2的画面结构。精美的电商宣传海报风格，适合社交媒体推广。`;
    } else if (refImages.length === 1 && !hasProductImage) {
      basePrompt = `${params.prompt}。生成一幅高质量商业宣传图，在参考图的整体构图和风格基础上做优化修改，不要大幅改动画面结构。精美的电商宣传海报风格，适合社交媒体推广。`;
    } else {
      basePrompt = `${params.prompt}。生成一幅高质量商业宣传图。精美的电商宣传海报风格，适合社交媒体推广。`;
    }

    // Optimize prompt only for optimization steps (has reference image from previous step)
    const modeLabel = hasProductImage ? (hasRefImage ? "优化生成" : "初始生成-有商品图") : (hasRefImage ? "优化生成-无商品图" : "初始生成-无商品图");
    const optimizedBase = isInitial ? basePrompt : await qwenService.optimizeImagePrompt(basePrompt, modeLabel);

    const variationSuffixes = isInitial ? [] : [
      "画面采用明亮暖色调，突出产品的高级感和品质。",
      "画面采用清新自然风格，构图简洁大方，留白适中。",
      "画面采用时尚现代设计，强调动感和活力。",
      "画面采用优雅经典风格，注重光影和层次感。",
    ];

    const generateOne = async (index: number): Promise<void> => {
      if (abortController.signal.aborted) {
        job.images.push({ layoutId: `promo_candidate_${index}`, imagePath: "", status: "failed", error: "Cancelled" });
        job.progress++;
        this.notifyCallbacks(job);
        return;
      }

      try {
        const fullPrompt = variationSuffixes.length > 0
          ? `${optimizedBase} ${variationSuffixes[index] || ""}`
          : optimizedBase;

        const body: Record<string, unknown> = {
          model: "doubao-seedream-4-5-251128",
          prompt: fullPrompt,
          n: 1,
          size,
          temperature: 0.4,
          watermark: isInitial ? false : true,
        };
        if (refImages.length === 1) {
          body.image = refImages[0];
        } else if (refImages.length > 1) {
          body.image = refImages;
          body.sequential_image_generation = "disabled";
        }

        const response = await fetch(
          "https://ark.cn-beijing.volces.com/api/v3/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: abortController.signal,
          }
        );

        if (abortController.signal.aborted) {
          job.images.push({ layoutId: `promo_candidate_${index}`, imagePath: "", status: "failed", error: "Cancelled" });
          job.progress++;
          this.notifyCallbacks(job);
          return;
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(`Seedream API error: ${response.status}${errText ? " - " + errText.slice(0, 200) : ""}`);
        }

        const data = (await response.json()) as {
          data?: Array<{ url?: string }>;
          error?: { code?: string; message?: string };
        };

        if (data.error) {
          throw new Error(`Seedream error: ${data.error.code} - ${data.error.message}`);
        }

        const imageUrl = data.data?.[0]?.url;
        if (!imageUrl) throw new Error("No image URL");

        const imgResponse = await fetch(imageUrl, { signal: abortController.signal });
        const buffer = Buffer.from(await imgResponse.arrayBuffer());
        const ext = this.detectImageExt(buffer);
        const imagePath = path.join(dir, `promo_img_${uuidv4()}${ext}`);
        await writeFile(imagePath, buffer);

        job.images.push({ layoutId: `promo_candidate_${index}`, imagePath, status: "succeeded" });
        job.progress++;
        this.notifyCallbacks(job);
      } catch (e) {
        if (!abortController.signal.aborted) {
          job.images.push({
            layoutId: `promo_candidate_${index}`, imagePath: "",
            status: "failed",
            error: e instanceof Error ? e.message : "Download failed",
          });
          job.progress++;
          this.notifyCallbacks(job);
        }
      }
    };

    // Fire all requests in parallel (single-image mode: 1 call; batch mode: 4 calls)
    const promises: Promise<void>[] = [];
    for (let i = 0; i < batchCount; i++) {
      promises.push(generateOne(i));
    }
    await Promise.all(promises);

    // For initial generation (isInitial): run VLM analysis on each succeeded image
    if (isInitial && !abortController.signal.aborted) {
      const succeeded = job.images.filter((img) => img.status === "succeeded");
      console.log(`[generatePromoImage] Starting VLM analysis for ${succeeded.length} images...`);
      const analysisPromises = succeeded.map(async (img, idx) => {
        try {
          const imgBuffer = await readFile(img.imagePath);
          const mimeType = this.detectImageExt(imgBuffer) === ".jpg" ? "image/jpeg" : "image/png";
          const base64 = imgBuffer.toString("base64");
          img.suggestion = await qwenService.analyzeImageForEcommerce({
            prompt: params.prompt,
            imageBase64: base64,
            mimeType,
          });
          console.log(`[generatePromoImage] VLM analysis done for image ${idx + 1}: ${img.suggestion ? img.suggestion.slice(0, 80) + "..." : "(empty)"}`);
        } catch (e) {
          console.warn(`[generatePromoImage] VLM analysis failed for image ${idx + 1}: ${e instanceof Error ? e.message : "unknown"}`);
          img.suggestion = "";
        }
      });
      await Promise.all(analysisPromises);
    }

    if (abortController.signal.aborted) {
      job.status = "cancelled";
    } else {
      const anySucceeded = job.images.some((img) => img.status === "succeeded");
      job.status = anySucceeded ? "succeeded" : "failed";
    }
    this.notifyCallbacks(job);
  }

  getJobStatus(jobId: string): JobStatus | undefined {
    return this.jobs.get(jobId);
  }

  cancelJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.abortController.abort();
      job.status = "cancelled";
      this.notifyCallbacks(job);
    }
  }

  subscribeToJob(jobId: string, callback: (event: unknown) => void): void {
    const job = this.jobs.get(jobId);
    if (job) {
      job.callbacks.push(callback);
    }
  }

  // === v0.4: Optimized promo generation (steps 2-3) ===
  async generatePromoOptimizedImage(
    jobId: string,
    requestId: string,
    params: {
      productImagePath?: string;
      prompt: string;
      size?: { width: number; height: number };
      referenceImagePath?: string;
    }
  ): Promise<void> {
    await this.generatePromoImage(jobId, requestId, params);
  }

  // === v0.5: Detail pages generation — generate all 4 from scratch ===
  async generateDetailPages(
    jobId: string,
    requestId: string,
    params: {
      productImagePath?: string;
      accumulatedPrompt: string;
      size?: { width: number; height: number };
      referenceImagePath?: string;
    }
  ): Promise<void> {
    const abortController = new AbortController();
    const targetSize = params.size || { width: 1440, height: 2560 };
    const size = this.computeSeedreamSize({ size: targetSize });

    const job: JobStatus = {
      jobId,
      requestId,
      status: "running",
      images: [],
      progress: 0,
      total: 4,
      callbacks: [],
      abortController,
      detailPageImages: [],
      detailProgress: 0,
      detailTotal: 4,
    };
    this.jobs.set(jobId, job);

    const apiKey = securityService.getApiKey();

    // Read both reference images once for all 4 generations
    // 图1 = product image (identity anchor), 图2 = latest promo image (style anchor)
    const { readFile } = await import("fs/promises");
    const refImages: string[] = [];
    const hasProduct = !!params.productImagePath;
    if (hasProduct) {
      try {
        const prodBuffer = await readFile(params.productImagePath!);
        const prodExt = this.detectImageExt(prodBuffer).replace(".", "");
        refImages.push(`data:image/${prodExt};base64,${prodBuffer.toString("base64")}`);
      } catch { /* continue without product ref */ }
    }
    if (params.referenceImagePath) {
      try {
        const refBuffer = await readFile(params.referenceImagePath);
        const refExt = this.detectImageExt(refBuffer).replace(".", "");
        refImages.push(`data:image/${refExt};base64,${refBuffer.toString("base64")}`);
      } catch { /* continue without continuity ref */ }
    }
    const productConstraint = hasProduct ? "保持图1中商品的外观完全一致。" : "";

    const detailTypes: Array<{ key: string; suffix: string }> = [
      { key: "首屏", suffix: "商品主图首屏展示，突出商品主体和品牌调性，精美的电商头图设计" },
      { key: "卖点", suffix: "核心卖点详情页，突出商品的核心优势和差异化特性，配上吸引人的卖点文案" },
      { key: "规格", suffix: "规格参数页，清晰展示商品的技术规格、尺寸、材质等关键参数" },
      { key: "售后", suffix: "售后保障页，展示服务承诺和售后政策，给用户信赖感" },
    ];

    for (const { key, suffix } of detailTypes) {
      if (abortController.signal.aborted) {
        job.detailPageImages!.push({ subType: key, imagePath: "", status: "failed", error: "Cancelled" });
        job.detailProgress!++;
        job.status = "cancelled";
        this.notifyCallbacks(job);
        continue;
      }

      try {
        const rawPrompt = `${params.accumulatedPrompt}。${suffix}。高质量电商详情页设计，专业排版，适合商业推广。与前几张详情页保持风格统一。${productConstraint}`;
        const fullPrompt = await qwenService.optimizeImagePrompt(rawPrompt, `详情页-${key}`);
        const body: Record<string, unknown> = {
          model: "doubao-seedream-4-5-251128",
          prompt: fullPrompt,
          n: 1,
          size,
          temperature: 0.4,
          watermark: true,
        };
        if (refImages.length === 1) {
          body.image = refImages[0];
        } else if (refImages.length > 1) {
          body.image = refImages;
          body.sequential_image_generation = "disabled";
        }

        const response = await fetch(
          "https://ark.cn-beijing.volces.com/api/v3/images/generations",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: abortController.signal,
          }
        );

        if (abortController.signal.aborted) {
          job.detailPageImages!.push({ subType: key, imagePath: "", status: "failed", error: "Cancelled" });
          job.detailProgress!++;
          job.status = "cancelled";
          this.notifyCallbacks(job);
          continue;
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          throw new Error(`Seedream error: ${response.status}${errText ? " - " + errText.slice(0, 200) : ""}`);
        }

        const data = (await response.json()) as { data?: Array<{ url?: string }>; error?: { code?: string; message?: string } };
        if (data.error) throw new Error(`Seedream error: ${data.error.code}`);

        const imageUrl = data.data?.[0]?.url;
        if (!imageUrl) throw new Error("No image URL");

        const root = process.env.AI_POSTER_PROJECT_ROOT || process.cwd();
        const dir = path.join(root, ".ai-poster-creation", "cache");
        await mkdir(dir, { recursive: true });
        const imgResponse = await fetch(imageUrl, { signal: abortController.signal });
        const buffer = Buffer.from(await imgResponse.arrayBuffer());
        const ext = this.detectImageExt(buffer);
        const imagePath = path.join(dir, `detail_${key}_${uuidv4()}${ext}`);
        await writeFile(imagePath, buffer);

        job.detailPageImages!.push({ subType: key, imagePath, status: "succeeded" });
        job.detailProgress!++;
        job.progress++;
        this.notifyCallbacks(job);
      } catch (error) {
        if (!abortController.signal.aborted) {
          job.detailPageImages!.push({
            subType: key, imagePath: "",
            status: "failed",
            error: error instanceof Error ? error.message : "Unknown error",
          });
          job.detailProgress!++;
          job.progress++;
        }
        this.notifyCallbacks(job);
      }
    }

    // Final status
    if (!abortController.signal.aborted) {
      const allDone = job.detailPageImages!.length === 4;
      const anySucceeded = job.detailPageImages!.some((i) => i.status === "succeeded");
      if (allDone) {
        job.status = anySucceeded ? "succeeded" : "failed";
      }
      this.notifyCallbacks(job);
    }
  }

  private notifyCallbacks(job: JobStatus): void {
    for (const cb of job.callbacks) {
      cb({
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        total: job.total,
        images: job.images,
      });
    }
  }
}
