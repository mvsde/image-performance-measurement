import { ImagePool } from '@squoosh/lib'
import fs from 'node:fs/promises'
import path from 'node:path'

const INPUT_DIR = './input'
const OUTPUT_DIR = './images'

const IMAGES = await fs.readdir(INPUT_DIR)
const imagePool = new ImagePool()

const PREPROCESS_OPTIONS = {
  resize: {
    enabled: true,
    width: 1000
  }
}

const ENCODE_OPTIONS = {
  mozjpeg: {
    quality: 80
  },
  webp: {
    quality: 70
  },
  avif: {
    cqLevel: 30
  }
}

for (const name of IMAGES) {
  const image = imagePool.ingestImage(`${INPUT_DIR}/${name}`)
  await image.decoded
  await image.preprocess(PREPROCESS_OPTIONS)
  await image.encode(ENCODE_OPTIONS)

  for (const encodedImage of Object.values(image.encodedWith)) {
    const { extension, binary } = await encodedImage
    const fileName = `${OUTPUT_DIR}/${path.basename(name, path.extname(name))}.${extension}`
    await fs.writeFile(fileName, binary)
  }
}

imagePool.close()
