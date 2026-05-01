# Code Health Improvement: Broad Exception Handling

## 🎯 What
Addressed the broad exception handling issue in `ml-service/core/preprocessor.py`. Specifically, replaced the generic `except Exception as e:` blocks used during model loading (`joblib.load()`) with a more specific set of exceptions: `(FileNotFoundError, EOFError, ValueError, ImportError, KeyError)`.

## 💡 Why
Catching `Exception` is considered a bad practice (often called "pokemon exception handling" - gotta catch 'em all). It can accidentally catch critical system errors like `KeyboardInterrupt`, `MemoryError`, or `SystemExit` which should usually be allowed to bubble up and terminate the application. Furthermore, it hides unintended errors (like simple typos resulting in a `NameError`) and makes debugging significantly harder. By explicitly listing the expected exceptions (e.g. `FileNotFoundError` if a file is missing, `EOFError` or `ValueError` for corrupt or invalid joblib/pickle files, `ImportError` if a pickled model relies on an unknown module), we ensure the application only recovers from known, recoverable failures while surfacing unexpected issues for debugging.

## ✅ Verification
Verified the syntax using Python's `py_compile` and tested the file import via a script mocking the `joblib` and `pandas` dependencies. The file loads and logs correctly.

## ✨ Result
The codebase is now safer and more maintainable. Unexpected errors during model loading will bubble up instead of being silently logged as a model loading failure, improving the clarity of debugging and robustness of the service.
