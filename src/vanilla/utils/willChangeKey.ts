import { willChange } from '../../vanilla.ts'

/**
 * willChangeKey
 *
 * The willChangeKey utility enables subscription to a primitive subproperty of a given state proxy.
 * Subscriptions created with willChangeKey will only fire when the specified property is about to
 * change, and the callback receives the new value before it is applied.
 * The callback will not fire if the new value is the same as the current value (no-op assignment).
 *
 * @example
 * import { willChangeKey } from 'valtio/utils'
 * willChangeKey(state, 'count', (v) => console.log('state.count is about to change to', v))
 */
export function willChangeKey<T extends object, K extends keyof T>(
  proxyObject: T,
  key: K,
  callback: (value: T[K]) => void,
): () => void {
  return willChange(proxyObject, (prop, value) => {
    if (prop === key) {
      callback(value as T[K])
    }
  })
}
