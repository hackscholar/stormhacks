#!/bin/bash

echo "=================================================="
echo "StormHacks Project Persistence Setup"
echo "=================================================="

# Navigate to backend directory
cd backend

echo "1. Installing Python dependencies..."
pip install -r ../requirements.txt

echo "2. Initializing database..."
python init_database.py

echo "3. Starting backend server..."
echo "   Server will start on http://127.0.0.1:5001"
echo "   Press Ctrl+C to stop the server"
echo ""
echo "To test persistence, run in another terminal:"
echo "   cd backend && python test_persistence.py"
echo ""

python app.py