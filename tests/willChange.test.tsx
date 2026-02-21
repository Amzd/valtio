import { beforeEach, describe, expect, it, vi } from 'vitest'
import { proxy, subscribe, willChange } from 'valtio'
import { willChangeKey } from 'valtio/utils'

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
    
    obj.count = 2
    expect(willChangeHandler).toBeCalledTimes(2)
    // Value should still be 1 when willChange was called
    expect(values[1]).toBe(1)
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

describe('willChangeKey', () => {
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

  it('should call willChangeKey callback with the new value before the key changes', () => {
    const obj = proxy({ count: 0 })
    const handler = vi.fn()
    const newValues: number[] = []
    const oldValues: number[] = []

    willChangeKey(obj, 'count', (newValue) => {
      handler()
      newValues.push(newValue)
      // At the time of the callback, the change has not been applied yet
      oldValues.push(obj.count)
    })

    obj.count = 1
    expect(handler).toBeCalledTimes(1)
    expect(newValues[0]).toBe(1) // new value is passed
    expect(oldValues[0]).toBe(0) // old value is still readable via proxyObject

    obj.count = 2
    expect(handler).toBeCalledTimes(2)
    expect(newValues[1]).toBe(2)
    expect(oldValues[1]).toBe(1)
  })

  it('should only fire for the specified key', () => {
    const obj = proxy({ count: 0, other: 0 })
    const handler = vi.fn()

    willChangeKey(obj, 'count', handler)

    obj.other = 5
    expect(handler).toBeCalledTimes(0)

    obj.count = 1
    expect(handler).toBeCalledTimes(1)
    expect(handler).lastCalledWith(1)
  })

  it('should be able to unsubscribe from willChangeKey', () => {
    const obj = proxy({ count: 0 })
    const handler = vi.fn()

    const unsubscribe = willChangeKey(obj, 'count', handler)
    unsubscribe()

    obj.count = 1
    expect(handler).toBeCalledTimes(0)
  })

  it('should not call willChangeKey if value does not change', () => {
    const obj = proxy({ count: 0 })
    const handler = vi.fn()

    willChangeKey(obj, 'count', handler)

    obj.count = 0
    expect(handler).toBeCalledTimes(0)
  })

  it('should call willChangeKey on multiple changes', () => {
    const obj = proxy({ count: 0 })
    const handler = vi.fn()

    willChangeKey(obj, 'count', handler)

    obj.count = 1
    obj.count = 2
    obj.count = 3

    expect(handler).toBeCalledTimes(3)
    expect(handler).toHaveBeenNthCalledWith(1, 1)
    expect(handler).toHaveBeenNthCalledWith(2, 2)
    expect(handler).toHaveBeenNthCalledWith(3, 3)
  })
})
