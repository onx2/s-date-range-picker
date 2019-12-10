/**
 *
 * @param {Event} e touch event
 */
export const getTouchTarget = e => {
  const loc = e.changedTouches[0]
  return document.elementFromPoint(loc.clientX, loc.clientY)
}
