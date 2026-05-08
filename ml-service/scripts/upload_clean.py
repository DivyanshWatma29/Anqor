from huggingface_hub import HfApi
import os

api = HfApi()
repo_id = "DivyanshWatma29/Anqor"
token = os.environ.get("HF_TOKEN")
if not token:
    raise ValueError("Set HF_TOKEN environment variable")

ml_service_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
models_dir = os.path.join(ml_service_dir, "models")

print(f"Uploading models to {repo_id}...")
api.upload_folder(
    folder_path=models_dir,
    path_in_repo="models",
    repo_id=repo_id,
    repo_type="space",
    token=token
)
print("Models uploaded successfully!")
