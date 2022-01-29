export const PORT = 8080

export const RERUNS = 5

export const INPUT_DIR = 'input'
export const IMAGES_DIR = 'images'
export const TRACES_DIR = 'traces'
export const RESULTS_DIR = 'results'

export const PREPROCESS_OPTIONS = {
  resize: {
    enabled: true,
    width: 1000
  }
}

export const ENCODE_OPTIONS = {
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

/**
 * {@link https://infrequently.org/2021/03/the-performance-inequality-gap/}
 * {@link https://github.com/WPO-Foundation/webpagetest/blob/master/www/settings/connectivity.ini.sample}
 *
 * @type {import('puppeteer').Protocol.Network.EmulateNetworkConditionsRequest}
 */
export const NETWORK_CONDITIONS = {
  offline: false,
  downloadThroughput: 9 * 1000 * 1000,
  uploadThroughput: 5 * 1000 * 1000,
  latency: 170
}
