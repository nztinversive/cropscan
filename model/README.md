# Model Directory

This directory is reserved for the trained YOLO model files.

## Expected Files

- `best.pt` - The trained YOLOv11 model weights (when training is complete)

## TODO

Training is still in progress. When the model file `best.pt` becomes available from the cropscan-model training, it should be copied here to enable real YOLO inference instead of mock detections.

## Training Status

The model is being trained on Agriculture-Vision dataset with 8 classes:
- cloud_shadow
- double_plant  
- planter_skip
- standing_water
- waterway
- weed_cluster
- nutrient_deficiency
- storm_damage

Current status: Training in progress at `C:\Users\Atlas-playground\Projects\cropscan-model\`