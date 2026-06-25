# PRD — Phase 6: UI/UX Redesign & Design System

> **Status: ✅ COMPLETE**  
> **Latest Deploy:** https://gym-planner-ai.vercel.app

---

## Overview

A complete visual overhaul to transform the app from a functional prototype into a premium, high-end fitness product. The design uses a dual-theme system: a **bright/cream landing page** and a **deep dark, luxurious inner app** with gold metallic accents throughout.

---

## 6.1 Design System

| Token / Utility | Value | Status |
|-----------------|-------|--------|
| Gold accent | `#D4AF6A` | ✅ Done |
| Background (dark) | `oklch(0.12 0 0)` | ✅ Done |
| Glass card | `rgba(20,20,20,0.65)` + `blur(24px)` | ✅ Done |
| Gold glow | `box-shadow: 0 0 28px rgba(212,175,106,0.15)` | ✅ Done |
| Text gradient gold | Linear gradient `#D4AF6A → #E5C48A` clipped to text | ✅ Done |
| Heading font | Outfit (Google Fonts) | ✅ Done |
| Body font | Inter (Google Fonts) | ✅ Done |
| Ambient orbs | `bg-gold/5 blur-[120px]` fixed behind content | ✅ Done |
| Premium scrollbar | 6px, dark thumb, rounded | ✅ Done |
| `animate-pulse-glow` keyframe | Gold pulsing glow 3s loop | ✅ Done |
| `typing-dot` keyframe | 3-dot bounce animation | ✅ Done |

---

## 6.2 Landing Page Redesign

| Item | Before | After | Status |
|------|--------|-------|--------|
| Background | Dark/black | Bright cream/white | ✅ Done |
| Hero layout | Single column | 2-column split | ✅ Done |
| Hero image | None | AI-generated bodybuilder | ✅ Done |
| CTA buttons | Plain dark | Gold gradient with hover scale | ✅ Done |
| Typography | Small | Large/bold Outfit headings | ✅ Done |
| Nav | Basic | Glass frosted, fixed top | ✅ Done |
| Overall vibe | Developer-style | Premium fitness brand | ✅ Done |

---

## 6.3 Inner App Pages — Premium Upgrade

Each page received the following standard treatments:

| Treatment | Applied To | Status |
|-----------|-----------|--------|
| Ambient gold glow orbs (fixed bg) | All inner pages | ✅ Done |
| Metric numbers use `text-gradient-gold` | Dashboard, BMI | ✅ Done |
| Hover lift (`hover:-translate-y-1`) on cards | Dashboard | ✅ Done |
| Richer `glass-card` (`blur(24px)`, inset highlight) | All pages | ✅ Done |
| `px-4 sm:px-6 lg:px-8 pt-8` consistent padding | All pages | ✅ Done |
| Sub-headings use `text-sm md:text-base` | All pages | ✅ Done |

### Per-Page Details

| Page | Key Upgrade | Status |
|------|------------|--------|
| `/dashboard` | Gold gradient metric values, icon per card, hover-lift | ✅ Done |
| `/nutrition` | Ambient orbs, premium wrapper, responsive text | ✅ Done |
| `/bmi` | BMI number in `text-gradient-gold`, ambient orbs | ✅ Done |
| `/diary` | Ambient orbs, responsive layout | ✅ Done |
| `/profile` | Ambient orbs, membership card vibe, responsive | ✅ Done |
| `/onboarding` | Ambient orbs, z-layered layout | ✅ Done |
| `/onboarding/welcome` | Ambient orbs, premium card grid | ✅ Done |
| `/login` | Auth layout ambient gold orbs | ✅ Done |
| `/register` | Auth layout ambient gold orbs | ✅ Done |
| `/ai-coach` | Glass header, gold message bubbles, typing dots | ✅ Done |

---

## 6.4 Auth Layout Enhancement

| Item | Status |
|------|--------|
| Auth layout wraps both login + register | ✅ Done |
| Fixed ambient gold orb background | ✅ Done |
| Children centered in `z-10` layer | ✅ Done |
| No layout bleed from sidebar | ✅ Done |

---

## 6.5 Toaster Theme

| Item | Status | Notes |
|------|--------|-------|
| Dark glass toast style | ✅ Done | `bg: oklch(0.1 0 0)`, `border: oklch(0.18 0 0)` |
| Gold ring on focus | ✅ Done | `--tw-ring-color: #D4AF6A` |

---

## Verification

- ✅ `npm run build` passes after all redesign changes
- ✅ No TypeScript or JSX parse errors
- ✅ Deployed to production at https://gym-planner-ai.vercel.app
- ✅ Consistent visual language across all 14 routes
