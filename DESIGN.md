---
name: Agro-Industrial Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434936'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#747a64'
  outline-variant: '#c3c9b0'
  surface-tint: '#4a6700'
  primary: '#4a6700'
  on-primary: '#ffffff'
  primary-container: '#b2e641'
  on-primary-container: '#486500'
  inverse-primary: '#a4d732'
  secondary: '#456649'
  on-secondary: '#ffffff'
  secondary-container: '#c4e9c4'
  on-secondary-container: '#4a6a4d'
  tertiary: '#5b5f5e'
  on-tertiary: '#ffffff'
  tertiary-container: '#d3d6d4'
  on-tertiary-container: '#595d5c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bff44e'
  primary-fixed-dim: '#a4d732'
  on-primary-fixed: '#141f00'
  on-primary-fixed-variant: '#374e00'
  secondary-fixed: '#c7ecc7'
  secondary-fixed-dim: '#abd0ac'
  on-secondary-fixed: '#02210a'
  on-secondary-fixed-variant: '#2e4e32'
  tertiary-fixed: '#e0e3e1'
  tertiary-fixed-dim: '#c4c7c5'
  on-tertiary-fixed: '#181c1b'
  on-tertiary-fixed-variant: '#434846'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-page: 32px
  sidebar-width: 260px
  card-padding: 20px
---

## Brand & Style
This design system is engineered for the agricultural and financial management sector, balancing rugged reliability with modern analytical precision. The aesthetic is rooted in a **Corporate Modern** style with high-utility layouts.

The brand personality is professional, authoritative, and grounded. It targets enterprise users who require high-density data visualization without cognitive overload. The UI evokes a sense of organized efficiency through a deep "forest" primary palette and vibrant, growth-oriented accents that signify action and opportunity.

## Colors
The palette is dominated by an "Evergreen" hierarchy. 

- **Primary (Lime Green):** Used exclusively for high-priority calls to action and active states. It represents growth and focus.
- **Secondary (Dark Forest):** Applied to structural navigational elements like sidebars to provide a strong, stable anchor for the application.
- **Surface (Soft Gray):** A neutral, low-contrast background that reduces eye strain during long periods of data management.
- **Accent/Status:** A set of muted oranges and blues are used for categorization (CP/LP) and status badges to ensure information hierarchy without competing with the primary action color.

## Typography
The design system utilizes **Manrope** for its balance between technical precision and modern friendliness. It is a highly legible sans-serif that performs well in dense data tables.

- **Headlines:** Bold and concise, used for page titles and section headers.
- **Body:** Optimized for readability at 14px for standard data.
- **Data Mono:** Optionally used for financial figures and currency to ensure numerical alignment in tables.
- **Mobile Scale:** For screens under 768px, `headline-lg` scales down to 20px to maintain balance.

## Layout & Spacing
The layout follows a **Fixed Sidebar + Fluid Content** model. 

- **Grid:** A 12-column grid is used within the content area. 
- **Rhythm:** An 8px spacing system governs the internal margins of cards and tables, while a 4px "base" unit handles fine-tuned element alignment.
- **Responsive Behavior:** 
  - **Desktop:** 260px sidebar is persistent.
  - **Tablet:** Sidebar collapses to an icon-only rail (80px).
  - **Mobile:** Sidebar becomes a bottom navigation or "hamburger" overlay; page margins reduce to 16px.

## Elevation & Depth
This design system uses **Tonal Layers** and **Ambient Shadows** to create a structured hierarchy.

- **Level 0 (Background):** The `#f4f7f5` surface acts as the base.
- **Level 1 (Cards/Tables):** White surfaces with a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)). This lifts the data containers off the gray background.
- **Level 2 (Active States):** Navigational items use color saturation (Lime Green) rather than shadow to indicate selection, maintaining a clean, modern profile.
- **Borders:** Subtle 1px borders in a slightly darker gray than the background are used for table row separation to maintain vertical rhythm without adding visual weight.

## Shapes
The shape language is **Rounded**, utilizing a 0.5rem (8px) corner radius as the standard for cards and primary buttons. This softens the "industrial" feel of the agricultural data.

- **Standard (8px):** Primary containers and buttons.
- **Large (16px):** Outer wrappers or large dashboard summary cards.
- **Pill:** Reserved specifically for status badges and chips (e.g., "CP", "PENDENTE") to distinguish them from actionable buttons.

## Components

### Buttons
- **Primary:** Lime Green background with dark text. High contrast, 8px radius.
- **Secondary/Icon:** Ghost style or subtle outlines to prevent competition with the primary action.

### Summary Cards
Large-format containers located at the top of dashboards. They feature a specific icon color-coded to the metric (Red for debt, Blue for long-term), with the primary metric displayed in `headline-lg`.

### Data Tables
- **Header:** Light gray background, uppercase labels in `label-sm`.
- **Rows:** White background, thin divider lines.
- **Aggregates:** A "Total" row at the bottom with a distinct background tint or bolded text to summarize columns.

### Sidebar Navigation
The secondary (Dark Forest) sidebar uses high-contrast white text. Active items are highlighted with a Lime Green pill-shaped background that spans the width of the menu item.

### Chips & Badges
Small, pill-shaped elements with low-opacity background tints (e.g., light orange for "CP") to categorize data points without overwhelming the row.