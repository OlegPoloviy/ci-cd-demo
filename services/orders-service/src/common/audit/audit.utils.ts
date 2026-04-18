import { AuthUser } from 'src/modules/auth/types/auth.types';

export function getActorId(actor?: AuthUser | null): string | null {
  return actor?.id ?? actor?.sub ?? null;
}
