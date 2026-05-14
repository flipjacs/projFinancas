/**
 * Shape returned by the FastAPI error_handler middleware:
 *   { "error": { "message": "...", "details": [...] } }
 */
export interface ApiErrorBody {
  error: {
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}
