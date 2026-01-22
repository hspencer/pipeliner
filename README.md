# 🛠️ PICTO-PIPELINE: Semantic Pictogram Architect

**Picto-Pipeline** is a professional-grade tool designed for linguists and semanticists to transform natural language sentence pairs (Spanish-English) into high-fidelity, semantic SVG pictogram schemas. 

It leverages the **Gemini 3 API** to perform deep NLU analysis, architectural layout planning, and precise SVG code generation in a structured, multi-step pipeline.

## 🚀 The Core Pipeline

The application processes data in three distinct, sequential stages:

1.  **Semantic NLU (Natural Language Understanding)**: Generates a [MediaFranca](https://github.com) compatible JSON schema. It extracts Speech Acts, Semantic Frames, and Visual Guidelines (Focus Actor, Core Action, etc.).
2.  **Visual Blueprint**: Translates abstract semantic data into a structural hierarchy of SVG groups and IDs. It defines the layout and composition logic.
3.  **SVG Coder**: Produces clean, 100x100 semantic SVG code. The output uses consistent CSS classes (`.f` for fills, `.k` for strokes) and logical ID grouping for downstream processing.

## 📋 Data Input Format (CSV)

The tool accepts CSV files with the following column structure:

| ID | Español | Inglés | NLU | Visual Elements | Image Prompt | SVG |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | Quiero beber agua | I want to drink water | *Auto-gen* | *Auto-gen* | *Auto-gen* | *Auto-gen* |

> **Note**: The parser is RFC 4180 compliant, meaning it handles complex JSON or XML data within cells as long as they are properly quoted.

## ✨ Key Features

-   **Batch Processing**: Run the entire pipeline for hundreds of rows with automatic cascading (Step 1 → 2 → 3).
-   **Live IDE Editor**: Every field in the pipeline is editable. You can tweak the NLU JSON manually and regenerate only the visual components.
-   **Robust Parser**: Custom CSV logic that prevents "cell-shifting" when handling internal commas in JSON/SVG data.
-   **Semantic Styling**: Generated SVGs follow a strict design system for easy integration into accessibility platforms.
-   **Traceback Console**: Real-time logging of API calls, token status, and system errors.

## 🛠️ Technical Stack

-   **Frontend**: React 19 (ESM) + Tailwind CSS.
-   **Icons**: Lucide React.
-   **AI Engine**: `@google/genai` (Gemini 3 Flash/Pro).
-   **Styling**: Inter (UI) & Fira Code (Data).

## 📥 Getting Started

1.  **Download Template**: Use the "Descargar Plantilla" button on the home screen.
2.  **Import**: Upload your filled CSV (only ID, Spanish, and English are required to start).
3.  **Process**: Click "Iniciar Batch" to run the global pipeline or the "Play" icon on specific rows.
4.  **Export**: Download the enriched CSV with all generated semantic and visual data.

---
*Developed for advanced linguistic and accessibility research.*
