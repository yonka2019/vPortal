import { Aurora } from './components/Aurora'
import { Hub } from './components/Hub'

/** One page, and it is the new tab. No routing: an extension page has no URL worth reading. */
export function App() {
  return (
    <>
      <Aurora />
      <Hub />
    </>
  )
}
