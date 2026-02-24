#!/bin/bash
# Download YOLO model weights from GitHub Release for Render deploy
MODEL_URL="https://github.com/nztinversive/cropscan/releases/download/v1.0/best.pt"
MODEL_DIR="./model"
MODEL_PATH="$MODEL_DIR/best.pt"

mkdir -p "$MODEL_DIR"

if [ ! -f "$MODEL_PATH" ]; then
  echo "Downloading CropScan v1 model weights..."
  curl -L -o "$MODEL_PATH" "$MODEL_URL"
  echo "Model downloaded: $(du -h "$MODEL_PATH" | cut -f1)"
else
  echo "Model already exists at $MODEL_PATH"
fi
