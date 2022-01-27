import { createServer } from 'node:http'
import fs from 'node:fs/promises'

export default createServer(async (request, response) => {
  if (request.url.startsWith('/images')) {
    const file = await fs.readFile('.' + request.url)
    response.end(file)
  } else {
    response.end()
  }
})
