/**
 * Convert values to CSV row
 *
 * @param {Array} values Table row
 * @returns {string}
 */
export function valuesToCSV (...values) {
  return values.map(value => `"${value}"`).join(',') + '\n'
}
