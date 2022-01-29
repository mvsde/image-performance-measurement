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

server.listen(PORT)

const browser = await puppeteer.launch()
const page = await browser.newPage()
const client = await page.target().createCDPSession()
await client.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS)
await page.setViewport({ width: 1200, height: 1200 })
await page.goto(`http://localhost:${PORT}/`)

const resultPath = `${RESULTS_DIR}/${new Date().toISOString()}.csv`
await fs.writeFile(resultPath, valuesToCSV(
  'Name',
  'Type',
  'Size',
  'Size (kB)',
  'Response Time',
  'Response Time (ms)',
  'Decode Time',
  'Decode Time (ms)'
))

async function measure () {
  for (const image of images) {
    const imagePath = `${IMAGES_DIR}/${image}`
    const tracePath = `${TRACES_DIR}/${image}.json`

    await fs.writeFile(tracePath, '')

    await page.reload()
    await page.tracing.start({ path: tracePath })

    await page.evaluate((url) => {
      return new Promise((resolve) => {
        const img = new Image()
        img.src = url
        img.decode().then(() => {
          document.body.appendChild(img)
          resolve()
        })
      })
    }, imagePath)

    await page.tracing.stop()

    const traceFile = await fs.readFile(tracePath, { encoding: 'utf8' })
    const { traceEvents } = JSON.parse(traceFile)

    const fileExtension = path.extname(image)
    const fileName = path.basename(image, fileExtension)
    const fileStats = await fs.stat(imagePath)
    const resourceStart = traceEvents.find(trace => trace.name === 'ResourceSendRequest').ts
    const resourceFinish = traceEvents.find(trace => trace.name === 'ResourceFinish').ts
    const responseDuration = resourceFinish - resourceStart
    const decodeDuration = traceEvents.find(trace => trace.name === 'ImageDecodeTask').dur

    await fs.appendFile(resultPath, valuesToCSV(
      fileName,
      fileExtension,
      fileStats.size,
      fileStats.size / 1000,
      responseDuration,
      responseDuration / 1000,
      decodeDuration,
      decodeDuration / 1000
    ))
  }
}

for (let index = 0; index < RERUNS; index++) {
  await measure()
}

await browser.close()
server.close()
