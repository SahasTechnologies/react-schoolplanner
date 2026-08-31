import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

/**
 * Hash a password using bcrypt with standard secure work factor (10 rounds)
 */
export const hashPassword = (password: string): string => {
  const salt = bcrypt.genSaltSync(BCRYPT_ROUNDS);
  return bcrypt.hashSync(password, salt);
};

/**
 * Compare password against a hash without retaining plaintext in module state
 */
export const comparePassword = (password: string, hash: string): boolean => {
  if (!password || !hash) return false;
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
};

/**
 * Backward compatibility alias (now unmemoized to prevent secret retention)
 */
export const memoizedComparePassword = comparePassword;

