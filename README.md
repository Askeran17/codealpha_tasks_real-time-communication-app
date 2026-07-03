# SyncSpace - Real-Time Video Conferencing & Collaboration Tool

SyncSpace is a secure, real-time video calling and collaboration platform built with React, Django Channels (WebSockets), and WebRTC. It supports multi-user video calling, screen sharing, a shared real-time whiteboard, and end-to-end encrypted (E2EE) messaging and file sharing.

---

## 🚀 Key Features

* **Multi-User Video Calling:** HD audio/video streaming powered by WebRTC mesh architecture.
* **Screen Sharing:** Instant screen sharing directly integrated into WebRTC peer tracks.
* **End-to-End Encrypted Chat:** Private text chat secured client-side via **AES-GCM (256-bit)**. Keys are derived dynamically using the Web Crypto API based on the Room ID, ensuring the server only sees encrypted ciphertexts.
* **Secure File Sharing:** Files are encrypted client-side before upload, stored securely on the backend, and decrypted dynamically upon download by valid room participants.
* **Live Synchronized Whiteboard:** A multiplayer canvas enabling collaborative drawing and writing synchronized in real-time via WebSockets.
* **Secure Authentication:** User sign-up and log-in powered by Django REST Framework Token Authentication.

---

## 🛠️ Technology Stack

### Frontend
* **Core:** React 19, TypeScript, Vite
* **Styling:** Vanilla CSS & Tailwind CSS v4, Lucide Icons
* **UI Components:** Radix UI primitives & Shadcn UI design patterns
* **Security:** Web Crypto API (SubtleCrypto) for AES-GCM encryption/decryption

### Backend
* **Core:** Django 4.2, Python 3.9
* **API Engine:** Django REST Framework (DRF)
* **Real-time Server:** Django Channels (ASGI routing)
* **ASGI Server:** Daphne
* **Database:** SQLite (Development) / PostgreSQL via Neon (Production)
* **Static Assets:** WhiteNoise (configured for Monolithic Docker deployment)

---

## 💻 Local Development Setup

To run this project locally, you will need to start both the React frontend and the Django backend.

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations to initialize the SQLite database:
   ```bash
   python manage.py migrate
   ```
5. Start the backend development server using Daphne (to support WebSockets):
   ```bash
   daphne -b 127.0.0.1 -p 8000 backend.asgi:application
   ```

### Frontend Setup

1. Navigate back to the project root directory.
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173/`.

---

## 🐳 Docker & Production Deployment (Render)

This project is optimized to run as a **monolith Docker container**. It builds the React frontend, places it inside Django, runs Django's `collectstatic` command, and serves both static files and ASGI WebSockets using a single container.

### Step 1: Render Setup

1. Create a free **PostgreSQL Database** on [Neon.tech](https://neon.tech/) and copy the connection string.
2. Create a new **Web Service** on Render pointing to your Git repository.
3. Choose the **Docker** runtime. (Render will automatically detect the root `Dockerfile`).

### Step 2: Environment Variables
Add the following variables to your Render Web Service environment configurations:

* `DATABASE_URL`: `postgresql://your-neon-db-url`
* `DJANGO_SETTINGS_MODULE`: `backend.settings`
* `VITE_API_URL`: `/api`
* `VITE_WS_URL`: `wss://your-render-app-name.onrender.com/ws`

During the build process, the multi-stage Docker setup will build the React files with the correct production URL prefixes and package them into Python's static distribution system.
