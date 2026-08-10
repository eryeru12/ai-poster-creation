import { useState, useCallback, useRef } from "react";
import type {
  PromoPhase,
  PromoCopyContent,
  PhaseOperations,
  OptimizationOperation,
  OptimizationPhase,
  StepImage,
  DetailPageImage,
} from "@ai-poster/shared";

interface PromoImage {
  imagePath: string;
  width: number;
  height: number;
  suggestion?: string;
}

interface PromoJobStatus {
  jobId: string;
  status: string;
  progress: number;
  total?: number;
}

export interface PromoGenerationState {
  promoId: string;
  promoPhase: PromoPhase;
  productImage: File | null;
  productImagePreview: string;
  promoPrompt: string;
  promoImage: PromoImage | null;
  promoCopy: PromoCopyContent | null;
  promoJobStatus: PromoJobStatus | null;
  productImagePath: string;
  error: string | null;
  currentStep: number;
  stepImages: StepImage[];
  phaseOperations: PhaseOperations | null;
  selectedOptions: Record<string, string>;
  accumulatedPrompt: string;
  detailPageImages: DetailPageImage[];
}

const PHASE_SEQUENCE: OptimizationPhase[] = ["style", "structure", "ecommerce"];

function getPhaseForStep(step: number): OptimizationPhase | null {
  if (step < 1 || step > 3) return null;
  return PHASE_SEQUENCE[step - 1];
}

export function usePromoGeneration() {
  const [promoId, setPromoId] = useState<string>("");
  const [promoPhase, setPromoPhase] = useState<PromoPhase>("input");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState("");
  const [promoPrompt, setPromoPrompt] = useState("");
  const [promoImage, setPromoImage] = useState<PromoImage | null>(null);
  const [promoCopy, setPromoCopy] = useState<PromoCopyContent | null>(null);
  const [promoJobStatus, setPromoJobStatus] = useState<PromoJobStatus | null>(null);
  const [productImagePath, setProductImagePath] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [stepImages, setStepImages] = useState<StepImage[]>([]);
  const [phaseOperations, setPhaseOperations] = useState<PhaseOperations | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [accumulatedPrompt, setAccumulatedPrompt] = useState("");
  const [detailPageImages, setDetailPageImages] = useState<DetailPageImage[]>([]);
  const [phaseHistory, setPhaseHistory] = useState<
    Array<{ step: number; phase: OptimizationPhase; operations: OptimizationOperation[]; selectedOptions: Record<string, string> }>
  >([]);
  const [initialCandidates, setInitialCandidates] = useState<
    Array<{ imagePath: string; status: string; suggestion?: string }>
  >([]);
  const [userSupplement, setUserSupplement] = useState("");

  const promoJobTypeRef = useRef<"initial" | "optimize" | "detail">("initial");
  const hasProductImageRef = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const initNewPromo = useCallback(() => {
    const id = `promo-${Date.now()}`;
    setPromoId(id);
    setPromoPhase("input");
    setProductImage(null);
    setProductImagePreview("");
    setPromoPrompt("");
    setPromoImage(null);
    setPromoCopy(null);
    setPromoJobStatus(null);
    setProductImagePath("");
    setError(null);
    setCurrentStep(0);
    setStepImages([]);
    setPhaseOperations(null);
    setSelectedOptions({});
    setAccumulatedPrompt("");
    setDetailPageImages([]);
    setPhaseHistory([]);
    setUserSupplement("");
    setInitialCandidates([]);
    clearPolling();
    return id;
  }, [clearPolling]);

  const restorePromo = useCallback((state: {
    promoId: string;
    productImagePath?: string;
    promoPrompt?: string;
    promoImage?: PromoImage | null;
    promoCopy?: PromoCopyContent | null;
    promoPhase?: PromoPhase;
    optimization?: {
      currentStep: number;
      stepImages: StepImage[];
      phaseOperations: PhaseOperations | null;
      selectedOptions: Record<string, string>;
      accumulatedPrompt: string;
      detailPageImages: DetailPageImage[];
      phaseHistory: Array<{ step: number; phase: OptimizationPhase; operations: OptimizationOperation[]; selectedOptions: Record<string, string> }>;
      initialCandidates?: Array<{ imagePath: string; status: string; suggestion?: string }>;
    };
  }) => {
    setPromoId(state.promoId);
    setProductImagePreview(state.productImagePath
      ? `/api/download?path=${encodeURIComponent(state.productImagePath)}`
      : "");
    setProductImagePath(state.productImagePath || "");
    setPromoPrompt(state.promoPrompt || "");
    setPromoImage(state.promoImage || null);
    setPromoCopy(state.promoCopy || null);
    setPromoPhase(state.promoPhase || "result");
    if (state.optimization) {
      setCurrentStep(state.optimization.currentStep);
      setStepImages(state.optimization.stepImages);
      setPhaseOperations(state.optimization.phaseOperations || null);
      setSelectedOptions(state.optimization.selectedOptions || {});
      setAccumulatedPrompt(state.optimization.accumulatedPrompt);
      setDetailPageImages(state.optimization.detailPageImages);
      setPhaseHistory(state.optimization.phaseHistory || []);
      if (state.optimization.initialCandidates) {
        setInitialCandidates(state.optimization.initialCandidates);
      }
    }
  }, []);

  const handlePromoImageUpload = useCallback(async (file: File) => {
    setProductImage(file);
    setProductImagePreview(URL.createObjectURL(file));
    try {
      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (res.ok) {
        const { imagePath } = await res.json();
        setProductImagePath(imagePath);
      }
    } catch { /* preview still works; upload will retry on generate */ }
  }, []);

  const handlePromoPromptChange = useCallback((text: string) => {
    setPromoPrompt(text);
  }, []);

  // Fetch phase operations from LLM
  const fetchPhaseOperations = useCallback(async (
    targetPhase: OptimizationPhase,
    originalPrompt: string,
    accPrompt: string,
    history?: Array<{ phase: OptimizationPhase; selectedOptions: Record<string, string> }>,
  ) => {
    try {
      const body: Record<string, unknown> = {
        originalPrompt,
        accumulatedPrompt: accPrompt,
        targetPhase,
      };
      if (history && history.length > 0) body.phaseHistory = history;
      const res = await fetch("/api/generate/promo/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        const ops = data.phaseOperations as PhaseOperations;
        setPhaseOperations(ops);
        setSelectedOptions({});
      }
    } catch { /* keep defaults */ }
  }, []);

  const pollPromoJobStatus = useCallback((jobId: string, onDone?: () => void) => {
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/job/${jobId}/status`);
        const data = await res.json();
        setPromoJobStatus({ jobId, status: data.status, progress: data.progress || 0 });

        if (data.detailPageImages?.length) {
          setDetailPageImages(data.detailPageImages);
        }

        if (data.status === "succeeded") {
          clearPolling();

          const jobType = promoJobTypeRef.current;

          if (jobType === "detail") {
            setDetailPageImages(data.detailPageImages || []);
            setPromoPhase("detail");
            onDone?.();
            return;
          }

          const newPromoImage: PromoImage | undefined = data.promoImage;
          const newPromoCopy: PromoCopyContent | undefined = data.promoCopy;

          if (newPromoImage) setPromoImage(newPromoImage);
          if (newPromoCopy) setPromoCopy(newPromoCopy);

          if (jobType === "initial") {
            // Check for multi-candidate mode (no product image, n=4 text-to-image)
            if (data.initialCandidates && data.initialCandidates.length > 1 && !hasProductImageRef.current) {
              setInitialCandidates(data.initialCandidates);
              setCurrentStep(1);
              const accPrompt = accumulatedPrompt || promoPrompt;
              setAccumulatedPrompt(accPrompt);
              setPromoPhase("optimizing"); // shows selection grid
              onDone?.();
              return;
            }

            const step1: StepImage = {
              step: 1,
              imagePath: newPromoImage?.imagePath || "",
              prompt: accumulatedPrompt || promoPrompt,
            };
            setStepImages([step1]);
            setCurrentStep(1);
            const accPrompt = accumulatedPrompt || promoPrompt;
            setAccumulatedPrompt(accPrompt);
            setPromoPhase("optimizing"); // transition immediately, right panel shows loading

            // Fetch phase 1 (style) operations
            await fetchPhaseOperations("style", promoPrompt, accPrompt);
          } else if (jobType === "optimize") {
            const nextStep = currentStep + 1;
            const newStep: StepImage = {
              step: nextStep,
              imagePath: newPromoImage?.imagePath || "",
              prompt: accumulatedPrompt,
            };
            setStepImages((prev) => [...prev, newStep]);
            setCurrentStep(nextStep);
            setPromoPhase("optimizing"); // transition immediately, right panel shows loading

            // Fetch operations for next phase (if not at last phase)
            const nextPhase = getPhaseForStep(nextStep);
            if (nextPhase) {
              // Build phase history from previous phases
              const history: Array<{ phase: OptimizationPhase; selectedOptions: Record<string, string> }> = [];
              for (let s = 1; s < nextStep; s++) {
                const ph = getPhaseForStep(s);
                const phEntry = phaseHistory.find((h) => h.step === s);
                if (ph && phEntry) {
                  history.push({ phase: ph, selectedOptions: phEntry.selectedOptions });
                }
              }
              await fetchPhaseOperations(nextPhase, promoPrompt, accumulatedPrompt, history);
            } else {
              setPhaseOperations(null);
            }
          }

          onDone?.();
        } else if (data.status === "failed" || data.status === "cancelled") {
          clearPolling();
          if (data.status === "failed") {
            setPromoPhase("error");
            setError(data.error || "Generation failed");
          }
          onDone?.();
        }
      } catch {
        clearPolling();
        setPromoPhase("error");
        setError("Lost connection to generation job");
        onDone?.();
      }
    }, 1000);
  }, [accumulatedPrompt, promoPrompt, currentStep, phaseHistory, clearPolling, fetchPhaseOperations]);

  const handlePromoGenerate = useCallback(async () => {
    if (!promoPrompt) return;
    setCurrentStep(0);
    setInitialCandidates([]);
    setPromoPhase("generating");
    setError(null);
    promoJobTypeRef.current = "initial";
    hasProductImageRef.current = !!productImagePath;
    try {
      const body: Record<string, unknown> = {
        requestId: `req-${Date.now()}`,
        prompt: promoPrompt,
        promoId,
      };
      if (productImagePath) body.productImagePath = productImagePath;
      const res = await fetch("/api/generate/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to start promo generation");
      const { jobId } = await res.json();
      setPromoJobStatus({ jobId, status: "running", progress: 0 });
      pollPromoJobStatus(jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Promo generation failed");
      setPromoPhase("error");
    }
  }, [promoPrompt, promoId, productImagePath, pollPromoJobStatus]);

  const handleSelectOption = useCallback((operationId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [operationId]: optionId }));
  }, []);

  const handleConfirmOptimize = useCallback(async () => {
    if (!phaseOperations) return;
    const allSelected = phaseOperations.operations.every((op) => selectedOptions[op.id]);
    if (!allSelected) return;

    const currentPhase = getPhaseForStep(currentStep);
    if (!currentPhase) return;

    // Save current phase decisions to history
    setPhaseHistory((prev) => [
      ...prev.filter((h) => h.step !== currentStep),
      { step: currentStep, phase: currentPhase, operations: phaseOperations.operations, selectedOptions: { ...selectedOptions } },
    ]);

    // Build combined prompt from selected options
    const selectedMods: string[] = [];
    for (const op of phaseOperations.operations) {
      const selectedOptId = selectedOptions[op.id];
      if (selectedOptId) {
        const opt = op.options.find((o) => o.id === selectedOptId);
        if (opt) selectedMods.push(opt.promptModification);
      }
    }

    let combinedPrompt = accumulatedPrompt;
    if (selectedMods.length > 0) {
      combinedPrompt += `。优化方向：${selectedMods.join("。")}`;
    }
    if (userSupplement.trim()) {
      combinedPrompt += `。补充要求：${userSupplement.trim()}`;
    }

    // Trim future steps and stale detail pages if branching from an earlier step
    setStepImages((prev) => prev.filter((s) => s.step <= currentStep));
    setDetailPageImages([]);
    setAccumulatedPrompt(combinedPrompt);
    setPhaseOperations(null);
    setSelectedOptions({});
    setUserSupplement("");

    const nextStep = currentStep + 1;
    promoJobTypeRef.current = "optimize";
    setPromoPhase("generating");
    setError(null);

    try {
      const currentStepImage = stepImages.find((s) => s.step === currentStep);
      const body: Record<string, unknown> = {
        requestId: `req-${Date.now()}`,
        promoId,
        productImagePath,
        accumulatedPrompt: combinedPrompt,
        optimizationStep: nextStep,
      };
      if (currentStepImage?.imagePath) {
        body.referenceImagePath = currentStepImage.imagePath;
      }
      const res = await fetch("/api/generate/promo/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to start optimization");
      const { jobId } = await res.json();
      setPromoJobStatus({ jobId, status: "running", progress: 0 });
      pollPromoJobStatus(jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Optimization failed");
      setPromoPhase("error");
    }
  }, [phaseOperations, selectedOptions, accumulatedPrompt, currentStep, promoId, productImagePath, stepImages, pollPromoJobStatus, userSupplement]);

  const handleSelectInitialImage = useCallback(async (imagePath: string) => {
    const accPrompt = accumulatedPrompt || promoPrompt;
    const step1: StepImage = {
      step: 1,
      imagePath,
      prompt: accPrompt,
    };
    setStepImages([step1]);
    setPromoImage({ imagePath, width: 1440, height: 2560 });
    setInitialCandidates([]);
    setSelectedOptions({});

    // Fetch phase 1 (style) operations
    await fetchPhaseOperations("style", promoPrompt, accPrompt);
    // stays in "optimizing" phase — center panel shows single image + options
  }, [accumulatedPrompt, promoPrompt, fetchPhaseOperations]);

  const handleDetailPagesGenerate = useCallback(async (accPrompt?: string) => {
    const prompt = accPrompt || accumulatedPrompt;
    promoJobTypeRef.current = "detail";
    setPromoPhase("generating");
    setError(null);

    try {
      const latestImage = stepImages.length > 0
        ? stepImages.reduce((a, b) => a.step > b.step ? a : b)
        : null;
      const body: Record<string, unknown> = {
        requestId: `req-${Date.now()}`,
        promoId,
        productImagePath,
        accumulatedPrompt: prompt,
      };
      if (latestImage?.imagePath) {
        body.referenceImagePath = latestImage.imagePath;
      }
      const res = await fetch("/api/generate/promo/detail-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to start detail pages generation");
      const { jobId } = await res.json();
      setPromoJobStatus({ jobId, status: "running", progress: 0, total: 4 });
      pollPromoJobStatus(jobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Detail pages generation failed");
      setPromoPhase("error");
    }
  }, [accumulatedPrompt, promoId, productImagePath, stepImages, pollPromoJobStatus]);

  const handlePromoCancel = useCallback(async () => {
    if (promoJobStatus?.jobId) {
      try {
        await fetch(`/api/job/${promoJobStatus.jobId}/cancel`, { method: "POST" });
      } catch { /* best effort */ }
    }
    clearPolling();
    setPromoPhase("input");
    setPromoJobStatus(null);
  }, [promoJobStatus, clearPolling]);

  const handlePromoRegenerate = useCallback(() => {
    clearPolling();
    setPromoPhase("input");
    setPromoImage(null);
    setPromoCopy(null);
    setPromoJobStatus(null);
    setCurrentStep(0);
    setStepImages([]);
    setPhaseOperations(null);
    setSelectedOptions({});
    setAccumulatedPrompt("");
    setDetailPageImages([]);
    setPhaseHistory([]);
    setUserSupplement("");
    setInitialCandidates([]);
  }, [clearPolling]);

  const handleGoToStep = useCallback(async (targetStep: number) => {
    clearPolling();
    const targetImage = stepImages.find((s) => s.step === targetStep);
    if (!targetImage) return;

    setCurrentStep(targetStep);
    setAccumulatedPrompt(targetImage.prompt);
    setPromoImage({ imagePath: targetImage.imagePath, width: 1440, height: 2560 });
    setPromoJobStatus(null);
    setError(null);

    // Restore phase history for this step
    const phEntry = phaseHistory.find((h) => h.step === targetStep);
    if (phEntry) {
      setPhaseOperations({ phase: phEntry.phase, operations: phEntry.operations });
      setSelectedOptions(phEntry.selectedOptions);
    } else {
      setPhaseOperations(null);
      setSelectedOptions({});
    }
    setPromoPhase("optimizing");
  }, [stepImages, clearPolling, phaseHistory]);

  const handleGoToDetail = useCallback(() => {
    if (detailPageImages.length > 0) {
      clearPolling();
      setPromoJobStatus(null);
      setError(null);
      setPromoPhase("detail");
    } else {
      handleDetailPagesGenerate();
    }
  }, [detailPageImages, clearPolling, handleDetailPagesGenerate]);

  const handlePromoExport = useCallback(async (format: "png" | "jpg") => {
    if (!promoId || !promoImage) return;
    setError(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: promoId, posterId: promoId, format, imagePath: promoImage.imagePath }),
      });
      if (!res.ok) throw new Error("Export failed");
      const { filePath } = await res.json();
      const a = document.createElement("a");
      a.href = `/api/download?path=${encodeURIComponent(filePath)}`;
      a.download = `promo.${format}`;
      a.click();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  }, [promoId, promoImage]);

  const handleSavePromo = useCallback(async (phaseOverride?: PromoPhase) => {
    if (!promoId) return;
    const phase = phaseOverride ?? promoPhase;
    try {
      await fetch(`/api/promo/${promoId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoId,
          type: "promo",
          title: promoPrompt.slice(0, 50) || "Untitled Promo",
          productImagePath,
          prompt: promoPrompt,
          phase,
          promoImage,
          promoCopy,
          optimization: {
            currentStep,
            stepImages,
            phaseOperations,
            selectedOptions,
            accumulatedPrompt,
            detailPageImages,
            phaseHistory,
            ...(initialCandidates.length > 0 ? { initialCandidates } : {}),
          },
        }),
      });
    } catch { /* silent fail */ }
  }, [promoId, promoPrompt, productImagePath, promoPhase, promoImage, promoCopy,
      currentStep, stepImages, phaseOperations, selectedOptions, accumulatedPrompt, detailPageImages, phaseHistory, initialCandidates]);

  return {
    promoId,
    promoPhase,
    productImage,
    productImagePreview,
    promoPrompt,
    promoImage,
    promoCopy,
    promoJobStatus,
    productImagePath,
    error,
    currentStep,
    stepImages,
    phaseOperations,
    selectedOptions,
    accumulatedPrompt,
    detailPageImages,
    phaseHistory,
    setError,
    setPromoPhase,
    setSelectedOptions,
    handleSelectOption,
    initNewPromo,
    restorePromo,
    handlePromoImageUpload,
    handlePromoPromptChange,
    handlePromoGenerate,
    handleConfirmOptimize,
    handleDetailPagesGenerate,
    handleGoToDetail,
    handlePromoCancel,
    handlePromoRegenerate,
    handlePromoExport,
    handleSavePromo,
    handleGoToStep,
    userSupplement,
    setUserSupplement,
    initialCandidates,
    handleSelectInitialImage,
  };
}
