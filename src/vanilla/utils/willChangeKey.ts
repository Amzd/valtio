import { subscribe, willChange } from '../../vanilla.ts'

/**
 * willChangeKey
 *
 * The willChangeKey utility enables subscription to a primitive subproperty of a given state proxy.
 * Subscriptions created with willChangeKey will only fire when the specified property changes,
 * and the callback receives the previous value before the change.
 *
 * @example
 * import { willChangeKey } from 'valtio/utils'
 * willChangeKey(state, 'count', (v) => console.log('state.count is changing from', v))
 */
export function willChangeKey<T extends object, K extends keyof T>(
  proxyObject: T,
  key: K,
  callback: (value: T[K]) => void,
): () => void {
  let capturedValue = proxyObject[key]
  const removeWillChange = willChange(proxyObject, () => {
    capturedValue = proxyObject[key]
  })
  const removeSubscribe = subscribe(
    proxyObject,
    () => {
      const nextValue = proxyObject[key]
      if (!Object.is(capturedValue, nextValue)) {
        callback(capturedValue)
        capturedValue = nextValue
      }
    },
    true,
  )
  return () => {
    removeWillChange()
    removeSubscribe()
  }
}
