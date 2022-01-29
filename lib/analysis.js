import { valuesToCSV } from './csv.js'
import Big from 'big.js'
import fs from 'node:fs/promises'

/**
 * @typedef {Object} ResultEntry
 * @property {number} count
 * @property {number} size
 * @property {number} responseTime
 * @property {number} decodeTime
 * @property {number} paintTime
 */

/** @type {Object<string, ResultEntry>} */
const accumulatedResult = {}

/**
 * Add values to analysis
 *
 * @param {Object} options
 * @param {string} options.type
 * @param {number} options.size
 * @param {number} options.responseTime
 * @param {number} options.decodeTime
 * @param {number} options.paintTime
 */
export function addToAnalysis ({ type, size, responseTime, decodeTime, paintTime }) {
  if (type in accumulatedResult) {
    accumulatedResult[type].count++
    accumulatedResult[type].size += size
    accumulatedResult[type].responseTime += responseTime
    accumulatedResult[type].decodeTime += decodeTime
    accumulatedResult[type].paintTime += paintTime
  } else {
    accumulatedResult[type] = {
      count: 1,
      size,
      responseTime,
      decodeTime,
      paintTime
    }
  }
}

/**
 * Write analysis CSV
 *
 * @param {Object} options
 * @param {string} options.path
 */
export async function writeAnalysis ({ path }) {
  await fs.writeFile(path, valuesToCSV(
    'Type',
    'Average Size (kB)',
    'Average Response Time (ms)',
    'Average Decode Time (ms)',
    'Average Paint Time (ms)',
    'Total (ms)'
  ))

  for (const [type, value] of Object.entries(accumulatedResult)) {
    const { count, size, responseTime, decodeTime, paintTime } = value

    const averageSize = new Big(size).div(count)
    const averageResponseTime = new Big(responseTime).div(count)
    const averageDecodeTime = new Big(decodeTime).div(count)
    const averagePaintTime = new Big(paintTime).div(count)
    const total = averageResponseTime.plus(averageDecodeTime).plus(averagePaintTime)

    await fs.appendFile(path, valuesToCSV(
      type,
      averageSize.div(1000),
      averageResponseTime.div(1000),
      averageDecodeTime.div(1000),
      averagePaintTime.div(1000),
      total.div(1000)
    ))
  }
}
