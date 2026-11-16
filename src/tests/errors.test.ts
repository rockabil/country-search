import { describe, it, expect } from 'vitest';
import { HttpError } from '../core/errors';

describe('HttpError', () => {
  it('extends Error', () => {
    const err = new HttpError(500, 'Server error');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(HttpError);
  });

  it('stores the status code', () => {
    const err = new HttpError(503, 'Service unavailable');
    expect(err.status).toBe(503);
  });

  it('stores the message', () => {
    const err = new HttpError(500, 'Server error');
    expect(err.message).toBe('Server error');
  });

  it('has name "HttpError"', () => {
    const err = new HttpError(500, 'Server error');
    expect(err.name).toBe('HttpError');
  });
});
