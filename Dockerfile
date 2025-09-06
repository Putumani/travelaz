# Use a slim Python base image
FROM python:3.9-slim

# Install system dependencies for Chrome
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    libglib2.0-0 \
    libnss3 \
    libfontconfig1 \
    libx11-6 \
    libx11-xcb1 \
    libxi6 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxtst6 \
    libatk1.0-0 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    fonts-liberation \
    xvfb \
    xauth \
    && rm -rf /var/lib/apt/lists/*

# Download and install Chrome manually
RUN wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get update \
    && apt-get install -y /tmp/chrome.deb \
    && rm /tmp/chrome.deb \
    && rm -rf /var/lib/apt/lists/*

# Add debugging to verify Chrome installation
RUN google-chrome --version

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Debug installed Python packages
RUN pip list

# Copy application code
COPY . .

# Expose port (Render uses 10000 by default)
EXPOSE 10000

# Set environment variable for Flask
ENV PORT=10000
ENV DISPLAY=:99
ENV HEADLESS=false  

# Run the Flask application with Xvfb for GUI support
CMD Xvfb :99 -screen 0 1920x1080x24 -ac +extension GLX +render -noreset & \
    python app.py