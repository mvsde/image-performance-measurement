/**
 * Convert values to CSV row
 *
 * @param {(string|number)[]} values Table row
 * @returns {string}
 */
export function valuesToCSV (...values) {
  return values.map(value => `"${value}"`).join(',') + '\n'
}
