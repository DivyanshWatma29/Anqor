import os
from huggingface_hub import HfApi

# Use the token you provided previously in the context
token = "your_token_here"
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
