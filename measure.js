import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer'

const RERUNS = 3

const IMAGES_DIR = './images'
const TRACES_DIR = './traces'
const RESULTS_DIR = './results'

const IMAGES = await fs.readdir(IMAGES_DIR)
await fs.mkdir(TRACES_DIR, { recursive: true })
await fs.mkdir(RESULTS_DIR, { recursive: true })

const browser = await puppeteer.launch()
const page = await browser.newPage()

page.setViewport({
  width: 1440,
  height: 900
})

await page.goto('http://localhost:3000/')

const resultPath = `${RESULTS_DIR}/${new Date().toISOString()}.csv`
await fs.writeFile(resultPath, 'Filename,Type,Raw Time,Time (ms)\n')

async function measure () {
  for (const image of IMAGES) {
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

    traceEvents.forEach((trace) => {
      if (trace.name === 'ImageDecodeTask') {
        fs.appendFile(resultPath, `${fileName},${fileExtension},${trace.dur},${trace.dur / 1000}\n`)
      }
    })
  }
}

for (let index = 0; index < RERUNS; index++) {
  await measure()
}

await browser.close()
