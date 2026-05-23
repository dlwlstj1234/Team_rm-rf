#!/bin/bash

echo "Stopping backend server..."

pkill -f "uvicorn main:app"

echo "Stopping frontend server..."

pkill -f "vite"
pkill -f "npm run dev"

rm -f /home/pjpark/바탕화면/Team_rm-rf/lol-court-backend/backend.pid
rm -f /home/pjpark/바탕화면/Team_rm-rf/front_end/frontend.pid

echo "All servers stopped."

echo "Checking ports..."
ss -tulnp | grep -E "8000|5173"
