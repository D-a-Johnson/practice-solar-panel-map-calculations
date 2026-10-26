/**
 * Carries only the HTTP status. The UI words the message itself, in the
 * user's language, instead of showing the API's English `detail` text.
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number) {
    super(`HTTP ${status}`);
    this.status = status;
  }
}

export function statusOf(error: Error): number | undefined {
  return error instanceof ApiError ? error.status : undefined;
}
