const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateBookingReference(): string {
  let suffix = '';
  for (let i = 0; i < 5; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `BTT-${suffix}`;
}
