---
name: pdf-layout-generator
description: Expert guidelines and design patterns for building high-quality, elegant editorial PDF reports using pdfmake in the browser.
---

# PDF Layout & Design Generator (pdfmake)

This skill provides patterns, layout principles, and styling standards for generating polished Feng Shui audit PDF reports.

## Layout & Styling Rules
1. **Color Palette & Typography**:
   - Primary Accent: Deep Warm Charcoal / Forest Sage (`#1E2922`, `#2D3748`).
   - Secondary / Gold Accent: Muted Sand / Ochre (`#C5A880`, `#D4AF37`).
   - Background neutrals: Light warm parchment (`#FAF9F6`, `#F4EFEA`).
   - High legibility: Standard header sizing (H1: 22pt, H2: 16pt, H3: 12pt, Body: 9.5-10pt).

2. **Page Structure & Flow**:
   - **Header & Footer**: Consistent page numbers (`Strona X z Y`) and minimal top branding bar.
   - **Cover Page**: Elegant title, client name, audit date, summary badge, and clean whitespace.
   - **Executive Summary Box**: High-contrast highlight box with key takeaways.
   - **Room-by-Room Diagnosis Grid**: Two-column layout with icon badges, problem diagnosis, and actionable remedy checklist.
   - **Action Plan**: Prioritized checklist (Krok 1, Krok 2, Krok 3).

3. **Technical pdfmake Patterns**:
   - Always define `pageMargins: [40, 50, 40, 50]`.
   - Use `dontBreakRows: true` on tables to avoid awkward page breaks across recommendation cards.
   - Embed base64-encoded SVG/PNG icons cleanly or use native pdfmake canvas shapes.
