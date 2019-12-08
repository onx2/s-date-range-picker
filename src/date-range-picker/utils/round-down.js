/**
 *
 * @param {number} n - The number to be rounded down
 * @param {number} p - The precision of the rounding
 *
 * @returns {number}
 */
export const roundDown = (n, p = 1) => Math.floor(n / p) * p
