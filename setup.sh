#!/bin/bash

echo "StormHacks Setup Script"
echo "======================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    echo "Please install Node.js from: https://nodejs.org/"
    echo "Then run this script again"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd frontend
npm install

echo "✅ Setup complete!"
echo "To start the app:"
echo "Backend: cd backend && python app.py"
echo "Frontend: cd frontend && npm start"