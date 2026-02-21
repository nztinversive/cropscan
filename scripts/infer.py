import sys, json
from ultralytics import YOLO
import os

model_path = os.environ.get("MODEL_PATH", "./model/best.pt")
image_path = sys.argv[1]
model = YOLO(model_path)
results = model(image_path, imgsz=512)
detections = []
for box in results[0].boxes:
    detections.append({
        "class": model.names[int(box.cls)],
        "confidence": round(float(box.conf), 4),
        "bbox": [round(float(x), 1) for x in box.xyxy[0]]
    })
print(json.dumps(detections))
