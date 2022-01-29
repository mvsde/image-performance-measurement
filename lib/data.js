import { valuesToCSV } from './csv.js'
import fs from 'node:fs/promises'

/**
 * Write data table header
 *
 * @param {Object} options
 * @param {string} options.path
 */
export async function writeDataHeader ({ path }) {
  await fs.writeFile(path, valuesToCSV(
    'Name',
    'Type',
    'Size',
    'Response Time',
    'Decode Time',
    'Paint Time'
  ))
}

/**
 * Add values to data table
 *
 * @param {Object} options
 * @param {string} options.path
 * @param {string} options.name
 * @param {string} options.type
 * @param {number} options.size
 * @param {number} options.responseTime
 * @param {number} options.decodeTime
 * @param {number} options.paintTime
 */
export async function writeDataRow ({ path, name, type, size, responseTime, decodeTime, paintTime }) {
  await fs.appendFile(path, valuesToCSV(
    name,
    type,
    size,
    responseTime,
    decodeTime,
    paintTime
  ))
}
