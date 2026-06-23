# Gridlock: Event-Driven Congestion Management System

**Flipkart Gridlock 2026** | **AI-Powered Urban Traffic Infrastructure**

Gridlock is an intelligent, event-driven system that shifts urban traffic management from reactive manual intervention to proactive, data-informed strategy[cite: 1]. By utilizing a **3-stream Graph Attention Fusion Network (GAT)**, the system models the spatial spillover of traffic incidents to provide actionable resource deployment plans[cite: 1].

---

## 🚀 The Challenge
* Urban traffic police frequently deploy resources based on experience rather than predictive data[cite: 1].
* A vehicle breakdown on a major corridor during peak hours requires a vastly different response than an incident during off-peak times[cite: 1].
* Gridlock bridges this gap with a **45-minute advance warning system**[cite: 1].

## 🛠 Architecture & Technical Stack
The system follows a modular, stage-based implementation[cite: 1].

### Core Technology
* **Deep Learning**: 3-stream GAT fusion model (Event MLP, Spatial GAT, and History MLP) implemented in **PyTorch Geometric**[cite: 1].
* **Graph Processing**: `OSMnx` and `NetworkX` used to model the Bengaluru road network as a graph[cite: 1].
* **Backend**: **FastAPI** provides a RESTful interface for real-time inference[cite: 1].
* **Frontend**: **React** dashboard with **Tailwind CSS** and **Leaflet.js** for geospatial visualization[cite: 1].

### 3-Stream Fusion Model
| Stream | Function | Output Dimension |
| :--- | :--- | :--- |
| **Event MLP** | Processes causal and vehicle data[cite: 1] | 64 |
| **Spatial GAT** | Models incident proximity using GATConv[cite: 1] | 64 |
| **History MLP** | Aggregates corridor and zone risk scores[cite: 1] | 32 |

* The streams are fused through a final Linear layer into a 4-class softmax output (Low, Moderate, High, Critical)[cite: 1].

---

## 📊 Operational Value
The system provides a comprehensive "Command Center" dashboard that includes[cite: 1]:
* **Predictive Analytics**: Real-time severity classification and impact scoring (0–100)[cite: 1].
* **Automated Resource Planning**: Rule-based engine determining officer counts, barricade requirements, and diversion routes[cite: 1].
* **Corridor Insights**: Automatic surfacing of peak-hour and day-of-week incident trends[cite: 1].
* **Performance Tracking**: Historical comparison of predicted vs. actual incident outcomes to facilitate continuous learning[cite: 1].

### Performance vs. Baseline
| Metric | XGBoost Baseline | GAT Fusion Network (Gridlock) |
| :--- | :--- | :--- |
| **Weighted F1** | ~0.78[cite: 1] | **~0.83–0.86**[cite: 1] |
| **Critical Recall** | ~0.65[cite: 1] | **~0.72+**[cite: 1] |

---

## 📂 Project Structure
* `backend/`: FastAPI app, GAT model definition, and inference logic[cite: 1].
* `frontend/`: React + Vite dashboard components[cite: 1].
* `models/`: Trained GAT weights (.pt) and XGBoost baselines (.pkl)[cite: 1].
* `data/`: ASTRAM incident dataset[cite: 1].
* `docs/`: Full Implementation_Plan.docx[cite: 1].

## 🛠 Getting Started
* **Environment Setup**: Ensure PyTorch, PyTorch Geometric, and OSMnx are installed[cite: 1].
* **Data Preparation**: Run `feature_eng.py` to process the ASTRAM CSV into graph-ready PyG Data objects[cite: 1].
* **Training**: Execute `model_train.py` to generate the baseline XGBoost and GAT Fusion model checkpoints[cite: 1].
* **Backend**: Launch the FastAPI server using `uvicorn main:app --reload`[cite: 1].
* **Frontend**: Start the dashboard using `npm run dev`[cite: 1].

---
*This project was developed following a strict 2-day build process as outlined in the project's internal Implementation Plan[cite: 1].*