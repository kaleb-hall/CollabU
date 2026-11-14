import { describe, expect, it } from 'vitest'
import { buildBlockPayload, describeRepeat, weekdayCode } from './blockForm'

const base = {
  title: 'CS 101', description: '', block_type: 'class',
  start_time: '2030-01-07T09:00', end_time: '2030-01-07T10:30',
  repeats: false, repeat_days: [], repeat_until: '',
}

describe('buildBlockPayload', () => {
  it('sends UTC times and no repeat for one-off blocks', () => {
    expect(buildBlockPayload(base)).toEqual({
      title: 'CS 101', description: '', block_type: 'class',
      start_time: '2030-01-07T17:00:00.000Z', end_time: '2030-01-07T18:30:00.000Z',
      repeat_days: null, repeat_until: null,
    })
  })

  it('sends days in week order and the end date for repeating blocks', () => {
    const payload = buildBlockPayload({ ...base, repeats: true, repeat_days: ['WE', 'MO'], repeat_until: '2030-03-15' })
    expect(payload.repeat_days).toEqual(['MO', 'WE'])
    expect(payload.repeat_until).toBe('2030-03-15')
  })
})

describe('weekdayCode', () => {
  it('uses the local day of the start time', () => {
    expect(weekdayCode('2030-01-07T09:00')).toBe('MO')
    expect(weekdayCode('2030-01-12T23:30')).toBe('SA')
  })
})

describe('describeRepeat', () => {
  it('describes a weekly repeat', () => {
    expect(describeRepeat({ repeat_days: ['MO', 'WE'], repeat_until: '2030-03-15' })).toBe('Every Mon and Wed until Mar 15, 2030')
    expect(describeRepeat({ repeat_days: ['MO', 'WE', 'FR'], repeat_until: '2030-03-15' })).toBe('Every Mon, Wed and Fri until Mar 15, 2030')
  })

  it('returns null for one-off blocks', () => {
    expect(describeRepeat({ repeat_days: null })).toBeNull()
  })
})
