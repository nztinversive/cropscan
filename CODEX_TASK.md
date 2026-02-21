# Task: Add POST /api/analyze route

Create `src/app/api/analyze/route.ts` for CropScan image analysis.

## Requirements

1. Accept multipart form data with an `image` file and optional `fieldId` string
2. Save uploaded image to a temp file (use `os.tmpdir()` + uuid filename)
3. Check if model file exists at path from `process.env.MODEL_PATH` or `./model/best.pt`
4. If model exists, run YOLO inference by spawning a Python process:
   - Command: `py scripts/infer.py <image_path>`
   - Parse JSON stdout as detections array
5. If model does NOT exist, return mock detections:
   - 3 sample detections: nutrient_deficiency (conf 0.87), weed_cluster (conf 0.73), water (conf 0.65)
   - Each with random bbox coordinates within 512x512
6. Return JSON: `{success: true, detections: [{class, confidence, bbox}], summary: {total, byClass: {className: count}}}`
7. Clean up temp file after processing

Also create `scripts/infer.py`:
```python
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
```

Use Node `child_process.execSync` for the Python call. No new npm deps needed. Use `import { writeFile, unlink } from 'fs/promises'` and `NextRequest`/`NextResponse` from next/server.
