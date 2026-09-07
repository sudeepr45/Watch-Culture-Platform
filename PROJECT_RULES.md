# Project Development Rules: Watch Culture Platform

These rules govern all architectural, design, and code decisions for the Watch Culture Platform. All contributors and AI assistants must strictly adhere to them.

---

## 1. Product Identity & Vision
- **Premium Watch Culture Platform**: This is a dedicated, sophisticated watch culture platform, not a traditional watch blog or generic news feed.
- **Visual Storytelling & Interaction**: The experience must prioritize rich visual storytelling, tactile interaction, and engaging exploration over dense, static blocks of text.
- **Industry-Grade Polish**: The product must achieve a level of craftsmanship and design refinement suitable for showcase to high-profile horological publications and prestigious industry events such as the **Ethos Watch Summit**.

---

## 2. Design Philosophy & Aesthetics
- **No Generic SaaS Dashboards**: Avoid generic SaaS UI conventions, admin-template tropes, and corporate analytics styling.
- **Restraint & Craftsmanship**: Avoid excessive rounded corners, loud gradients, generic glassmorphism, or gimmicky animations. UI styling should reflect the horological world—timeless, precise, and understated.
- **Fully Responsive**: Flawless design and user experience across mobile, tablet, and desktop form factors.
- **Accessibility**: Build with accessibility in mind (semantic HTML, proper contrast, keyboard navigability, and clear ARIA semantics).

---

## 3. Architecture & Code Quality
- **Modular & Reusable Components**: Build reusable, single-responsibility React components adhering to consistent design tokens and prop interfaces.
- **Structured Codebase**: Keep pages, components, data models, hooks, services, and utilities strictly organized within their designated directories.
- **No Premature Dependency Bloat**: Do not install unnecessary third-party libraries or packages without a clear, justified need.
- **Technology Consistency**: Do not replace or swap out existing foundational technologies (React, Vite, TypeScript, Tailwind CSS, ESLint) without an explicit, well-reasoned architectural rationale.

---

## 4. Data & Backend Discipline
- **Supabase as the Single Source of Truth**: The future Supabase database will serve as the canonical source of truth for watches, stories, user profiles, collections, and community interactions.
- **No Hardcoded Data**: Do not hardcode datasets or content structures that inherently belong in the relational database.
- **No Mock Auth or Fake Backends**: Do not build temporary or mock authentication/backend layers that would later require costly rewrites. Integrate real backend contracts deliberately when each feature phase arrives.

---

## 5. Performance
- **Optimized Media Delivery**: Images and visual assets are fundamental to horological storytelling. Prioritize responsive images, lazy loading, modern formats (WebP/AVIF), and optimized rendering to ensure fast initial page loads and zero layout shifts.
- **Lightweight Bundling**: Maintain clean bundle sizes and adhere to strict code splitting practices.
