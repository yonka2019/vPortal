/**
 * `crypto.randomUUID` is only defined in a secure context, so on a plain-HTTP
 * deployment — `docker run -p 3001:3001` on a LAN address, which the README documents —
 * it is undefined and every Add or Duplicate threw. The fallback still satisfies the
 * server's `/^[\w-]{1,64}$/` id check.
 */
export const uid = () =>
  crypto.randomUUID?.() ?? `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
