"""
Upload the ml-service folder to HuggingFace Spaces.
Requires HF_TOKEN environment variable with write access.

Usage:
    export HF_TOKEN=hf_xxxxx
    python scripts/push_hf.py
"""
import os
from huggingface_hub import HfApi

token = os.environ.get("HF_TOKEN")
if not token:
    raise ValueError("Set HF_TOKEN environment variable. Get yours at https://huggingface.co/settings/tokens")

api = HfApi(token=token)
repo_id = "divyansh123467/fraud-shield-ml"
ml_service_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

print(f"Uploading {ml_service_dir} to {repo_id}...")
try:
    api.upload_folder(
        folder_path=ml_service_dir,
        repo_id=repo_id,
        repo_type="space",
        ignore_patterns=[
            ".git", "__pycache__", "*.pyc", ".ipynb_checkpoints",
            "scripts/push_hf.py", "scripts/upload_to_hf.py", "scripts/upload_clean.py",
            "notebooks/*", "data/*", "venv/*", ".venv/*",
        ],
        commit_message="feat: Anqor ML backend v3.1 — SHAP, fraud explanations, 5 models"
    )
    print("✅ Upload complete! Space is now building at:")
    print(f"   https://huggingface.co/spaces/{repo_id}")
except Exception as e:
    print(f"❌ Upload failed: {e}")
