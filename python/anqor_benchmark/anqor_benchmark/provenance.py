"""Small provenance helpers for reproducible ML evaluation artifacts."""

from hashlib import sha256
from pathlib import Path


def sha256_file(path: str | Path, chunk_size: int = 1024 * 1024) -> str:
    file_path = Path(path)
    if not file_path.is_file():
        raise FileNotFoundError(file_path)
    digest = sha256()
    with file_path.open("rb") as handle:
        while chunk := handle.read(chunk_size):
            digest.update(chunk)
    return digest.hexdigest()


def artifact_record(path: str | Path) -> dict[str, str | int]:
    file_path = Path(path)
    return {
        "name": file_path.name,
        "path": str(file_path),
        "size_bytes": file_path.stat().st_size,
        "sha256": sha256_file(file_path),
    }
