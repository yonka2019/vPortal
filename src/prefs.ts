const NEW_TAB = 'vp_new_tab'
const EDITING = 'vp_editing'

/** Visitor preference, not admin config: each person decides, kept for their tab session. */
export const opensInNewTab = () => {
  try {
    return sessionStorage.getItem(NEW_TAB) !== 'off'
  } catch {
    return true // private mode or storage disabled
  }
}

export const setOpensInNewTab = (on: boolean) => {
  try {
    sessionStorage.setItem(NEW_TAB, on ? 'on' : 'off')
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
