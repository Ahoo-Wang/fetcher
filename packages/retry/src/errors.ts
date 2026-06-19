export class RetriesExhaustedError extends Error {
  public readonly attempts: number;
  public readonly lastError: unknown;

  constructor(message: string, attempts: number, lastError: unknown) {
    super(message);
    this.name = 'RetriesExhaustedError';
    this.attempts = attempts;
    this.lastError = lastError;
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}
