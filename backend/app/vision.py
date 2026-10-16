import os, time, threading
from tempfile import NamedTemporaryFile
from fastapi import HTTPException

_model = None
_lock = threading.Lock()


def detector():
    global _model
    if os.getenv("VISION_ENABLED", "false").lower() != "true":
        raise HTTPException(503, detail="vision_not_configured")
    try:
        if _model is None:
            from ultralytics import YOLO

            _model = YOLO(os.getenv("YOLO_MODEL", "yolo11n.pt"))
        return _model
    except Exception:
        raise HTTPException(503, detail="vision_unavailable")


def analyze_image(content):
    import cv2, numpy as np

    frame = cv2.imdecode(np.frombuffer(content, dtype=np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(422, detail="invalid_file")
    if frame.shape[0] * frame.shape[1] > 12000000:
        raise HTTPException(422, detail="frame_too_large")
    with _lock:
        model = detector()
        start = time.perf_counter()
        result = model.predict(frame, classes=[0], conf=0.45, verbose=False, imgsz=640)[
            0
        ]
    boxes = [
        {
            "box": [round(float(v), 4) for v in b.xyxyn[0]],
            "confidence": round(float(b.conf[0]), 3),
        }
        for b in result.boxes
    ]
    return {
        "person_count": len(boxes),
        "boxes": boxes,
        "inference_ms": round((time.perf_counter() - start) * 1000),
        "measurement": "live",
        "entry_exit_available": False,
        "queue_available": False,
    }


def analyze_video(content, suffix):
    import cv2

    if suffix not in (".mp4", ".webm", ".mov"):
        raise HTTPException(415, detail="unsupported_format")
    path = None
    try:
        with NamedTemporaryFile(suffix=suffix, delete=False) as f:
            f.write(content)
            path = f.name
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            raise HTTPException(422, detail="invalid_file")
        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        samples = []
        index = 0
        limit = 60
        while len(samples) < limit:
            ok, frame = cap.read()
            if not ok:
                break
            if index % max(1, int(fps)) == 0:
                ok, encoded = cv2.imencode(".jpg", frame)
                if ok:
                    result = analyze_image(encoded.tobytes())
                    samples.append(
                        {
                            "second": round(index / fps, 1),
                            "person_count": result["person_count"],
                        }
                    )
            index += 1
        cap.release()
        if not samples:
            raise HTTPException(422, detail="invalid_file")
        return {
            "samples": samples,
            "person_count": samples[-1]["person_count"],
            "peak_occupancy": max(s["person_count"] for s in samples),
            "measurement": "uploaded_video",
            "sample_limit": 60,
            "entry_exit_available": False,
            "queue_available": False,
        }
    finally:
        if path and os.path.exists(path):
            os.unlink(path)
