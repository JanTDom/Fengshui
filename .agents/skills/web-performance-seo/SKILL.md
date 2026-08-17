---
name: web-performance-seo
description: Core Web Vitals (LCP, INP, CLS) optimization, semantic HTML5 hierarchy, JSON-LD structured data, and modern web discovery standards.
---

# Web Performance & Technical SEO

This skill guides high-speed loading, semantic document structure, and organic discoverability.

## 1. Semantic HTML Structure
- Single `<h1>` per page capturing the core commercial value proposition.
- Hierarchical headings: `<h2>` for major sections, `<h3>` for cards/sub-sections.
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.

## 2. Core Web Vitals (CWV)
- **Largest Contentful Paint (LCP < 1.5s)**:
  - Preload critical hero assets with `fetchpriority="high"`.
  - Modern image formats: WebP / AVIF with `srcset` and `sizes`.
- **Interaction to Next Paint (INP < 150ms)**:
  - Keep client-side React bundle lean.
  - Offload heavy tasks (like large PDF generation or complex AI parsing) to Web Workers or streaming serverless endpoints.
- **Cumulative Layout Shift (CLS < 0.05)**:
  - Reserve space for web fonts with `font-display: swap` and matching fallback font metrics.

## 3. Rich Schema Markup (JSON-LD)
- Embed structured data for `Organization`, `Service`, `FAQPage`, and `Review` to achieve Google Rich Results in SERPs.
