---
name: responsive-layout-architect
description: Architectural rules for ultra-responsive, accessible, and fluid mobile/tablet/desktop web layouts.
---

# Responsive Layout & Spatial Architecture

This skill ensures interfaces render flawlessly across all viewports without layout shifts or clipped content.

## 1. Breakpoints & Viewport Units
- **Mobile First**: Default styles targeting 360px - 480px, with fluid enhancements up to 1440px+ ultrawide.
- **Dynamic Viewport Heights**: Always use `100dvh` (or `100svh`) instead of `100vh` to account for mobile browser URL bars on iOS Safari & Chrome.
- **Container Queries**: Use `@container` for component-level responsiveness inside modular cards or grid columns.

## 2. Touch & Accessibility Ergonomics
- **Minimum Touch Target**: 44px x 44px for all buttons, chips, and tap areas.
- **Safe Area Insets**: Respect `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` for mobile fixed bars.
- **No Overflow Clipping**: Prevent horizontal scrollbars (`overflow-x: clip` or `overflow-x: hidden` on root containers).

## 3. Zero Cumulative Layout Shift (CLS)
- Pre-allocate dimensions (`aspect-ratio` or fixed height containers) for uploaded floor plans, hero banners, and dynamic illustrations.
- Skeleton loaders matching the exact geometry of incoming AI audit data.
