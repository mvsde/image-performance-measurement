import { addToAnalysis, writeAnalysis } from '../lib/analysis.js'
import { writeDataHeader, writeDataRow } from '../lib/data.js'
import { loadImageInBrowser } from '../lib/browser.js'
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

const date = new Date().toISOString()
const dataPath = `${RESULTS_DIR}/data-${date}.csv`
const analysisPath = `${RESULTS_DIR}/analysis-${date}.csv`

await writeDataHeader({ path: dataPath })

server.listen(PORT)

const browser = await puppeteer.launch()
const page = await browser.newPage()
const client = await page.target().createCDPSession()

await client.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS)

await page.setViewport({ width: 1200, height: 1200 })
await page.goto(`http://localhost:${PORT}/`)

/**
 * Measure image performance
 *
 * @param {string} image Image name
 */
async function measure (image) {
  const imagePath = `${IMAGES_DIR}/${image}`
  const tracePath = `${TRACES_DIR}/${image}.json`
  await fs.writeFile(tracePath, '')

  await page.reload()
  await page.tracing.start({ path: tracePath })
  await page.evaluate(loadImageInBrowser, { path: imagePath })
  await page.tracing.stop()

  const type = path.extname(image)
  const name = path.basename(image, type)
  const { size } = await fs.stat(imagePath)

  const traceFile = await fs.readFile(tracePath, { encoding: 'utf8' })
  const { traceEvents } = JSON.parse(traceFile)

  const responseStart = traceEvents.find(trace => trace.name === 'ResourceSendRequest').ts
  const responseFinish = traceEvents.find(trace => trace.name === 'ResourceFinish').ts
  const responseTime = responseFinish - responseStart
  const decodeTime = traceEvents.find(trace => trace.name === 'ImageDecodeTask').dur
  const paintTime = traceEvents.find(trace => trace.name === 'PaintImage').dur

  writeDataRow({ path: dataPath, name, type, size, responseTime, decodeTime, paintTime })
  addToAnalysis({ type, size, responseTime, decodeTime, paintTime })
}

for (let index = 0; index < RERUNS; index++) {
  for (const image of images) {
    await measure(image)
  }
}

await browser.close()
server.close()

writeAnalysis({ path: analysisPath })
