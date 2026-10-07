# RouteLab
## Interactive Computer Networks Routing & Failure Simulation Platform

RouteLab is a visual, interactive Computer Networks simulation platform engineered to demonstrate core Layer-3 routing principles, shortest-path calculation, routing table generation, packet forwarding, failure detection, dynamic route recalculation, and network convergence.

---

## 🚀 Key Highlights & Features

### 1. Interactive Topology Builder
- **Draggable Routers & Dynamic Links**: Create routers, connect links, configure link metrics (weights/costs), and position nodes freely.
- **Preconfigured Scenarios**:
  - **Section 24 Demo Scenario**: The standard 5-node network ($R_1 \dots R_5$) highlighting alternate paths via $R_2$ vs $R_3$.
  - **Ring Network (Dual Redundancy)**: Demonstrates clockwise vs counter-clockwise routing when any ring link is severed.
  - **Enterprise Dual-Core Mesh**: Multi-tiered Core, Distribution, and Edge routing architecture.

### 2. Dual Routing Protocol Engines
- **Link-State Routing (Dijkstra Algorithm)**:
  - Global Link-State Database (LSDB) knowledge.
  - Interactive **Step-by-Step Algorithm Debugger** showing:
    - Permanent Visited Set $S$
    - Unvisited Candidate Set $Q$
    - Node selection ($\min_{v \in Q} \text{dist}[v]$)
    - Edge relaxation equation: $\text{dist}[u] + c(u, v) < \text{dist}[v]$
    - Tentative distance updates highlighted in real-time.
    - Play / Pause / Step Controls with adjustable playback speed.
- **Distance-Vector Routing (Bellman-Ford)**:
  - Distributed local exchange paradigm based on $D_x(y) = \min_v \{ c(x, v) + D_v(y) \}$.
  - Interactive **Round-by-Round Viewer** demonstrating how multi-hop routes are learned across iteration rounds until network convergence.

### 3. Comprehensive Routing Tables
- Every router computes and stores a standard Computer Networks routing table:
  - **Destination Router & Subnet IP** (e.g. `10.0.4.1`)
  - **Next-Hop Router** (e.g. `R2` or `Local / Direct`)
  - **Metric / Cost**
  - **Outgoing Interface** (`eth0`, `eth1`, `lo0`)
  - **Status** (`Reachable`, `Unreachable`)
- Click **"Routing Tables"** in the top navigation or click any router to inspect its live routing table.

### 4. Animated Packet Forwarding Simulation
- Click **"Send Packet (Simulate Flow)"** to observe a virtual packet hop from router to router along the computed shortest path.
- **Packet Telemetry HUD**:
  - Live Packet ID (e.g., `PKT-4102`)
  - Source IP & Destination IP
  - Current Hop & Next Hop
  - Real-time TTL (Time-To-Live) decrementing at each hop
  - Protocol Payload (`IPv4 Data`)
  - Confetti celebration upon successful destination arrival!

### 5. Fault Tolerance & Dynamic Rerouting (Section 24)
- **One-Click Demo Failure**: Click **"Execute Demo Failure (Kill R2 ↔ R4)"**.
- **Visual Failure States**: Failed links render with red dashed strokes and `✕` badges; failed routers become dark red with offline status.
- **Dynamic Recalculation Alert**:
  - Displays previous route vs newly calculated alternative route:
    - *Original Route:* $R_1 \to R_2 \to R_4 \to R_5$ (Cost: 9)
    - *Link $R_2 \leftrightarrow R_4$ Fails*
    - *Recalculated Route:* $R_1 \to R_3 \to R_4 \to R_5$ (Cost: 13)
- Handles network partitioning by flagging destinations as **Unreachable**.

### 6. Side-by-Side Algorithm Benchmark
- Benchmark modal comparing Link-State vs Distance-Vector:
  - Computational complexity ($O((V+E)\log V)$ vs $O(V \cdot E)$)
  - Convergence speed & rounds required
  - Message exchange overhead
  - Empirical execution time measured in milliseconds

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Vanilla CSS with modern cyber-dark glassmorphism design system
- **Typography**: Outfit, Inter, JetBrains Mono
- **Icons**: Lucide React
- **Celebration Effects**: Canvas Confetti

---

## 💻 Running Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation & Launch
```bash
# Clone or navigate to the project directory
cd "c:\Users\tejas\CN Mini Djisitkra"

# Install dependencies
npm install

# Start the Vite development server
npm run dev

# Open in browser
http://127.0.0.1:5173/
```

### Production Build
```bash
npm run build
npm run preview
```

### Automated Algorithm Test Suite
Run the built-in routing test suite verifying Dijkstra, Bellman-Ford, link failure rerouting, routing tables, and partition detection:
```bash
npx -y tsx test_routing.ts
```

---

## 🎓 Classroom & Viva Demonstration Guide

1. **Step 1 - Stable Network**: Open RouteLab. Note the 5 routers ($R_1 \dots R_5$). Observe the highlighted path from $R_1$ to $R_5$ ($R_1 \to R_2 \to R_4 \to R_5$, Cost 9).
2. **Step 2 - Dijkstra Stepper**: Click **"Step Debugger"**. Walk through the relaxation steps to demonstrate how Dijkstra greedily chooses minimum distance nodes and updates tentative distances.
3. **Step 3 - Packet Transit**: Click **"Send Packet"**. Watch the packet physically move between routers and note the TTL decreasing.
4. **Step 4 - Link Failure**: In the Chaos Lab, click **"Execute Demo Failure (Kill R2 ↔ R4)"**. Observe the link turn red, the event log register the failure, and the route instantaneously adapt to $R_1 \to R_3 \to R_4 \to R_5$.
5. **Step 5 - Distance-Vector**: Switch protocol to **Distance-Vector** and click **Step Debugger** to explain routing vector exchanges and convergence rounds.
6. **Step 6 - Routing Tables**: Open **"Routing Tables"** to demonstrate next-hop routing principles.
