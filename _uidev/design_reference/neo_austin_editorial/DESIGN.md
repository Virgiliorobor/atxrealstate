---
name: Neo-Austin Editorial
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#3a4a44'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#6a7b74'
  outline-variant: '#b9cbc3'
  surface-tint: '#006b57'
  primary: '#006b57'
  on-primary: '#ffffff'
  primary-container: '#00ffd1'
  on-primary-container: '#00725c'
  inverse-primary: '#00e0b7'
  secondary: '#576500'
  on-secondary: '#ffffff'
  secondary-container: '#d0ed00'
  on-secondary-container: '#5b6900'
  tertiary: '#5f5e5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#e4e1e1'
  on-tertiary-container: '#656463'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#15ffd1'
  primary-fixed-dim: '#00e0b7'
  on-primary-fixed: '#002019'
  on-primary-fixed-variant: '#005141'
  secondary-fixed: '#d2f000'
  secondary-fixed-dim: '#b8d300'
  on-secondary-fixed: '#191e00'
  on-secondary-fixed-variant: '#414c00'
  tertiary-fixed: '#e5e2e1'
  tertiary-fixed-dim: '#c9c6c5'
  on-tertiary-fixed: '#1c1b1b'
  on-tertiary-fixed-variant: '#474646'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-lg:
    fontFamily: Bodoni Moda
    fontSize: 80px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Bodoni Moda
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Bodoni Moda
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-mono-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  label-mono-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
spacing:
  unit: 8px
  gutter: 24px
  margin-mobile: 24px
  margin-desktop: 64px
  container-max: 1440px
---

## Brand & Style

The design system embodies the "Neo-Austin" spirit: a high-octane intersection of "Silicon Hills" technological precision and the city's legacy of creative irreverence. It targets a sophisticated, metropolitan audience that demands professional rigor without sacrificing cultural edge.

The aesthetic direction is **Editorial-Minimalist with Brutalist accents**. It relies on a pristine white canvas to allow high-energy, fluorescent hits of color to command attention. The vibe is sophisticated and premium, yet possesses a rhythmic, high-energy pulse that feels like a live performance in a luxury high-rise. Expect aggressive white space, sharp geometry, and a rigid adherence to a modern typographic grid.

## Colors

The palette is built on extreme contrast to evoke a high-energy metropolitan environment.

*   **Primary (Fluorescent Teal):** Used for primary actions and digital wayfinding. It represents the "Silicon Hills" tech energy.
*   **Secondary (Acid Yellow):** Reserved for high-priority highlights and "weird" editorial callouts. It should be used sparingly as an accent to avoid visual fatigue.
*   **Tertiary (Deep Ink):** A near-black used for all typography and structural borders. It provides the "Editorial" weight.
*   **Neutral (Pure White):** The foundational surface. No off-whites are permitted; the background must remain crisp and clinical to let the accents pop.

Maintain a "high-ink" ratio: thin lines of Deep Ink against massive fields of White, punctured by blocks of Teal or Yellow.

## Typography

This design system uses a triple-font strategy to balance luxury, utility, and tech:

1.  **Bodoni Moda (Headlines):** High-contrast serifs that bring the "Editorial" luxury. Use for large-scale storytelling and section headers. 
2.  **Manrope (Body):** A modern, balanced sans-serif that ensures high readability for professional content.
3.  **Geist (Accents/Labels):** A technical monospaced font used for data, metadata, and "tech-edge" UI labels.

**Editorial Rule:** Headlines should often be "oversized" to create a sense of scale. Use the `label-mono` styles for buttons and eyebrow text to provide a utilitarian contrast to the elegant serifs.

## Layout & Spacing

The layout philosophy is **Fixed-Editorial**. Content is centered within a 12-column grid on desktop, with generous outer margins to simulate a high-end magazine spread.

*   **Grid:** 12 columns for desktop, 4 columns for mobile.
*   **Gutters:** Fixed at 24px to maintain a tight, structured feel.
*   **Margins:** Oversized (64px+) on desktop to create breathing room.
*   **Asymmetry:** Elements should occasionally break the grid or span unusual column counts (e.g., a 7-column main body with a 3-column sidebar) to keep the layout dynamic and "weird."

Vertical rhythm is strictly based on the 8px base unit. Use larger-than-normal gaps between sections to emphasize the white-space-as-luxury approach.

## Elevation & Depth

This design system rejects shadows and blurs in favor of **High-Contrast Outlines and Tonal Stacking**. 

Visual hierarchy is achieved through:
1.  **Bold Borders:** 1px or 2px solid lines in Tertiary (Deep Ink) to define containers.
2.  **Color Inversion:** Using solid blocks of Primary (Teal) or Tertiary (Ink) to pop an element off the White background.
3.  **Layered Planes:** Elements do not "float"; they sit on the surface. When depth is required, use a solid offset "drop" (a 4px block of color behind a container) rather than a soft shadow.

Surfaces are always 100% opaque.

## Shapes

The shape language is **Strictly Geometric**. 

To maintain the architectural, "Silicon Hills" precision, all UI elements—including buttons, cards, and input fields—must have 0px corner radii. This sharp-edged approach reinforces the high-energy, unapologetic nature of the brand.

Circular elements are only permitted for specific functional icons (e.g., a play button) or profile avatars to provide a singular point of visual relief.

## Components

*   **Buttons:** Rectangular with 2px solid Deep Ink borders. Primary buttons use a solid Teal fill with Ink text. Secondary buttons use White fill with Ink text. Use `label-mono-md` for button text.
*   **Input Fields:** 1px bottom-border only for a "form" feel, or full 1px borders for a "data-entry" feel. Labels always use the Monospaced font.
*   **Chips/Tags:** Solid Acid Yellow backgrounds with Deep Ink monospaced text. No rounding.
*   **Cards:** Defined by a 1px Deep Ink border. No shadows. The card header should use a monospaced "eyebrow" label above a Bodoni Moda title.
*   **Lists:** Separated by 1px horizontal lines. Use monospaced numbers (01, 02, 03) for ordered lists to emphasize the technical edge.
*   **Interactive State:** On hover, buttons should shift to a solid color fill (Acid Yellow) or invert their colors instantly—no slow transitions. The goal is to feel "snappy" and digital.