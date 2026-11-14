import { afterEach, describe, expect, it } from 'vitest'
import { clearPendingInvite, getPendingInvite, savePendingInvite } from './pendingInvite'

describe('pending invite', () => {
  afterEach(() => clearPendingInvite())

  it('remembers the invite until cleared', () => {
    expect(getPendingInvite()).toBeNull()
    savePendingInvite({ token: 'abc', email: 'sam@example.com' })
    expect(getPendingInvite()).toEqual({ token: 'abc', email: 'sam@example.com' })
    clearPendingInvite()
    expect(getPendingInvite()).toBeNull()
  })

  it('ignores broken stored values', () => {
    sessionStorage.setItem('collabu.pendingInvite', '{not json')
    expect(getPendingInvite()).toBeNull()
  })
})
