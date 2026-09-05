/**
 * Admission control for the banner renderer. Each render decodes a photo and
 * rasterises a 3000 x 1000 composite (~1.3 s of CPU and a few hundred MB of
 * working memory), so an unauthenticated endpoint needs a bound on how much of
 * that can happen at once. Two independent limits:
 *
 *  - a concurrency gate: at most `maxActive` renders run together, at most
 *    `maxWaiting` requests queue behind them (for `maxWaitMs`), the rest get
 *    a 503 straight away without their body ever being read;
 *  - a per-client sliding-window rate limit, so one browser cannot hold the
 *    whole queue.
 */

export class GateFullError extends Error {
  readonly name = "GateFullError";
  constructor(readonly retryAfterSeconds: number) {
    super("The studio is busy right now. Try again in a few seconds.");
  }
}

export class RateLimitedError extends Error {
  readonly name = "RateLimitedError";
  constructor(readonly retryAfterSeconds: number) {
    super("You are rendering very quickly. Give it a moment and try again.");
  }
}

export type GateOptions = {
  maxActive: number;
  maxWaiting: number;
  maxWaitMs: number;
  /** renders allowed per client within `windowMs` */
  perClientLimit: number;
  windowMs: number;
};

export const DEFAULT_GATE_OPTIONS: GateOptions = {
  maxActive: 2,
  maxWaiting: 6,
  maxWaitMs: 20_000,
  perClientLimit: 30,
  windowMs: 60_000,
};

type Waiter = { resolve: (release: () => void) => void; reject: (err: Error) => void; timer: NodeJS.Timeout };

export class RenderGate {
  private active = 0;
  private readonly waiting: Waiter[] = [];
  private readonly recent = new Map<string, number[]>();
  private lastSweep = 0;

  constructor(private readonly options: GateOptions = DEFAULT_GATE_OPTIONS) {}

  /**
   * Reserve a render slot for `clientKey`. Resolves with a release function
   * that must be called exactly once; rejects with RateLimitedError or
   * GateFullError when the request should be refused.
   */
  acquire(clientKey: string): Promise<() => void> {
    const { maxActive, maxWaiting, maxWaitMs } = this.options;
    const retryAfter = this.rateRetryAfter(clientKey);
    if (retryAfter !== null) {
      return Promise.reject(new RateLimitedError(retryAfter));
    }
    if (this.waiting.length >= maxWaiting) {
      // Refused requests do not count against the client's allowance.
      return Promise.reject(new GateFullError(5));
    }
    this.record(clientKey);

    if (this.active < maxActive) {
      this.active += 1;
      return Promise.resolve(this.releaser());
    }
    return new Promise<() => void>((resolve, reject) => {
      const waiter: Waiter = {
        resolve,
        reject,
        timer: setTimeout(() => {
          const index = this.waiting.indexOf(waiter);
          if (index >= 0) this.waiting.splice(index, 1);
          reject(new GateFullError(10));
        }, maxWaitMs),
      };
      this.waiting.push(waiter);
    });
  }

  /** Current occupancy, for logging. */
  get stats(): { active: number; waiting: number } {
    return { active: this.active, waiting: this.waiting.length };
  }

  private releaser(): () => void {
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const next = this.waiting.shift();
      if (next) {
        clearTimeout(next.timer);
        // Hand the slot straight over; `active` stays the same.
        next.resolve(this.releaser());
      } else {
        this.active -= 1;
      }
    };
  }

  /** Seconds until the client may render again. Null when it is within its allowance. */
  private rateRetryAfter(clientKey: string): number | null {
    const { perClientLimit, windowMs } = this.options;
    const now = Date.now();
    this.sweep(now);
    const stamps = (this.recent.get(clientKey) ?? []).filter((t) => now - t < windowMs);
    this.recent.set(clientKey, stamps);
    if (stamps.length < perClientLimit) return null;
    const oldest = stamps[0]!;
    return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
  }

  private record(clientKey: string): void {
    const stamps = this.recent.get(clientKey) ?? [];
    stamps.push(Date.now());
    this.recent.set(clientKey, stamps);
  }

  /** Drop idle clients so the map cannot grow without bound. */
  private sweep(now: number): void {
    const { windowMs } = this.options;
    if (now - this.lastSweep < windowMs) return;
    this.lastSweep = now;
    for (const [key, stamps] of this.recent) {
      if (stamps.every((t) => now - t >= windowMs)) this.recent.delete(key);
    }
  }
}
