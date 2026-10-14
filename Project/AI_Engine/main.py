import cv2
import asyncio
import threading
import torch
import requests
import time
from urllib.parse import unquote
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI(title="SENTINEL AI Engine Turbo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[SENTINEL AI] Hardware Acceleration: {DEVICE}")

# Load YOLOv8s optimized for speed
model = YOLO("yolov8s.pt")
model.to(DEVICE)

class ActiveCamera:
    def __init__(self, src):
        self.src = int(src) if str(src).isdigit() else str(src)
        self.cap = cv2.VideoCapture(self.src)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.latest_frame = None
        self.running = True
        self.lock = threading.Lock()
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()

    def _capture_loop(self):
        while self.running:
            if not self.cap.isOpened():
                self.cap.open(self.src)
                threading.Event().wait(0.5)
                continue
            success, frame = self.cap.read()
            if success:
                with self.lock:
                    self.latest_frame = frame
            else:
                threading.Event().wait(0.01)
                if isinstance(self.src, str):
                    self.cap.release()
                    self.cap.open(self.src)

    def get_latest_frame(self):
        with self.lock:
            if self.latest_frame is not None:
                return self.latest_frame.copy()
            return None

    def stop(self):
        self.running = False
        if self.cap.isOpened():
            self.cap.release()

def log_breach_event(camera_name, identity, confidence, behavior_desc, track_id):
    payload = {
        "cameraName": camera_name,
        "identity": f"{identity} [ID: #{track_id}]",
        "confidence": int(confidence * 100),
        "behavior": f"Perimeter violation verified. Object ID #{track_id} detected: {behavior_desc}.",
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ')
    }
    try:
        requests.post("http://localhost:5000/api/logs/breach", json=payload, timeout=1.0)
    except Exception as e:
        print(f"[DB ERROR] Sync failed: {e}")

class CameraStreamManager:
    def __init__(self):
        self.streams = {}
        self.lock = threading.Lock()

    def get_stream(self, source):
        with self.lock:
            if source not in self.streams:
                self.streams[source] = ActiveCamera(source)
            return self.streams[source]

camera_manager = CameraStreamManager()

@app.websocket("/ws/stream/{camera_id}")
async def video_stream(websocket: WebSocket, camera_id: str):
    await websocket.accept()

    query_url = websocket.query_params.get("url")
    if camera_id == "cam_local_01":
        source = 0
    elif query_url:
        source = unquote(query_url)
    else:
        await websocket.close()
        return

    cam = camera_manager.get_stream(source)
    latest_detections = []
    is_inferring = False
    breach_cooldown = {}

    def run_inference(frame_to_process, target_w, target_h):
        nonlocal latest_detections, is_inferring
        try:
            # Optimized inference resolution (512px) for maximum FPS without losing accuracy
            infer_frame = cv2.resize(frame_to_process, (512, 512))
            
            results = model.track(
                infer_frame, 
                persist=True, 
                tracker="botsort.yaml", 
                conf=0.3, 
                iou=0.45, 
                classes=[0], 
                verbose=False, 
                device=DEVICE
            )

            scale_x = target_w / 512.0
            scale_y = target_h / 512.0

            dets = []
            for r in results:
                boxes = r.boxes
                for i, box in enumerate(boxes):
                    conf = float(box.conf[0])
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    track_id = int(box.id[0]) if box.id is not None else (i + 100)
                    
                    scaled_x1 = round(x1 * scale_x, 1)
                    scaled_y1 = round(y1 * scale_y, 1)
                    scaled_x2 = round(x2 * scale_x, 1)
                    scaled_y2 = round(y2 * scale_y, 1)

                    dets.append({
                        "bbox": [scaled_x1, scaled_y1, scaled_x2, scaled_y2],
                        "confidence": round(conf, 2),
                        "track_id": track_id,
                        "label": f"ID #{track_id}"
                    })
            latest_detections = dets
        except Exception as e:
            print(f"[Inference Error]: {e}")
        finally:
            is_inferring = False

    try:
        while True:
            frame = cam.get_latest_frame()
            if frame is None:
                await asyncio.sleep(0.01)
                continue

            orig_h, orig_w = frame.shape[:2]
            target_w = 640
            target_h = int((target_w / orig_w) * orig_h)
            display_frame = cv2.resize(frame, (target_w, target_h))

            # Trigger background inference without blocking the live stream loop
            if not is_inferring:
                is_inferring = True
                threading.Thread(
                    target=run_inference,
                    args=(display_frame, target_w, target_h),
                    daemon=True
                ).start()

            success, buffer = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if not success:
                continue

            await websocket.send_bytes(buffer.tobytes())
            await websocket.send_json({
                "camera_id": camera_id,
                "detections": latest_detections,
                "frame_size": [target_w, target_h]
            })

            # High refresh loop (~30 FPS smooth transmission)
            await asyncio.sleep(0.015)

    except WebSocketDisconnect:
        print(f"[SENTINEL AI] Disconnected: {camera_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)