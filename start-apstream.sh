#!/data/data/com.termux/files/usr/bin/bash

echo "================================="
echo "       AP-STREAM STARTING"
echo "================================="

# Stop old processes using our ports
pkill -f "vite.*5173" 2>/dev/null
pkill -f "node.*index.js" 2>/dev/null

# Start MediaMTX inside Ubuntu
echo "Starting MediaMTX..."
proot-distro login ubuntu -- bash -c '
cd ~/apstream-streaming
nohup ./mediamtx mediamtx.yml > ~/mediamtx.log 2>&1 &
'

sleep 2

# Start AP-STREAM backend
echo "Starting backend..."
cd ~/AP-STREAM/backend
nohup node index.js > backend.log 2>&1 &

sleep 2

# Start AP-STREAM frontend
echo "Starting frontend..."
cd ~/AP-STREAM/frontend
nohup npm run dev -- --host 0.0.0.0 > frontend.log 2>&1 &

sleep 4

echo ""
echo "================================="
echo "       AP-STREAM IS RUNNING"
echo "================================="
echo ""
echo "Frontend:"
echo "http://127.0.0.1:5173/"
echo ""
echo "Backend:"
echo "http://127.0.0.1:5000/"
echo ""
echo "TV/Radio:"
echo "MediaMTX HLS :8888"
echo "MediaMTX WebRTC :8889"
echo ""
echo "Logs:"
echo "~/AP-STREAM/frontend/frontend.log"
echo "~/AP-STREAM/backend/backend.log"
echo "~/mediamtx.log"
echo "================================="
