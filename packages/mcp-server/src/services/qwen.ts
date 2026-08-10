import type { CopyContent, PromoCopyContent, PhaseOperations, OptimizationPhase } from "../../../shared/dist/index.js";
import { SecurityService } from "./security.js";

const securityService = new SecurityService();

export class QwenService {
  async generateCopy(params: {
    theme: string;
    scene: string;
    style: string;
  }): Promise<CopyContent> {
    const apiKey = securityService.getApiKey();

    const prompt = `你是一个专业的海报文案生成器。根据以下需求生成一套完整的海报文案：

主题：${params.theme}
场景：${params.scene}
风格：${params.style}

请严格按以下JSON格式返回，不要包含任何其他文字：
{
  "mainTitle": "主标题（4-8个字，醒目有力）",
  "subTitle": "副标题（10-20个字，补充说明）",
  "hookLine": "引流短句（8-15个字，吸引点击）",
  "activityInfo": "活动说明（20-40个字，具体信息）",
  "footerNote": "底部备注（10-20个字，补充说明）"
}`;

    const model = process.env.ARK_TEXT_MODEL || "doubao-seed-2-1-pro-260628";
    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "你是文案生成助手，只返回JSON格式的文案内容。" },
            { role: "user", content: prompt },
          ],
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`ARK API error: ${response.status}${errText ? " - " + errText.slice(0, 200) : ""}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from Qwen");
    }

    // Strip markdown code fences if present
    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n/, "").replace(/\n\s*```\s*$/, "");
    }
    try {
      const parsed = JSON.parse(jsonStr) as CopyContent;
      return {
        mainTitle: parsed.mainTitle || params.theme,
        subTitle: parsed.subTitle || "",
        hookLine: parsed.hookLine || "",
        activityInfo: parsed.activityInfo || "",
        footerNote: parsed.footerNote || "",
      };
    } catch {
      throw new Error("Failed to parse Qwen response as JSON");
    }
  }

  // === v0.3: Promo copy generation ===
  async generatePromoCopy(prompt: string): Promise<PromoCopyContent> {
    const apiKey = securityService.getApiKey();

    const systemPrompt = `你是一个专业的商品宣传文案生成器。根据用户对商品的描述和期望的宣传图风格，生成一套完整的商品宣传文案。

请严格按以下JSON格式返回，不要包含任何其他文字：
{
  "promoTitle": "宣传标题（10字以内，简洁有力）",
  "promoDescription": "宣传描述（50字以内，突出商品卖点和风格）",
  "promoHighlights": ["卖点1", "卖点2", "卖点3", "卖点4"]
}`;

    const model = process.env.ARK_TEXT_MODEL || "doubao-seed-2-1-pro-260628";
    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "你是商品宣传文案助手，只返回JSON格式。" },
            { role: "user", content: systemPrompt + "\n\n商品描述：" + prompt },
          ],
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`ARK API error: ${response.status}${errText ? " - " + errText.slice(0, 200) : ""}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from Qwen");
    }

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n/, "").replace(/\n\s*```\s*$/, "");
    }
    try {
      const parsed = JSON.parse(jsonStr) as PromoCopyContent;
      return {
        promoTitle: parsed.promoTitle || "品质之选",
        promoDescription: parsed.promoDescription || prompt.slice(0, 50),
        promoHighlights: parsed.promoHighlights || [],
      };
    } catch {
      return {
        promoTitle: "品质之选",
        promoDescription: prompt.slice(0, 50),
        promoHighlights: [],
      };
    }
  }

  // === v0.6: Prompt optimization for image models ===
  async optimizeImagePrompt(rawPrompt: string, mode?: string): Promise<string> {
    const apiKey = securityService.getApiKey();
    const context = mode ? `（当前阶段：${mode}）` : "";

    const systemPrompt = `你是一个专业的图像生成提示词优化器。将用户的自然语言描述转化为结构化的视觉描述，使图像生成模型更容易理解。

优化规则：
1. 按以下结构组织描述：主体 → 构图/视角 → 光影/色彩 → 背景/环境 → 整体氛围
2. 使用具体的视觉词汇（如"暖金色顶光""浅景深虚化背景""低角度仰拍"）
3. 保留用户原始的商品描述和关键词，不做概念性改动
4. 不添加用户未提及的商品属性（颜色、材质、品牌等）
5. 输出纯文本，不要JSON或markdown，控制在150字以内
6. 用中文输出`;

    const model = process.env.ARK_TEXT_MODEL || "doubao-seed-2-1-pro-260628";
    try {
      const response = await fetch(
        "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `请优化以下提示词${context}：${rawPrompt}` },
            ],
            max_tokens: 400,
            temperature: 0.8,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.warn(`[optimizeImagePrompt] API error ${response.status}: ${errText.slice(0, 200)}`);
        return rawPrompt;
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = data.choices[0]?.message?.content?.trim();
      return content || rawPrompt;
    } catch (e) {
      console.warn(`[optimizeImagePrompt] failed: ${e instanceof Error ? e.message : "unknown"}`);
      return rawPrompt;
    }
  }

  // === v0.7: VLM image analysis for initial promo generation ===
  async analyzeImageForEcommerce(params: {
    prompt: string;
    imageBase64: string;
    mimeType: string;
  }): Promise<string> {
    const apiKey = securityService.getApiKey();

    const systemPrompt = `你现在是电商静物摄影提示词专家，我会给到用户原始绘图指令、已经生成好的图片。
你需要分析当前画面短板，从下面几个维度给出简短可落地的优化建议：
1.主体占比、画面集中度、电商主图转化适配
2.光影、背景、景深、构图、留白、文案预留位置
3.材质细节、微距清晰度、商品卖点展示
4.新版改良后的正向绘图提示词、负面提示词
建议简洁，贴合产品电商详情图场景，不要长篇废话。`;

    const userContent = `用户原图提示词：${params.prompt}
业务场景：产品电商详情页主图、材质特写、卖点图、氛围感场景图`;

    const model = process.env.ARK_TEXT_MODEL || "doubao-seed-2-1-pro-260628";
    try {
      const response = await fetch(
        "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: [
                  { type: "text", text: userContent },
                  { type: "image_url", image_url: { url: `data:${params.mimeType};base64,${params.imageBase64}` } },
                ],
              },
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.warn(`[analyzeImageForEcommerce] API error ${response.status}: ${errText.slice(0, 200)}`);
        return "";
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      return data.choices[0]?.message?.content?.trim() || "";
    } catch (e) {
      console.warn(`[analyzeImageForEcommerce] failed: ${e instanceof Error ? e.message : "unknown"}`);
      return "";
    }
  }

  // === v0.4: Three-phase optimization suggestions ===
  async generateOptimizationSuggestions(params: {
    originalPrompt: string;
    accumulatedPrompt: string;
    targetPhase: OptimizationPhase;
    phaseHistory?: Array<{
      phase: OptimizationPhase;
      selectedOptions: Record<string, string>;
    }>;
  }): Promise<PhaseOperations> {
    const apiKey = securityService.getApiKey();

    const phaseConfig: Record<OptimizationPhase, {
      name: string;
      goal: string;
      dimensions: string;
      forbiddenDimensions: string;
      exampleOperations: string;
    }> = {
      style: {
        name: "风格定调",
        goal: "确定视觉大方向，从不同维度切入探索",
        dimensions: "场景、氛围、叙事、构图",
        forbiddenDimensions: `禁止输出任何与"排版""标签""文案""促销""信息层级""平台"相关的操作`,
        exampleOperations: `例如：{"id":"op1","label":"场景类型","options":[{"id":"op1-o1","text":"自然户外场景","promptModification":"将背景替换为自然户外场景（场景），阳光草地远处山景"},{"id":"op1-o2","text":"极简棚拍场景","promptModification":"使用纯色背景棚拍风格（场景），减少环境元素突出商品"}]}`,
      },
      structure: {
        name: "结构深化",
        goal: "在选定方向上打磨，细化光影/色彩/构图/细节",
        dimensions: "光影、色彩、构图、细节、氛围",
        forbiddenDimensions: `禁止输出任何与"排版""标签""文案""促销""信息层级""平台"相关的操作`,
        exampleOperations: `例如：{"id":"op1","label":"光影层次","options":[{"id":"op1-o1","text":"增强侧逆光","promptModification":"增强侧逆光勾勒商品轮廓（光影），增加立体感"},{"id":"op1-o2","text":"柔光漫反射","promptModification":"整体柔光处理（光影），减弱阴影对比，营造柔和氛围"}]}`,
      },
      ecommerce: {
        name: "电商落地",
        goal: "转化为可用的商业稿，聚焦信息层级/促销标签/构图适配/平台适配",
        dimensions: "电商、构图（信息层级、促销标签、文案排版、平台适配、构图安全区）",
        forbiddenDimensions: `禁止输出场景/氛围/叙事/光影/色彩/细节/材质/特效维度的操作——这些在前两个阶段已确定，不再改动`,
        exampleOperations: `例如：{"id":"op1","label":"信息层级","options":[{"id":"op1-o1","text":"强化价格焦点","promptModification":"增大价格字体并置于视觉焦点（信息层级），弱化次要描述"},{"id":"op1-o2","text":"均衡信息分布","promptModification":"标题、价格、卖点均匀分布（信息层级），保持清晰阅读动线"}]}`,
      },
    };

    const cfg = phaseConfig[params.targetPhase];

    const systemPrompt = `你是一个电商视觉创意总监。当前处于「${cfg.name}」阶段，核心目标：${cfg.goal}。

=== 本阶段可操作的维度 ===
${cfg.dimensions}

=== 禁止 ===
${cfg.forbiddenDimensions}

=== 输出格式 ===
返回一个 JSON 对象，包含 2-3 个操作（operations），所有操作都将被执行。每个操作有 2-3 个选项（options），用户从每个操作中选一个。操作之间覆盖不同维度，同一操作的选项是互斥的不同方向。

{
  "phase": "${params.targetPhase}",
  "operations": [
    {
      "id": "op1",
      "label": "操作名称（4-6字）",
      "options": [
        {"id": "op1-o1", "text": "更XXX（6-12字方向标签）", "promptModification": "具体要修改的元素，带维度标注"},
        {"id": "op1-o2", "text": "更XXX", "promptModification": "具体要修改的元素，带维度标注"}
      ]
    }
  ]
}

操作设计原则：
- 所有操作都会被执行，用户在每个操作中选择一个 option
- 不同 operations 之间覆盖不同维度，维度差异越大越好
- options 的 text 是面向用户的方向标签（"更XXX"格式），promptModification 是给图像生成模型的修改指令
- promptModification 使用增强/增加/减少/减弱/替换动词，带对应维度名标注
${cfg.exampleOperations}

严格只返回 JSON，不要包含任何其他文字。`;

    // Build phase history summary
    let historySummary = "";
    if (params.phaseHistory && params.phaseHistory.length > 0) {
      historySummary = "\n\n【前序阶段决策】\n";
      for (const h of params.phaseHistory) {
        const phaseName = phaseConfig[h.phase]?.name || h.phase;
        historySummary += `「${phaseName}」阶段：\n`;
        for (const [opId, optId] of Object.entries(h.selectedOptions)) {
          historySummary += `  - 选择了 ${optId}\n`;
        }
      }
    }

    const userMessage = `【重要：以下所有建议必须围绕"${params.originalPrompt}"这个商品展开，不要偏离到其他商品】

当前阶段：「${cfg.name}」——${cfg.goal}
已累积的生成指令：${params.accumulatedPrompt}${historySummary}
请基于以上信息，给出 2-3 个本阶段都要执行的优化操作，每个操作含 2-3 个选项（用户各选一个）。`;

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    const model = process.env.ARK_TEXT_MODEL || "doubao-seed-2-1-pro-260628";
    const temperature = 0.8;

    const fallbacks: Record<OptimizationPhase, PhaseOperations> = {
      style: {
        phase: "style",
        operations: [
          { id: "op1", label: "场景类型", options: [
            { id: "op1-o1", text: "自然户外场景", promptModification: "将背景替换为自然户外场景（场景），阳光草地远山" },
            { id: "op1-o2", text: "极简棚拍风格", promptModification: "使用纯色背景棚拍风格（场景），减少环境元素突出商品" },
          ]},
          { id: "op2", label: "整体氛围", options: [
            { id: "op2-o1", text: "温暖治愈氛围", promptModification: "暖调柔光（氛围），营造温馨治愈的情感基调" },
            { id: "op2-o2", text: "高端冷调质感", promptModification: "冷调金属质感（氛围），营造高端专业品牌感" },
          ]},
          { id: "op3", label: "叙事角度", options: [
            { id: "op3-o1", text: "使用场景叙事", promptModification: "展示商品在实际使用中的状态（叙事），增加人物手持或佩戴" },
            { id: "op3-o2", text: "产品特写叙事", promptModification: "聚焦商品本身细节（叙事），微距特写突出材质与工艺" },
          ]},
        ],
      },
      structure: {
        phase: "structure",
        operations: [
          { id: "op1", label: "构图方式", options: [
            { id: "op1-o1", text: "居中对称构图", promptModification: "商品置于画面中央（构图），上下左右对称布局" },
            { id: "op1-o2", text: "三分线构图", promptModification: "商品置于画面三分之一处（构图），留白区域增加文字空间" },
          ]},
          { id: "op2", label: "光影层次", options: [
            { id: "op2-o1", text: "侧光立体感", promptModification: "增强侧光照明（光影），强化商品立体感和材质纹理" },
            { id: "op2-o2", text: "均匀柔光", promptModification: "柔化整体光线（光影），减少阴影让画面更干净统一" },
          ]},
          { id: "op3", label: "元素丰富度", options: [
            { id: "op3-o1", text: "增加装饰元素", promptModification: "增加与商品相关的装饰元素（丰富度），如光效粒子飘浮物" },
            { id: "op3-o2", text: "保持简洁留白", promptModification: "减少非必要元素（丰富度），扩大留白面积让画面更干净" },
          ]},
        ],
      },
      ecommerce: {
        phase: "ecommerce",
        operations: [
          { id: "op1", label: "文案区域", options: [
            { id: "op1-o1", text: "顶部标题区", promptModification: "在画面上方增加半透明标题栏区域（文案），预留大号促销文字空间" },
            { id: "op1-o2", text: "底部信息区", promptModification: "在画面下方增加信息栏区域（文案），预留价格和卖点标签空间" },
          ]},
          { id: "op2", label: "促销元素", options: [
            { id: "op2-o1", text: "增加促销标签", promptModification: "增加促销标签设计元素（促销），如角标徽章价格贴纸" },
            { id: "op2-o2", text: "保持克制高级", promptModification: "只保留最小促销标识（促销），避免喧宾夺主保持高级感" },
          ]},
          { id: "op3", label: "色彩强化", options: [
            { id: "op3-o1", text: "高饱和吸睛", promptModification: "提高整体色彩饱和度（色彩），更鲜艳跳跃适合促销活动" },
            { id: "op3-o2", text: "品牌色调统一", promptModification: "统一画面色调（色彩），使用协调的品牌色系提升专业感" },
          ]},
        ],
      },
    };

    try {
      const response = await fetch(
        "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 2000,
            temperature,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(`ARK API error: ${response.status}${errText ? " - " + errText.slice(0, 200) : ""}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = data.choices[0]?.message?.content;
      if (!content) throw new Error("Empty response for suggestions");

      let jsonStr = content.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n/, "").replace(/\n\s*```\s*$/, "");
      }
      const parsed = JSON.parse(jsonStr) as PhaseOperations;
      if (!parsed.operations?.length) throw new Error("No operations in response");
      return {
        phase: params.targetPhase,
        operations: parsed.operations.slice(0, 3).map((op, i) => ({
          id: op.id || `op${i + 1}`,
          label: op.label,
          options: (op.options || []).slice(0, 3).map((opt, j) => ({
            id: opt.id || `${op.id || `op${i + 1}`}-o${j + 1}`,
            text: opt.text,
            promptModification: opt.promptModification,
          })),
        })),
      };
    } catch {
      return fallbacks[params.targetPhase];
    }
  }
}
