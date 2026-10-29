import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// jsdom lacks these browser APIs; the command menu and popovers call them
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof Element !== "undefined") Element.prototype.scrollIntoView ??= function scrollIntoView() {}
