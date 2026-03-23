import { Socket } from 'socket.io';

export function getTokenFromHandshake(client: Socket): string | null {
  const authToken = (client.handshake.auth as any)?.token;
  if (typeof authToken === 'string' && authToken.length > 0) {
    return authToken;
  }

  const header = client.handshake.headers?.authorization;
  if (
    typeof header === 'string' &&
    header.toLowerCase().startsWith('bearer ')
  ) {
    return header.slice('bearer '.length).trim();
  }

  const queryToken = (client.handshake.query as any)?.token;
  if (typeof queryToken === 'string' && queryToken.length > 0) {
    return queryToken;
  }

  return null;
}
