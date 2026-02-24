"""CropScan YOLO — Crop disease detection for Replicate."""

import json
from typing import Optional

from cog import BaseModel, BasePredictor, Input, Path
from ultralytics import YOLO


# Healthy leaf classes (don't count as disease)
HEALTHY_CLASSES = {
    "Apple leaf", "Bell_pepper leaf", "Blueberry leaf", "Cherry leaf",
    "Peach leaf", "Potato leaf", "Raspberry leaf", "Soyabean leaf",
    "Strawberry leaf", "Tomato leaf", "grape leaf",
}


class Output(BaseModel):
    """Output model for predictions."""
    image: Optional[Path] = None
    json_str: Optional[str] = None


class Predictor(BasePredictor):
    """YOLO crop disease detection predictor."""

    def setup(self) -> None:
        """Load YOLO model trained on PlantDoc dataset."""
        self.model = YOLO("best.pt")

    def predict(
        self,
        image: Path = Input(description="Aerial or field image of crops to analyze"),
        conf: float = Input(description="Confidence threshold", default=0.25, ge=0.0, le=1.0),
        iou: float = Input(description="IoU threshold for NMS", default=0.45, ge=0.0, le=1.0),
        imgsz: int = Input(
            description="Image size", default=640, choices=[320, 416, 512, 640, 832, 1024, 1280]
        ),
        return_json: bool = Input(description="Return detection results as JSON", default=True),
    ) -> Output:
        """Run crop disease detection on an image."""
        import shutil
        # Ensure image has proper extension (Cog downloads without one)
        img_path = str(image)
        if not any(img_path.lower().endswith(ext) for ext in ('.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tif', '.tiff')):
            new_path = img_path + ".jpg"
            shutil.copy2(img_path, new_path)
            img_path = new_path

        result = self.model(img_path, conf=conf, iou=iou, imgsz=imgsz)[0]
        image_path = "output.png"
        result.save(image_path)

        if return_json:
            detections = []
            for box in result.boxes:
                cls_name = self.model.names[int(box.cls)]
                is_healthy = cls_name in HEALTHY_CLASSES
                detections.append({
                    "class": cls_name,
                    "confidence": round(float(box.conf), 4),
                    "bbox": [round(float(x), 1) for x in box.xyxy[0]],
                    "is_healthy": is_healthy,
                })

            # Health score: 100 minus penalty for disease detections
            disease_detections = [d for d in detections if not d["is_healthy"]]
            penalty = sum(d["confidence"] * 8 for d in disease_detections)
            health_score = round(max(0, min(100, 100 - penalty)), 2)

            return Output(
                image=Path(image_path),
                json_str=json.dumps({
                    "detections": detections,
                    "count": len(detections),
                    "disease_count": len(disease_detections),
                    "health_score": health_score,
                    "classes": list(set(d["class"] for d in detections)),
                })
            )
        return Output(image=Path(image_path))
