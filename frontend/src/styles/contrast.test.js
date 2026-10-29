// @vitest-environment node
// Fails if any text color in the tokens drops below WCAG AA (4.5:1) in either theme.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

function readVars(block) {
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]))
}

const light = readVars(css.slice(0, css.indexOf('@media')))
const dark = readVars(css.slice(css.indexOf('@media')))

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const TEXT = ['ink', 'ink-soft', 'ink-faint', 'accent', 'status-todo', 'status-progress', 'status-review', 'status-blocked', 'status-done']
const PAIRS = [
  ...TEXT.flatMap((text) => [[text, 'paper'], [text, 'card']]),
  ['accent', 'accent-soft'],
  ['ink', 'accent-soft'],
  ['on-accent', 'accent'],
]

describe.each([['light', light], ['dark', dark]])('%s theme', (_name, theme) => {
  it.each(PAIRS)('%s on %s is readable', (text, background) => {
    expect(contrast(theme[text], theme[background])).toBeGreaterThanOrEqual(4.5)
  })
})
