/**
 * The DOM API, of which addEventListener is a part, is not defined by the
 * ECMAScript language specification, so it is unrelated to Babel.
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 *
 * This function is used for safely detecting passive option support, but
 * could be extended for any option on addEventListener.
 */

export let passiveSupported = false

try {
  const options = {
    // This function will be called when the browser
    // attempts to access the passive property.
    get passive() {
      passiveSupported = true
      return false
    }
  }

  window.addEventListener('test', null, options)
  window.removeEventListener('test', null, options)
} catch (err) {
  passiveSupported = false
}
