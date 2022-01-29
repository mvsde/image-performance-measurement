/**
 * Load image in browser context
 *
 * @param {Object} options
 * @param {string} options.path Image URL
 */
export function loadImageInBrowser ({ path }) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = path
    img.decode().then(() => {
      document.body.appendChild(img)

      // Paint finishes after two frames.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    })
  })
}
