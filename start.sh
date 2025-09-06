#!/bin/bash

# Clean up any existing X server lock files
rm -f /tmp/.X99-lock

# Clean up any Chrome temp directories
rm -rf /tmp/chrome-data-*
rm -rf /tmp/chrome-singleton

# Kill any existing Chrome processes (clean start)
pkill -f chrome || true
pkill -f chromedriver || true

# Start Xvfb in the background
Xvfb :99 -screen 0 1280x1024x16 -ac +extension GLX +render -noreset &

# Wait for Xvfb to start
sleep 2

# Start the Flask application
exec python app.py