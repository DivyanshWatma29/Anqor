## 2024-05-01 - Error Handling Exposing Internal Information
**Vulnerability:** In `ml-service/app.py`, the `predict` endpoint returns `str(e)` in the error response when an exception occurs.
**Learning:** This could expose internal application logic or stack traces to an attacker if an unhandled error happens.
**Prevention:** Catch generic exceptions and return generic error messages to the client, while logging the actual exception (with stack trace) on the server.
