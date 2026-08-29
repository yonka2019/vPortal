/** The three storage calls this extension makes. Smaller than pulling in @types/chrome. */
type StorageArea = {
  get(key: string): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
  remove(key: string): Promise<void>
}

declare const chrome:
  | { storage?: { local?: StorageArea }; runtime?: { getURL(path: string): string } }
  | undefined
declare const browser: typeof chrome
