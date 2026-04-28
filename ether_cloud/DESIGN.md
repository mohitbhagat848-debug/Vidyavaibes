# Design System Specification: The Ethereal Canvas

## 1. Overview & Creative North Star
**Creative North Star: "The Weightless Workspace"**

This design system is engineered to move away from the rigid, grid-locked structures of traditional SaaS and toward a tactile, editorial experience. We treat the UI not as a flat screen, but as a physical environment—a "Weightless Workspace" where elements float, overlap, and breathe. 

By leveraging intentional asymmetry, slight card rotations (-2° to +2°), and a vast expanse of white space, we create a sense of effortless productivity. We break the "template" look by rejecting harsh lines and instead using tonal depth and light to guide the user’s eye. This is a premium experience that values clarity over density and motion over staticity.

---

## 2. Colors & Surface Philosophy

### 2.1 The Palette
Our palette is rooted in a sophisticated neutral base with high-chroma blue accents for critical path actions.
- **Primary:** `#0058bf` (The Core Action)
- **Background:** `#f7f9fb` (The Canvas)
- **Surface Tiers:** Use `surface_container_lowest` (#ffffff) for primary floating cards and `surface_container` (#eceef0) for recessed background elements.

### 2.2 The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to section off content. 
Structure must be achieved through:
- **Tonal Shifts:** Placing a `surface_container_lowest` card against the `surface` background.
- **Dotted Grid Texture:** Use a subtle 24px dot grid pattern over the background to provide a sense of scale without visual clutter.
- **Negative Space:** Using the Spacing Scale to create "invisible boundaries."

### 2.3 Surface Hierarchy & Nesting
Think in layers, not boxes.
1.  **Canvas (Base):** `surface` (#f7f9fb) with dot grid.
2.  **Sectioning:** `surface_container_low` (#f2f4f6) for large, non-interactive areas.
3.  **The Hero Layer:** `surface_container_lowest` (#ffffff) for floating interactive cards.
4.  **The Focus Layer:** Glassmorphism (`surface_variant` at 60% opacity with 12px backdrop-blur) for overlays and tooltips.

---

## 3. Typography: The Editorial Voice

We utilize **Inter** exclusively. The objective is "High-Contrast Authority"—large, bold headlines paired with hyper-legible, generously spaced body text.

| Role | Weight | Size | Tracking | Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Display-LG** | 700 (Bold) | 3.5rem | -0.02em | Hero statements; the "Main Hook." |
| **Headline-MD** | 600 (Semi) | 1.75rem | -0.01em | Section headers; clear and commanding. |
| **Title-SM** | 500 (Med) | 1.0rem | 0 | Card titles and primary navigation. |
| **Body-LG** | 400 (Reg) | 1.0rem | 0 | Long-form reading; primary descriptions. |
| **Label-MD** | 600 (Semi) | 0.75rem | +0.05em | Uppercase metadata and small buttons. |

---

## 4. Elevation & Depth

### 4.1 The Layering Principle
Depth is primarily achieved via **Tonal Stacking**. An element is "higher" if it is whiter (closer to `surface_container_lowest`). Do not use shadows to separate adjacent sections; use them only to signify "Floating" or "Objectness."

### 4.2 Ambient Shadows
When a floating effect is required (e.g., a card with a rotation), use multi-layered ambient shadows:
- **Style:** 0px 10px 40px rgba(25, 28, 30, 0.06), 0px 2px 10px rgba(25, 28, 30, 0.04).
- **Tinting:** Shadows should never be pure black. They must use the `on_surface` color at low opacities to feel integrated into the environment.

### 4.3 The "Ghost Border" Fallback
If accessibility requirements demand a border (e.g., in high-contrast modes), use a **Ghost Border**:
- **Stroke:** 1px `outline_variant` (#c1c6d7).
- **Opacity:** 20% max.
- **Effect:** This mimics a slight bevel rather than a structural wall.

---

## 5. Components

### 5.1 Buttons (The Kinetic Point)
- **Primary:** `primary` (#0058bf) background, `on_primary` text. Radius: `full`. Padding: 12px 24px.
- **Secondary:** Glass-effect. `surface_container_highest` at 40% opacity + backdrop blur.
- **State Change:** On hover, primary buttons should utilize a subtle `primary_container` gradient transition to add "soul."

### 5.2 Cards & Floating Elements
- **Radius:** `lg` (2rem) for main cards; `xl` (3rem) for hero modules.
- **Interaction:** Floating cards (like the "Today's Tasks" or "Reminders" cards in reference) should have a slight rotation (±2deg) to break the "perfect" digital grid.
- **Divider Prohibition:** Never use `<hr>` tags. Separate list items with 16px of vertical white space and a 2% color shift on hover.

### 5.3 Input Fields
- **Style:** Minimalist. No bottom line or full box. Use a `surface_container_low` background with a `md` (1.5rem) corner radius.
- **Focus:** Transition background to `surface_container_lowest` and apply a subtle `primary` ghost border (20% opacity).

### 5.4 Signature Component: The "Sticky Note"
For annotations and highlights (as seen in the reference), use a `tertiary_fixed` (#ffdbcb) background with a -3° rotation and a `title-sm` handwritten-style weight. This adds a human, tactile touch to the SaaS environment.

---

## 6. Do’s and Don'ts

### Do
- **Do** embrace extreme white space. If you think there is enough space, add 24px more.
- **Do** overlap elements. Let a card bleed slightly over a section transition to create a cohesive narrative.
- **Do** use `primary` sparingly. It is a beacon, not a decorative element.
- **Do** use the `DEFAULT` (1rem) and `lg` (2rem) radii to soften the interface.

### Don’t
- **Don't** use 100% opaque, high-contrast borders. 
- **Don't** align everything to a rigid vertical axis. Allow secondary elements to be slightly offset or rotated.
- **Don't** use generic grey shadows. Always tint your shadows with the background hue.
- **Don't** crowd the "Canvas." If a screen feels busy, move secondary information to a "Focus Layer" (Glassmorphism overlay).