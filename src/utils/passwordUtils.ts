import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt with 5 rounds for better performance
 */
export const hashPassword = (password: string): string => {
  const salt = bcrypt.genSaltSync(5); // Reduced from 10 to 5 rounds for better performance
  return bcrypt.hashSync(password, salt);
};

/**
 * Memoized password comparison to avoid repeated hashing
 * Caches the last password/hash comparison result
 */
export const memoizedComparePassword = (() => {
  let lastPassword = '';
  let lastHash = '';
  let lastResult = false;

  return (password: string, hash: string): boolean => {
    if (password === lastPassword && hash === lastHash) {
      return lastResult;
    }
    lastPassword = password;
    lastHash = hash;
    lastResult = bcrypt.compareSync(password, hash);
    return lastResult;
  };
})();
