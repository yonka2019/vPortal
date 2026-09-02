// Opens a new tab (which is this extension's page) right after install or update, so the
// result is visible without hunting for the + button. No url = the browser's default new
// tab = the override; creating a tab needs no `tabs` permission.
chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install' || reason === 'update') chrome.tabs.create({})
})
