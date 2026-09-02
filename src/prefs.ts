const NEW_TAB = 'vp_new_tab'
const EDITING = 'vp_editing'

/**
 * Whether links open in a new tab. Default on. `localStorage`, not `sessionStorage`: the
 * hosted version scoped this to one visitor's tab session, but a new-tab page opens a fresh
 * session every single time, so the choice was forgotten on every tab.
 */
export const opensInNewTab = () => {
  try {
    return localStorage.getItem(NEW_TAB) !== 'off'
  } catch {
    return true // private mode or storage disabled
  }
}

export const setOpensInNewTab = (on: boolean) => {
  try {
    if (on) localStorage.removeItem(NEW_TAB)
    else localStorage.setItem(NEW_TAB, 'off')
  } catch {
    // nothing to do — the toggle just won't persist
  }
}

const FREQUENT = 'vp_frequent'

/** Whether the "Most opened" strip shows. Visitor preference, default on. */
export const showsFrequent = () => {
  try {
    return localStorage.getItem(FREQUENT) !== 'off'
  } catch {
    return true
  }
}

export const setShowsFrequent = (on: boolean) => {
  try {
    if (on) localStorage.removeItem(FREQUENT)
    else localStorage.setItem(FREQUENT, 'off')
  } catch {
    // nothing to do — the toggle just won't persist
  }
}

/**
 * Whether this browser was last in edit mode. A convenience only — it just saves
 * clicking Edit on every new tab.
 */
export const wasEditing = () => {
  try {
    return localStorage.getItem(EDITING) === 'on'
  } catch {
    return false
  }
}

export const rememberEditing = (on: boolean) => {
  try {
    if (on) localStorage.setItem(EDITING, 'on')
    else localStorage.removeItem(EDITING)
  } catch {
    // same as above
  }
}
