import { Throttle } from '@nestjs/throttler';

export const StrictThrottle = () =>
  Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  });
