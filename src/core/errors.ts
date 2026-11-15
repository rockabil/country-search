export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    void status;
    throw new Error('HttpError: not implemented yet');
  }
}
