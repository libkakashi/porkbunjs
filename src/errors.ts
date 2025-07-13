import type {DomainCheckLimits} from './types';

export class PorkbunError extends Error {
  constructor(
    message: string,
    public status?: string,
    public response?: any,
  ) {
    super(message);
    this.name = 'PorkbunError';
  }
}

export class PorkbunAuthError extends PorkbunError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTH_ERROR');
    this.name = 'PorkbunAuthError';
  }
}

export class PorkbunRateLimitError extends PorkbunError {
  constructor(
    message = 'Rate limit exceeded',
    public limits?: DomainCheckLimits,
  ) {
    super(message, 'RATE_LIMIT');
    this.name = 'PorkbunRateLimitError';
  }
}
