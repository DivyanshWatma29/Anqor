import os
from getpass import getpass
from huggingface_hub import HfApi

print("--- Hugging Face Spaces Direct Uploader ---")
print("We are bypassing Git to upload the ML models directly.\n")

token = getpass("Please paste your Hugging Face Access Token (input is hidden): ")
if not token.strip():
    print("Error: Token cannot be empty.")
    exit(1)

api = HfApi(token=token.strip())
repo_id = "divyansh123467/fraud-shield-ml"

try:
    print(f"\nUploading files from current directory to {repo_id}...")
    api.upload_folder(
        folder_path=".",
        repo_id=repo_id,
        repo_type="space",
        ignore_patterns=[".git", "__pycache__", ".ipynb_checkpoints", "upload_to_hf.py"]
    )
    print("\n✅ Upload successful! Your Hugging Face Space is now building.")
except Exception as e:
    print(f"\n❌ Upload failed: {e}")
