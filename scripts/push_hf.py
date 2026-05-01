import os
from huggingface_hub import HfApi

# Use the token from the environment variable
token = os.getenv("HF_TOKEN")
if not token:
    raise ValueError("HF_TOKEN environment variable not set")

api = HfApi(token=token)

repo_id = "divyansh123467/fraud-shield-ml"
folder_path = "/home/divyansh/Desktop/INS/fraud.ai/ml-service"

print(f"Uploading {folder_path} to {repo_id}...")
try:
    api.upload_folder(
        folder_path=folder_path,
        repo_id=repo_id,
        repo_type="space",
        commit_message="feat: ml pipeline overhaul and property/life expansion"
    )
    print("Upload complete!")
except Exception as e:
    print(f"Upload failed: {e}")
