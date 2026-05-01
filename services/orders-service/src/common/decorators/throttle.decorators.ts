import { Throttle } from '@nestjs/throttler';

export const StrictThrottle = () =>
  Throttle({
    strict: {
      limit: 5,
      ttl: 60_000,
    },
  });
