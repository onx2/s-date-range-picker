import { format } from "date-fns"

/**
 *
 * @param {Date} date
 * @param {string} dateFormat
 *
 * @returns {string} - The date in the supplied locale,
 *                     defaulting to the current system locale
 */
export const localeFormat = (date, dateFormat) =>
  format(date, dateFormat, { locale: window.__locale__ })
