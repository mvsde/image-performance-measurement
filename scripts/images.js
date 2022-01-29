import { ImagePool } from '@squoosh/lib'
import fs from 'node:fs/promises'
import path from 'node:path'

import {
  INPUT_DIR,
  IMAGES_DIR,
  PREPROCESS_OPTIONS,
  ENCODE_OPTIONS
} from '../config.js'

await fs.mkdir(IMAGES_DIR, { recursive: true })

const images = await fs.readdir(INPUT_DIR)
const imagePool = new ImagePool()

for (const name of images) {
  const image = imagePool.ingestImage(`${INPUT_DIR}/${name}`)
  await image.decoded
  await image.preprocess(PREPROCESS_OPTIONS)
  await image.encode(ENCODE_OPTIONS)

  for (const encodedImage of Object.values(image.encodedWith)) {
    const { extension, binary } = await encodedImage
    const fileName = `${IMAGES_DIR}/${path.basename(name, path.extname(name))}.${extension}`
    await fs.writeFile(fileName, binary)
  }
}

imagePool.close()
