export interface ConstraintZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutDefinition {
  layoutId: string;
  name: string;
  description: string;
  constraintZones: {
    mainTitle: ConstraintZone;
    subTitle: ConstraintZone;
    hookLine: ConstraintZone;
    activityInfo: ConstraintZone;
    footerNote: ConstraintZone;
  };
}

export const LAYOUTS: LayoutDefinition[] = [
  {
    layoutId: "top_center",
    name: "上下居中",
    description: "顶部主标题、中间主视觉素材、底部副标题/活动信息，结构规整对称",
    constraintZones: {
      mainTitle: { x: 0.05, y: 0.05, width: 0.9, height: 0.2 },
      subTitle: { x: 0.1, y: 0.25, width: 0.8, height: 0.1 },
      hookLine: { x: 0.1, y: 0.7, width: 0.8, height: 0.08 },
      activityInfo: { x: 0.1, y: 0.8, width: 0.8, height: 0.08 },
      footerNote: { x: 0.1, y: 0.9, width: 0.8, height: 0.06 },
    },
  },
  {
    layoutId: "left_right_split",
    name: "左右分栏",
    description: "左侧文字信息、右侧产品/视觉配图，层次清晰",
    constraintZones: {
      mainTitle: { x: 0.05, y: 0.1, width: 0.4, height: 0.2 },
      subTitle: { x: 0.05, y: 0.35, width: 0.4, height: 0.1 },
      hookLine: { x: 0.05, y: 0.5, width: 0.4, height: 0.1 },
      activityInfo: { x: 0.05, y: 0.65, width: 0.4, height: 0.1 },
      footerNote: { x: 0.05, y: 0.85, width: 0.4, height: 0.08 },
    },
  },
  {
    layoutId: "left_text_right_image",
    name: "左文右图错落",
    description: "非对称错落构图，视觉灵动高级",
    constraintZones: {
      mainTitle: { x: 0.05, y: 0.08, width: 0.45, height: 0.18 },
      subTitle: { x: 0.05, y: 0.3, width: 0.4, height: 0.1 },
      hookLine: { x: 0.5, y: 0.6, width: 0.45, height: 0.1 },
      activityInfo: { x: 0.05, y: 0.75, width: 0.5, height: 0.1 },
      footerNote: { x: 0.05, y: 0.88, width: 0.9, height: 0.06 },
    },
  },
  {
    layoutId: "minimal_whitespace",
    name: "全屏留白极简",
    description: "大面积留白+核心文字与主视觉聚焦，质感高级",
    constraintZones: {
      mainTitle: { x: 0.15, y: 0.2, width: 0.7, height: 0.2 },
      subTitle: { x: 0.2, y: 0.45, width: 0.6, height: 0.1 },
      hookLine: { x: 0.25, y: 0.6, width: 0.5, height: 0.08 },
      activityInfo: { x: 0.25, y: 0.75, width: 0.5, height: 0.08 },
      footerNote: { x: 0.3, y: 0.9, width: 0.4, height: 0.05 },
    },
  },
  {
    layoutId: "center_stack",
    name: "居中堆叠",
    description: "所有文字、视觉元素居中分层堆叠，主次分明",
    constraintZones: {
      mainTitle: { x: 0.1, y: 0.1, width: 0.8, height: 0.18 },
      subTitle: { x: 0.15, y: 0.3, width: 0.7, height: 0.12 },
      hookLine: { x: 0.15, y: 0.55, width: 0.7, height: 0.1 },
      activityInfo: { x: 0.15, y: 0.7, width: 0.7, height: 0.1 },
      footerNote: { x: 0.2, y: 0.85, width: 0.6, height: 0.06 },
    },
  },
  {
    layoutId: "corner_accent",
    name: "边角点缀",
    description: "主体内容居中，装饰元素分布在画面四角/侧边",
    constraintZones: {
      mainTitle: { x: 0.1, y: 0.15, width: 0.8, height: 0.2 },
      subTitle: { x: 0.15, y: 0.4, width: 0.7, height: 0.1 },
      hookLine: { x: 0.1, y: 0.55, width: 0.8, height: 0.08 },
      activityInfo: { x: 0.15, y: 0.7, width: 0.7, height: 0.1 },
      footerNote: { x: 0.2, y: 0.85, width: 0.6, height: 0.06 },
    },
  },
  {
    layoutId: "symmetric_chinese",
    name: "国风对称",
    description: "左右/上下对称构图，版式工整古韵",
    constraintZones: {
      mainTitle: { x: 0.15, y: 0.08, width: 0.7, height: 0.2 },
      subTitle: { x: 0.2, y: 0.3, width: 0.6, height: 0.1 },
      hookLine: { x: 0.15, y: 0.5, width: 0.7, height: 0.1 },
      activityInfo: { x: 0.2, y: 0.65, width: 0.6, height: 0.1 },
      footerNote: { x: 0.25, y: 0.82, width: 0.5, height: 0.06 },
    },
  },
  {
    layoutId: "floating_layered",
    name: "悬浮层叠",
    description: "文字、图片、色块层叠排布，立体层次感强",
    constraintZones: {
      mainTitle: { x: 0.08, y: 0.05, width: 0.55, height: 0.2 },
      subTitle: { x: 0.35, y: 0.3, width: 0.55, height: 0.12 },
      hookLine: { x: 0.08, y: 0.5, width: 0.5, height: 0.1 },
      activityInfo: { x: 0.4, y: 0.65, width: 0.5, height: 0.1 },
      footerNote: { x: 0.1, y: 0.85, width: 0.8, height: 0.06 },
    },
  },
];

export function getLayoutById(layoutId: string): LayoutDefinition | undefined {
  return LAYOUTS.find((l) => l.layoutId === layoutId);
}
