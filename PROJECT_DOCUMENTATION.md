# AMEP Education System — Technical Documentation

Welcome to the **Adaptive Multimedia Education Platform (AMEP)**. This document provides a comprehensive overview of the architecture, stack, and core functionalities of the project.

---

## 🚀 1. The Core Objective
AMEP is designed to bridge the gap between static online learning and teacher oversight. It provides a personalized student interface for learning (Basic Python Course) and a dynamic, data-driven dashboard for teachers to monitor student performance in real-time.

---

## 🛠️ 2. Technology Stack

### **Frontend**
- **Core Architecture**: Vanilla HTML5, Modern CSS (Tailwind CSS framework), and Modular JavaScript.
- **Visual Language**: Material Symbols for iconography and a "Light Mode" aesthetic using the AMEP design system.
- **State Management**: Uses `localStorage` for immediate student feedback and session persistence.
- **Data Rendering**: Dynamic DOM manipulation using `fetch()` to consume backend APIs.

### **Backend**
- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Authentication**: JSON Web Token (JWT) based secure auth flow with custom middleware.
- **Validation**: `express-validator` for request sanitization.

### **Database & Infrastructure**
- **Primary DB**: **Supabase (PostgreSQL)** for robust, scalable relational data.
- **ORM-lite**: A custom `SupabaseModel.js` wrapper to provide a Mongoose-like interaction with the Supabase client.

---

## 📂 3. Project Structure

```text
INFINITY/
├── backend/                  # Node.js Express Server
│   ├── controllers/         # Business logic (Teacher stats, Auth, etc)
│   ├── models/              # Schema-like mappings to Supabase tables
│   ├── routes/              # API URL endpoint definitions
│   ├── middleware/          # JWT auth & error handlers
│   └── server.js            # Entry point of the API
├── frontend/                 # Client-side Application
│   ├── js/                  # Course logic, Auth sync, UI controllers
│   ├── images/              # Assets and logos
│   ├── index.html           # Student Landing Page
│   └── teacher_dashboard.html # Dynamic Teacher Control Center
└── .env                     # Environment Config (DB keys, etc)
```

---

## 🔄 4. How Student Progress Syncing Works

The most critical technical achievement of this project is the **Local-to-Cloud Sync**:

1. **Student Progress**: When a student completes a lesson quiz in `python_course.js`, the data is saved to the browser's `localStorage` for zero-latency UI updates.
2. **Background Sync**: An asynchronous `fetch()` call is triggered to a custom endpoint `/api/teacher/sync-progress`.
3. **Data Aggregation**: The backend receives the quiz score, the day completed, and the time taken. It then updates:
   - The `results` table (historical scores).
   - The `student_profiles` table (total study time).
   - The `users` table (last active timestamp).
4. **Teacher Visibility**: The next time the Teacher Dashboard is refreshed, it queries these tables to recalculate "At-Risk" flags, engagement scores, and mastery percentages.

---

## 📊 5. Teacher Dashboard Functions

The dashboard isn't just a table; it's an analytics engine:

- **At-Risk Detection**: Students with scores below 60% or no recent activity are automatically flagged in red.
- **Dynamic Filtering**: Teachers can filter data by grade or subject without reloading the page.
- **Engagement Heatmaps**: Visual representation of class activity distributions.
- **Notification System**: Teachers can directly message students from the table, which persists to the database.

---

## ⚙️ 6. Setup & Execution

### **Prerequisites**
- Node.js (v18+)
- Supabase account and access keys.

### **Running the Server**
1. Navigate to the `backend` folder.
2. Install dependencies: `npm install`
3. Start dev mode: `npm run dev`

### **Running the Frontend**
- Open `frontend/index.html` using a local server (like VS Code Live Server) to prevent CORS issues.

---

*Last Updated: April 5, 2026*
