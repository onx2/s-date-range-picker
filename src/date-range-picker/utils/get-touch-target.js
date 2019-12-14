/**
 *
 * @param {Event} e touch event
 *
 * @returns {[HTMLElement]}
 */
export const getTouchTarget = e => {
  if ('changedTouches' in e) {
    const loc = e.changedTouches[0]

    return document.elementFromPoint(loc.clientX, loc.clientY)
  }
}
