import { formatNumber, formatRelativeTime } from '../formatters'

describe('formatters', () => {
  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1000000)).toBe('1,000,000')
    })
  })

  describe('formatRelativeTime', () => {
    it('returns "Just now" for recent times', () => {
      const now = new Date()
      expect(formatRelativeTime(now.toISOString())).toBe('Just now')
    })

    it('formats minutes ago', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000)
      expect(formatRelativeTime(date.toISOString())).toBe('5m ago')
    })

    it('formats hours ago', () => {
      const date = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(formatRelativeTime(date.toISOString())).toBe('2h ago')
    })
  })
})
