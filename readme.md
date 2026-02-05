<div align="center">

# 🛡️ FakeNewsAI  
### AI-Powered Fake News Detection • Fast • Clean UI • Production-ready

**Detect potential misinformation** in articles, posts, and copied text using an ML-backed classifier—built as a modern full-stack app with **Next.js** + **FastAPI**.

<br/>

<!-- Badges -->
<img alt="Next.js" src="https://img.shields.io/badge/Next.js-14+-000000?logo=nextdotjs&logoColor=white" />
<img alt="React" src="https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=000" />
<img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5+-3178C6?logo=typescript&logoColor=white" />
<img alt="Tailwind" src="https://img.shields.io/badge/TailwindCSS-3+-06B6D4?logo=tailwindcss&logoColor=white" />
<img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-0.1xx-009688?logo=fastapi&logoColor=white" />
<img alt="Python" src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white" />
<img alt="Vercel" src="https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white" />
<img alt="Render" src="https://img.shields.io/badge/Deploy-Render-3B82F6?logo=render&logoColor=white" />

<br/><br/>

**Author:** Joy Karmakar  
**Built by:** NaturalAILab

</div>

---

## ✨ What this app does

FakeNewsAI accepts a news snippet/post/article text and returns:

- **Label**: `LIKELY_FAKE` or `LIKELY_REAL`
- **Fake probability score** (0–1)
- **Model label** (model/version metadata)
- **Notes** (human-readable signals / explanation bullets)

It’s designed for **demo + real usage** with UX features like **one-click paste** and a **local history panel**.

---

## 🧩 Key Features

- 🔍 **AI-driven detection** with probability scoring  
- 📋 **Paste from Clipboard** (one click)  
- 🧠 **Model metadata** (`model_label`)  
- 📝 **Explainability notes** (`notes[]`) with safe rendering  
- 🕘 **Local history** (stored in `localStorage`)  
- 🧹 **Reset + delete history items + clear all**  
- ⚡ Responsive, modern interface (Tailwind)

---


## 🏗️ System Architecture

The application follows a clean **client–server architecture**, optimized for scalability, clarity, and production deployment.

```txt
┌──────────────┐
│     User     │
└──────┬───────┘
       │
       │  Paste / Type News Text
       │
┌──────▼────────────────────────┐
│  Next.js Frontend (Vercel)     │
│  • Modern UI (Tailwind CSS)    │
│  • Clipboard Paste Support     │
│  • Local History (Browser)     │
└──────┬────────────────────────┘
       │
       │  POST /analyze
       │
┌──────▼────────────────────────┐
│  FastAPI Backend (Render)      │
│  • Text preprocessing          │
│  • ML/NLP inference            │
│  • Probability estimation      │
└──────┬────────────────────────┘
       │
       │  JSON Response
       │
┌──────▼────────────────────────┐
│  Analysis Result               │
│  • label: LIKELY_FAKE / REAL   │
│  • probability_fake (0–1)      │
│  • model_label (version info)  │
│  • notes[] (explanation cues)  │
└───────────────────────────────┘
