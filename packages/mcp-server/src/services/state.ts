import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { ProjectState, PromoProject, DashboardItem } from "../../../shared/dist/index.js";

export class StateService {
  private getStateDir(projectId: string): string {
    // Use AI_POSTER_PROJECT_ROOT env var if set, otherwise cwd
    const root = process.env.AI_POSTER_PROJECT_ROOT || process.cwd();
    return path.join(root, ".ai-poster-creation");
  }

  private getStateFile(projectId: string): string {
    return path.join(this.getStateDir(projectId), "project.json");
  }

  async loadProject(projectId: string): Promise<ProjectState | null> {
    const file = this.getStateFile(projectId);
    if (!existsSync(file)) {
      return null;
    }
    const content = await readFile(file, "utf-8");
    return JSON.parse(content);
  }

  async saveProject(
    projectId: string,
    data: Partial<ProjectState>
  ): Promise<ProjectState> {
    const dir = this.getStateDir(projectId);
    await mkdir(dir, { recursive: true });

    const existing = await this.loadProject(projectId);
    const now = new Date().toISOString();

    const state: ProjectState = {
      schemaVersion: 1,
      projectId,
      version: (existing?.version || 0) + 1,
      title: data.title || existing?.title || "Untitled Poster",
      input: data.input || existing?.input || {
        theme: "",
        scene: "",
        style: "",
        size: { width: 1080, height: 1920 },
      },
      referenceImage: data.referenceImage || existing?.referenceImage,
      copy: data.copy || existing?.copy,
      selectedLayout: data.selectedLayout || existing?.selectedLayout,
      generatedImages: data.generatedImages || existing?.generatedImages || [],
      textElements: data.textElements || existing?.textElements || [],
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    // Atomic write: write to tmp then rename
    const file = this.getStateFile(projectId);
    const tmpFile = `${file}.${Date.now()}.tmp`;
    try {
      await writeFile(tmpFile, JSON.stringify(state, null, 2), "utf-8");
      const fs = await import("fs/promises");
      await fs.rename(tmpFile, file);
    } catch {
      await writeFile(file, JSON.stringify(state, null, 2), "utf-8");
    }

    return state;
  }

  async exportPoster(
    projectId: string,
    posterId: string,
    format: "png" | "jpg",
    quality?: number,
    imageData?: string, // base64 data URL from UI canvas
    imagePath?: string,  // direct file path for promo export
  ): Promise<{ filePath: string; fileSize: number }> {
    const dir = path.join(this.getStateDir(projectId), "exports");
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${posterId}-${Date.now()}.${format}`);

    if (imageData) {
      // Strip data URL prefix and decode base64
      const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      await writeFile(filePath, buffer);
      return { filePath, fileSize: buffer.length };
    }

    if (imagePath) {
      // Copy existing image file for promo export
      const buffer = await readFile(imagePath);
      await writeFile(filePath, buffer);
      return { filePath, fileSize: buffer.length };
    }

    return { filePath, fileSize: 0 };
  }

  async listProjects(): Promise<ProjectState[]> {
    const baseDir = this.getStateDir("");
    if (!existsSync(baseDir)) return [];
    const entries = await readdir(baseDir, { withFileTypes: true });
    const projects: ProjectState[] = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const state = await this.loadProject(entry.name);
        if (state) projects.push(state);
      }
    }
    return projects.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // === v0.3: Promo project state ===

  private getPromoStateFile(promoId: string): string {
    const dir = this.getStateDir("");
    return path.join(dir, `${promoId}.json`);
  }

  async loadPromoProject(promoId: string): Promise<PromoProject | null> {
    const file = this.getPromoStateFile(promoId);
    if (!existsSync(file)) return null;
    const content = await readFile(file, "utf-8");
    return JSON.parse(content);
  }

  async savePromoProject(
    promoId: string,
    data: Partial<PromoProject>
  ): Promise<PromoProject> {
    const dir = this.getStateDir("");
    await mkdir(dir, { recursive: true });

    const existing = await this.loadPromoProject(promoId);
    const now = new Date().toISOString();

    const state: PromoProject = {
      schemaVersion: 1,
      promoId,
      type: "promo",
      title: data.title || existing?.title || "Untitled Promo",
      productImagePath: data.productImagePath || existing?.productImagePath || "",
      prompt: data.prompt || existing?.prompt || "",
      promoPhase: data.promoPhase || existing?.promoPhase || "input",
      promoImage: data.promoImage ?? existing?.promoImage,
      promoCopy: data.promoCopy ?? existing?.promoCopy,
      optimization: data.optimization ?? existing?.optimization,
      projectVersion: (existing?.projectVersion || 0) + 1,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    const file = this.getPromoStateFile(promoId);
    const tmpFile = `${file}.${Date.now()}.tmp`;
    try {
      await writeFile(tmpFile, JSON.stringify(state, null, 2), "utf-8");
      const fs = await import("fs/promises");
      await fs.rename(tmpFile, file);
    } catch {
      await writeFile(file, JSON.stringify(state, null, 2), "utf-8");
    }

    return state;
  }

  // === v0.3: List all projects (poster + promo) for dashboard ===

  async listAllProjects(): Promise<DashboardItem[]> {
    const dir = this.getStateDir("");
    if (!existsSync(dir)) return [];

    const entries = await readdir(dir, { withFileTypes: true });
    const items: DashboardItem[] = [];

    for (const entry of entries) {
      if (entry.isFile() && entry.name === "project.json") {
        // Legacy poster project in root of state dir — skip, old format
        continue;
      }
      if (entry.isFile() && entry.name.startsWith("promo-") && entry.name.endsWith(".json")) {
        try {
          const content = await readFile(path.join(dir, entry.name), "utf-8");
          const promo: PromoProject = JSON.parse(content);
          items.push({
            id: promo.promoId,
            type: "promo",
            title: promo.title || "Untitled Promo",
            thumbnailPath: promo.promoImage?.imagePath,
            createdAt: promo.createdAt,
            updatedAt: promo.updatedAt,
          });
        } catch { /* skip corrupt files */ }
      }
    }

    // Also scan subdirectories for poster projects
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectFile = path.join(dir, entry.name, "project.json");
        if (existsSync(projectFile)) {
          try {
            const content = await readFile(projectFile, "utf-8");
            const project: ProjectState = JSON.parse(content);
            const thumbnail = project.generatedImages?.find(
              (i) => i.layoutId === project.selectedLayout && i.status === "succeeded"
            );
            items.push({
              id: project.projectId,
              type: "poster",
              title: project.title || "Untitled Poster",
              thumbnailPath: thumbnail?.imagePath,
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
            });
          } catch { /* skip corrupt files */ }
        }
      }
    }

    return items.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
}
