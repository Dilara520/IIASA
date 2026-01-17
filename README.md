# Intelligent Data Dashboard (React + FastAPI)

## Project Overview
This is a full-stack data intelligence platform designed to analyze time-series datasets and render geospatial raster imagery.

Unlike a monolithic script, this project demonstrates a **modern, decoupled architecture** suitable for production SaaS environments. It features a high-performance **FastAPI** backend for data processing and a responsive **React (TypeScript)** frontend for data visualization.

## Architecture & Technology Stack

### 1. Backend (Python & FastAPI)
* **Framework:** `FastAPI` - Selected for its high performance (async), strict type validation (Pydantic), and automatic documentation.
* **Data Processing:** `Pandas` (ETL) & `NumPy` (High-performance array manipulation).
* **Image Processing:** `Pillow (PIL)` - Utilized for lightweight, dependency-free geospatial rendering. We specifically chose PIL over heavier libraries to maintain a slim container footprint while handling massive TIFF files via efficient subsampling.
* **Caching Strategy:** Implemented a robust **In-Memory Caching** system. Data is preloaded into RAM during the application startup event, eliminating file I/O latency during user interactions.
* **AI Integration:** `OpenAI API` integration for context-aware reasoning.

### 2. Frontend (TypeScript & React)
* **Framework:** `Vite + React` - Chosen for modern build tooling and fast HMR.
* **Language:** `TypeScript` - Ensures type safety across component props and API responses.
* **Styling:** `Tailwind CSS` - For rapid, responsive utility-first styling.
* **Visualization:** `Recharts` - For responsive, time-series analysis with multi-level filtering (Region -> Variable -> Item).
* **State Management:** React Hooks (`useState`, `useMemo`) manage the dependency chain between filters and chart updates.

### 3. Infrastructure (Docker)
* Containerized using **Docker** and orchestrated via **Docker Compose** to ensure consistent environments across development and production.

---

## Quick Start (Docker)

The easiest way to run the full stack is via Docker Compose.

1.  **Clone the repository:**
    ```bash
    git clone <repo-url>
    cd <repo-folder>
    ```

2.  **Set Environment Variables:**
    Create a `.env` file in the `server/` directory and add your OpenAI Key:
    ```
    OPENAI_API_KEY=your_key_here
    ```

3.  **Build and Run:**
    ```bash
    docker-compose up --build
    ```

4.  **Access the App:**
    * **Frontend:** `http://localhost:5173`
    * **Backend API Docs:** `http://localhost:8000/docs`

---

## Methodology & Design Decisions

### ** Performance Optimization & Caching**
To ensure instant feedback and avoid "pending request" states:
* **Startup Preloading:** The backend initiates data extraction immediately upon container startup.
* **Zero-Latency Serving:** Once loaded, the API serves data directly from the Global Variable Cache (`_CSV_CACHE`, `_RASTER_CACHE`), bypassing repetitive disk reads and ensuring O(1) access time for endpoints.

### ** Handling Large Geospatial Data (Server-Side Subsampling)**
A core challenge was rendering server-side TIFF file in the browser without exhausting server memory or crashing the client.
* **The Problem:** Standard loading of 2.5 billion pixel images requires massive RAM allocation.
* **The Solution:** We implemented a **Memory-Safe Pipeline** using `Pillow` and `NumPy`:
    1.  **Smart Reduction:** The system calculates an optimal reduction factor and uses `img.reduce()` to skip pixels *during the read process*. This allows us to generate a full-map preview while using only a fraction of the RAM.
    2.  **Normalization:** Raw data is converted to a NumPy array, normalized to a 0-255 scale (handling NaNs and floating-point ranges), and encoded as a lightweight PNG stream for the frontend.

### **3. Context-Aware AI Analyst**
* **Architecture:** The application features an embedded AI chat interface designed to be "dashboard-aware."
* **Context Injection:** Unlike standard chatbots, this module is architected to receive the user's current view state (Selected Region, Variable, Scenario) alongside the query. This allows the backend logic to generate answers specific to the data currently visible on the screen.
* **Status:** The integration logic and UI components are implemented. Due to project timeframe constraints, the module is currently in an experimental state pending comprehensive testing across all data scenarios.

---

## Future Roadmap

1.  **Infrastructure:**
    * Implement **Kubernetes (K8s)** manifests for scalable deployment.
    * Set up a **CI/CD pipeline** (GitHub Actions) to run Pytest (Backend) and Jest (Frontend) on every commit.

2.  **Database:**
    * Replace in-memory CSV processing with **PostgreSQL + PostGIS**. This would allow for efficient querying of massive geospatial datasets.

3.  **Advanced AI:**
    * Implement **LangChain** agents to allow the AI to autonomously query the database rather than relying on injected context summaries.