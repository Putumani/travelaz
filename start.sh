#!/bin/bash

# Clean up any existing X server lock files
rm -f /tmp/.X99-lock

# Start Xvfb in the background
Xvfb :99 -screen 0 1280x1024x24 -ac +extension GLX +render -noreset &

# Wait for Xvfb to start
sleep 2

# Start the Flask application
exec python app.py