export interface PosterSize {
  width: number;
  height: number;
}

export interface ReferenceImage {
  imageId: string;
  originalName: string;
  storedPath: string;
  mode: "composition" | "color";
}

export interface CopyContent {
  mainTitle: string;
  subTitle: string;
  hookLine: string;
  activityInfo: string;
  footerNote: string;
}

export interface TextElement {
  id: string;
  fieldKey: keyof CopyContent;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight?: string;
  color: string;
  textAlign: "left" | "center" | "right";
  lineHeight?: number;
}

export interface GeneratedImage {
  layoutId: string;
  imagePath: string;
  status: "generating" | "succeeded" | "failed";
  error?: string;
}

export interface ProjectState {
  schemaVersion: number;
  projectId: string;
  version: number;
  title: string;
  input: {
    theme: string;
    scene: string;
    style: string;
    size: PosterSize;
  };
  referenceImage?: ReferenceImage;
  copy?: CopyContent;
  selectedLayout?: string;
  generatedImages: GeneratedImage[];
  textElements: TextElement[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateCopyRequest {
  requestId: string;
  operation: "generate_poster";
  projectId: string;
  projectVersion: number;
  userIntent: string;
  params: {
    theme: string;
    scene: string;
    style: string;
    size: PosterSize;
    referenceImage?: {
      path: string;
      mode: "composition" | "color";
    };
  };
  createdAt: string;
}

export interface GenerateCopyResult {
  requestId: string;
  basedOnProjectVersion: number;
  status: "succeeded" | "partial" | "failed" | "cancelled";
  copy?: CopyContent;
  images?: Array<{
    layoutId: string;
    imagePath: string;
    status: "succeeded" | "failed";
    error?: string;
  }>;
  warnings: string[];
  createdAt: string;
}

export type CopyFieldKey = keyof CopyContent;

// === v0.3 新增类型 ===

/** 全局应用阶段：仪表盘 / 海报 / 宣传图 */
export type AppPhase = "dashboard" | "poster" | "promo";

/** 宣传图制作子阶段 */
export type PromoPhase = "input" | "generating" | "optimizing" | "detail" | "result" | "error";

/** 宣传图文案内容 */
export interface PromoCopyContent {
  promoTitle: string;
  promoDescription: string;
  promoHighlights: string[];
}

/** 宣传图项目状态 */
export interface PromoProject {
  schemaVersion: number;
  promoId: string;
  type: "promo";
  title: string;
  productImagePath: string;
  prompt: string;
  promoPhase: PromoPhase;
  promoImage?: {
    imagePath: string;
    width: number;
    height: number;
  };
  promoCopy?: PromoCopyContent;
  optimization?: OptimizationState;
  projectVersion: number;
  createdAt: string;
  updatedAt: string;
}

/** 仪表盘作品摘要（从项目文件汇总） */
export interface DashboardItem {
  id: string;
  type: "poster" | "promo";
  title: string;
  thumbnailPath?: string;
  createdAt: string;
  updatedAt: string;
}

// === v0.4 优化流程类型（三阶段） ===

export type OptimizationPhase = "style" | "structure" | "ecommerce";

export interface OptimizationOption {
  id: string;              // e.g. "op1-o1"
  text: string;            // "更XXX" display label
  promptModification: string;
}

export interface OptimizationOperation {
  id: string;              // e.g. "op1"
  label: string;           // e.g. "场景类型"
  options: OptimizationOption[];
}

/** LLM 返回的阶段操作建议 */
export interface PhaseOperations {
  phase: OptimizationPhase;
  operations: OptimizationOperation[];
}

export interface OptimizationSuggestion {
  id: string;
  text: string;
  promptModification: string;
}

export interface StepImage {
  step: number;
  imagePath: string;
  prompt: string;
}

export interface DetailPageImage {
  subType: "首屏" | "卖点" | "规格" | "售后";
  imagePath: string;
  status?: "pending" | "running" | "succeeded" | "failed";
  error?: string;
}

/** 初始候选图（无商品图模式下的 Step 1 批量生成结果） */
export interface InitialCandidate {
  imagePath: string;
  status: "succeeded" | "failed";
  error?: string;
  /** VLM 图片分析 + 优化建议（初始生成后自动产出） */
  suggestion?: string;
}

export interface OptimizationState {
  currentStep: number;           // 1=初始, 2=风格定调后, 3=结构深化后, 4=电商落地后
  currentPhase: OptimizationPhase | null;  // null=初始生成后还未进入阶段
  stepImages: StepImage[];
  phaseOperations: PhaseOperations | null; // 当前阶段的操作建议
  selectedOptions: Record<string, string>; // operationId -> optionId
  accumulatedPrompt: string;
  detailPageImages: DetailPageImage[];
  // 历史记录（用于导航回退和保存）
  phaseHistory: Array<{
    step: number;
    phase: OptimizationPhase;
    operations: OptimizationOperation[];
    selectedOptions: Record<string, string>;
  }>;
  // 无商品图模式下初始生成的候选图
  initialCandidates?: InitialCandidate[];
}

/** 宣传图生成结果（映射 promo-result.schema.json） */
export interface PromoResult {
  requestId: string;
  basedOnProjectVersion: number;
  status: "succeeded" | "failed";
  promoImage?: {
    imagePath: string;
    width: number;
    height: number;
  };
  promoCopy?: PromoCopyContent;
  warnings?: string[];
  createdAt: string;
}
