# --- Stage 1: Build React Frontend ---
FROM node:22-alpine AS frontend-builder
WORKDIR /app

# Vite inlines these into the JS bundle at build time, so they must be
# passed in as build args here — setting them as runtime env vars on the
# Render service has no effect on the already-built bundle.
ARG VITE_API_URL=/api
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY package*.json ./
RUN npm install
COPY . .
# Build the React frontend with Vite (outputs to /app/dist)
RUN npm run build

# --- Stage 2: Run Python/Django Backend ---
FROM python:3.9-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies needed for compiling database adapters (PostgreSQL)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy python dependencies and install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend codebase
COPY backend/ ./backend/

# Copy built frontend assets from Stage 1 into the folder Django expects
COPY --from=frontend-builder /app/dist ./dist/

WORKDIR /app/backend

# Run collectstatic so Django/WhiteNoise can collect all static files to staticfiles/
RUN python manage.py collectstatic --noinput

# Expose port (Render will override $PORT env var)
EXPOSE 8000

# Apply database migrations (DATABASE_URL is only available at container
# runtime, not at image build time) then start Daphne ASGI server to
# handle both HTTP and WebSocket traffic
CMD python manage.py migrate --noinput && daphne -b 0.0.0.0 -p $PORT backend.asgi:application
