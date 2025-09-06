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
    && rm -rf /var/lib/apt/lists/*

# Download and install a specific Chrome version
RUN wget -q -O /tmp/chrome.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_140.0.7339.80-1_amd64.deb \
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

# Copy application code
COPY . .

# Expose port (Render uses 10000 by default)
EXPOSE 10000

# Set environment variables
ENV PORT=10000
ENV DISPLAY=:99
ENV HEADLESS=true  
ENV PYTHONUNBUFFERED=1

# Use a startup script to manage Xvfb and application
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]