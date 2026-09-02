/**
 * Circuit Breaker Pattern Implementation for Frontend Resilience
 * States:
 * - CLOSED: Normal operation. Requests pass through.
 * - OPEN: Failure threshold exceeded. Requests fail fast without hitting the server.
 * - HALF_OPEN: Cooldown expired. Allows a trial (canary) request to test service recovery.
 */

export const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
} as const;

export type CircuitState = (typeof CircuitState)[keyof typeof CircuitState];

export interface CircuitBreakerOptions {
  failureThreshold: number;   // Number of consecutive failures before opening circuit
  cooldownPeriodMs: number;   // Time in ms to remain OPEN before trying HALF_OPEN
  successThreshold: number;   // Number of successful canary requests to close circuit
}

export class CircuitBreakerError extends Error {
  public remainingCooldownMs: number;
  public state: CircuitState;

  constructor(message: string, remainingCooldownMs: number, state: CircuitState) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.remainingCooldownMs = remainingCooldownMs;
    this.state = state;
  }
}

export type CircuitEventListener = (state: CircuitState, error?: Error) => void;

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttemptTimestamp: number = 0;
  private listeners: Set<CircuitEventListener> = new Set();

  private options: CircuitBreakerOptions;

  constructor(options?: Partial<CircuitBreakerOptions>) {
    this.options = {
      failureThreshold: 4,
      cooldownPeriodMs: 10000, // 10 seconds
      successThreshold: 2,
      ...options,
    };
  }

  public getState(): CircuitState {
    this.evaluateState();
    return this.state;
  }

  public subscribe(listener: CircuitEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(state: CircuitState, error?: Error): void {
    // Run notification asynchronously to avoid React render lifecycle collisions
    setTimeout(() => {
      this.listeners.forEach((listener) => {
        try {
          listener(state, error);
        } catch (err) {
          console.error('Error in circuit breaker listener:', err);
        }
      });
    }, 0);
  }

  private evaluateState(): void {
    const now = Date.now();
    if (this.state === CircuitState.OPEN && now >= this.nextAttemptTimestamp) {
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }
  }

  /**
   * Check if a request is allowed to pass through the circuit breaker.
   * Throws CircuitBreakerError if the circuit is OPEN.
   */
  public canPass(): boolean {
    this.evaluateState();

    if (this.state === CircuitState.OPEN) {
      const remaining = Math.max(0, this.nextAttemptTimestamp - Date.now());
      throw new CircuitBreakerError(
        `Servicio temporalmente no disponible (Circuit Breaker activo). Reintentando en ${Math.ceil(remaining / 1000)}s.`,
        remaining,
        this.state
      );
    }

    return true;
  }

  /**
   * Record a successful response.
   */
  public recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.notify(this.state);
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
    }
  }

  /**
   * Record a failed response or network error.
   */
  public recordFailure(error?: Error): void {
    const now = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      // Canary failed; trip back to OPEN
      this.state = CircuitState.OPEN;
      this.nextAttemptTimestamp = now + this.options.cooldownPeriodMs;
      this.notify(this.state, error);
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount++;
      if (this.failureCount >= this.options.failureThreshold) {
        this.state = CircuitState.OPEN;
        this.nextAttemptTimestamp = now + this.options.cooldownPeriodMs;
        this.notify(this.state, error);
      }
    }
  }

  /**
   * Manually reset the circuit breaker.
   */
  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTimestamp = 0;
    this.notify(this.state);
  }
}

export const globalCircuitBreaker = new CircuitBreaker();
