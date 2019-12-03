/**
 *
 * @param {number} n - The number to be checked for needed padding
 *
 * @returns {(string | number)}
 */
export const pad = n => (n < 10 ? `0${n}` : n);
