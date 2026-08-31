import crypto from 'crypto';

/**
 * Gera um hash PBKDF2 seguro para uma credencial (Senha ou PIN)
 */
export function hashCredential(value: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(value, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Compara uma credencial em texto plano com o hash armazenado
 */
export function verifyCredential(value: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(value, salt, 1000, 64, 'sha512').toString('hex');
    return verifyHash === hash;
  } catch (e) {
    return false;
  }
}
