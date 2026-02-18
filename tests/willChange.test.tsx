import { beforeEach, describe, expect, it, vi } from 'vitest'
import { proxy, subscribe, willChange } from 'valtio'

describe('willChange', () => {
  const consoleWarn = console.warn

  beforeEach(() => {
    console.warn = vi.fn((message: string) => {
      if (message === 'Please use proxy object') {
        return
      }
      consoleWarn(message)
    })
    vi.useFakeTimers()
  })

  it('should call willChange callback before state changes', () => {
    const obj = proxy({ count: 0 })
    const willChangeHandler = vi.fn()
    const values: number[] = []

    willChange(obj, () => {
      willChangeHandler()
      // Capture the value before the change
      values.push(obj.count)
    })

    obj.count = 1
    expect(willChangeHandler).toBeCalledTimes(1)
    // Value should still be 0 when willChange was called
    expect(values[0]).toBe(0)
    // Value should now be 1 after the change
    expect(obj.count).toBe(1)
  })

  it('should be able to unsubscribe from willChange', () => {
    const obj = proxy({ count: 0 })
    const handler = vi.fn()

    const unsubscribe = willChange(obj, handler)
    unsubscribe()

    obj.count += 1

    expect(handler).toBeCalledTimes(0)
  })

  it('should call willChange callback on multiple changes', () => {
    const obj = proxy({ count: 0 })
    const handler = vi.fn()

    willChange(obj, handler)

    obj.count = 1
    obj.count = 2
    obj.count = 3

    expect(handler).toBeCalledTimes(3)
  })

  it('should not call willChange if value does not change', () => {
    const obj = proxy({ count: 0 })
    const handler = vi.fn()

    willChange(obj, handler)

    obj.count = 0

    expect(handler).toBeCalledTimes(0)
  })

  it('should call willChange for nested object changes', () => {
    const obj = proxy({ nested: { count: 0 } })
    const handler = vi.fn()

    willChange(obj.nested, handler)

    obj.nested.count = 1

    expect(handler).toBeCalledTimes(1)
  })

  it('should call willChange on delete operations', () => {
    const obj = proxy<{ count?: number }>({ count: 0 })
    const handler = vi.fn()

    willChange(obj, handler)

    delete obj.count

    expect(handler).toBeCalledTimes(1)
  })

  it('should support multiple willChange subscribers', () => {
    const obj = proxy({ count: 0 })
    const handler1 = vi.fn()
    const handler2 = vi.fn()

    willChange(obj, handler1)
    willChange(obj, handler2)

    obj.count = 1

    expect(handler1).toBeCalledTimes(1)
    expect(handler2).toBeCalledTimes(1)
  })

  it('should call willChange before the actual change is applied', () => {
    const obj = proxy({ count: 0 })
    let capturedValue: number | undefined

    willChange(obj, () => {
      // At this point, the change should not be applied yet
      capturedValue = obj.count
    })

    obj.count = 5

    // The willChange callback should have captured the old value
    expect(capturedValue).toBe(0)
    // But the new value should be applied now
    expect(obj.count).toBe(5)
  })

  it('should call willChange before subscribe callback', async () => {
    const obj = proxy({ count: 0 })
    const callOrder: string[] = []

    willChange(obj, () => {
      callOrder.push('willChange')
    })

    subscribe(obj, () => {
      callOrder.push('subscribe')
    })

    obj.count = 1

    await vi.advanceTimersByTimeAsync(0)

    expect(callOrder).toEqual(['willChange', 'subscribe'])
  })
})
