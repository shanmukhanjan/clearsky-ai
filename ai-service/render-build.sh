#!/usr/bin/env bash
# exit on error
set -o errexit

pip install -r requirements.txt

# Any additional build steps (like downloading model weights if they weren't in git)
# For this project, the models are in the repo, so we just ensure they exist.
if [ ! -f "model/global_xgb_24h.json" ]; then
  echo "Warning: Model files not found. Initializing with empty or fallback if needed."
fi
