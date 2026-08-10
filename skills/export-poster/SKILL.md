---
name: export-poster
description: 导出海报为PNG或JPG高清图片
---

# 导出海报 (export-poster)

## 触发条件

当用户想要：
- 导出/下载/保存海报为图片
- "导出 PNG""下载海报""保存为 JPG"
- 导出宣传图为图片

## 执行流程

### 1. 确认项目和版式

如果用户未指定，先询问要导出哪个项目和版式。

### 2. 调用导出

调用 `export_poster` Tool：

```json
{
  "tool": "export_poster",
  "input": {
    "projectId": "项目ID",
    "posterId": "选定的版式ID",
    "format": "png"
  }
}
```

### 3. 告知结果

导出成功后告诉用户：
- 文件保存位置
- 文件大小
- 可直接在文件管理器中找到

## 注意事项

- 支持 PNG 和 JPG 两种格式
- PNG 适合透明背景和高质量需求
- JPG 适合文件大小敏感的场景（如朋友圈）
- 导出文件保存在项目的 exports/ 目录下
