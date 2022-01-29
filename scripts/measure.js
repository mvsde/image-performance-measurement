import { valuesToCSV } from '../lib/csv.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer'
import server from '../lib/server.js'

import {
  PORT,
  RERUNS,
  IMAGES_DIR,
  TRACES_DIR,
  RESULTS_DIR,
  NETWORK_CONDITIONS
} from '../config.js'

const images = await fs.readdir(IMAGES_DIR)
await fs.mkdir(TRACES_DIR, { recursive: true })
await fs.mkdir(RESULTS_DIR, { recursive: true })

const resultPath = `${RESULTS_DIR}/${new Date().toISOString()}.csv`
await fs.writeFile(resultPath, valuesToCSV(
  'Name',
  'Type',
  'Size',
  'Response Time',
  'Decode Time',
  'Paint Time'
))

server.listen(PORT)

const browser = await puppeteer.launch()
const page = await browser.newPage()
const client = await page.target().createCDPSession()

await client.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS)

await page.setViewport({ width: 1200, height: 1200 })
await page.goto(`http://localhost:${PORT}/`)

/**
 * Load image in browser context
 *
 * @param {string} url Image URL
 * @returns {Promise<void>}
 */
function loadImageInBrowser (url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = url
    img.decode().then(() => {
      document.body.appendChild(img)

      // Paint finishes after two frames.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  })
}

/**
 * Measure image performance
 *
 * @param {string} image Image name
 * @returns {Promise<void>}
 */
async function measure (image) {
  const imagePath = `${IMAGES_DIR}/${image}`
  const tracePath = `${TRACES_DIR}/${image}.json`
  await fs.writeFile(tracePath, '')

  await page.reload()
  await page.tracing.start({ path: tracePath })
  await page.evaluate(loadImageInBrowser, imagePath)
  await page.tracing.stop()

  const fileExtension = path.extname(image)
  const fileName = path.basename(image, fileExtension)
  const { size: fileSize } = await fs.stat(imagePath)

  const traceFile = await fs.readFile(tracePath, { encoding: 'utf8' })
  const { traceEvents } = JSON.parse(traceFile)

  const resourceStart = traceEvents.find(trace => trace.name === 'ResourceSendRequest').ts
  const resourceFinish = traceEvents.find(trace => trace.name === 'ResourceFinish').ts
  const decodeDuration = traceEvents.find(trace => trace.name === 'ImageDecodeTask').dur
  const paintDuration = traceEvents.find(trace => trace.name === 'PaintImage').dur

  await fs.appendFile(resultPath, valuesToCSV(
    fileName,
    fileExtension,
    fileSize,
    resourceFinish - resourceStart,
    decodeDuration,
    paintDuration
  ))
}

for (let index = 0; index < RERUNS; index++) {
  for (const image of images) {
    await measure(image)
  }
}

await browser.close()
server.close()
