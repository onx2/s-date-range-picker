import { passiveSupported } from '../index'

describe('passiveSupported', () => {
  it('In test environment, it should be false', () => {
    expect(passiveSupported).toStrictEqual(false)
  })
  // simulate chrome environment for true value
})
