#!/bin/bash

ROOT="/home/pjpark/바탕화면/Team_rm-rf"
BACKEND="$ROOT/lol-court-backend"
FRONTEND="$ROOT/front_end"

BACKEND_PID="$BACKEND/backend.pid"
FRONTEND_PID="$FRONTEND/frontend.pid"

echo "Starting servers..."

# 백엔드 실행 여부 확인
if [ -f "$BACKEND_PID" ] && kill -0 $(cat "$BACKEND_PID") 2>/dev/null; then
    echo "Backend already running. PID: $(cat "$BACKEND_PID")"
else
    echo "Starting backend..."

    rm -f "$BACKEND_PID"

    cd "$BACKEND" || exit 1

    if [ -f ".env" ]; then
        set -a
        source .env
        set +a
    else
        echo ".env file not found."
        exit 1
    fi

    cd "$ROOT" || exit 1
    source venv/bin/activate

    cd "$BACKEND" || exit 1
    mkdir -p logs

    nohup uvicorn main:app --host 0.0.0.0 --port 8000 > logs/backend.log 2>&1 &

    echo $! > "$BACKEND_PID"

    echo "Backend started. PID: $(cat "$BACKEND_PID")"
    echo "Backend log: $BACKEND/logs/backend.log"
fi


# 프론트엔드 실행 여부 확인
if [ -f "$FRONTEND_PID" ] && kill -0 $(cat "$FRONTEND_PID") 2>/dev/null; then
    echo "Frontend already running. PID: $(cat "$FRONTEND_PID")"
else
    echo "Starting frontend..."

    rm -f "$FRONTEND_PID"

    cd "$FRONTEND" || exit 1
    mkdir -p logs

    nohup npm run dev -- --host 0.0.0.0 > logs/frontend.log 2>&1 &

    echo $! > "$FRONTEND_PID"

    echo "Frontend started. PID: $(cat "$FRONTEND_PID")"
    echo "Frontend log: $FRONTEND/logs/frontend.log"
fi


echo "Done."
echo "Backend:  http://localhost:8000/docs"
echo "Frontend: http://localhost:5173"
