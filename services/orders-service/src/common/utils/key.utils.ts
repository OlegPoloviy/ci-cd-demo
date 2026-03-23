import { v4 as uuidv4 } from 'uuid';

export function generateProductKey(
  productId: string,
  extension: string,
): string {
  const cleanExtension = extension.replace(/^\./, '');
  return `products/${productId}/images/${uuidv4()}.${cleanExtension}`;
}
