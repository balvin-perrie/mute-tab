'use strict';

/**
 * Watch Mode: mutes all tabs except the currently active one,
 * across all browser windows.
 */

{
  const KEY = 'watch-muted';

  const muted = new Set(); // tab ids muted by the watcher
  let enabled = false;

  // Persist the muted list so it survives service-worker restarts.
  // chrome.storage.session lives in memory, but outlives the worker;
  // it is cleared when the browser exits.
  const save = () => chrome.storage.session.set({
    [KEY]: [...muted]
  }).catch(() => {});

  const mute = tabId => {
    console.log(tabId, 'mute');
    muted.add(tabId);
    save();
    chrome.tabs.update(tabId, {
      muted: true
    });
  };

  const unmute = tabId => {
    console.log(tabId, 'unmute');
    muted.delete(tabId);
    save();
    chrome.tabs.update(tabId, {
      muted: false
    });
  };

  const apply = async () => {
    if (enabled === false) {
      return;
    }
    const [atb] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true
    });
    for (const tab of await chrome.tabs.query({})) {
      if (atb && tab.id === atb.id) {
        unmute(tab.id);
      }
      else if (tab.mutedInfo?.muted === false) {
        mute(tab.id);
      }
    }
  };

  const onActivated = () => apply();
  const onFocusChanged = windowId => {
    // -1 when a window loses focus; only care about focus gains
    if (windowId !== chrome.windows.WINDOW_ID_NONE) {
      apply();
    }
  };
  const onRemoved = tabId => {
    if (muted.delete(tabId)) {
      save();
    }
  };

  const activate = () => {
    chrome.tabs.onActivated.removeListener(onActivated);
    chrome.windows.onFocusChanged.removeListener(onFocusChanged);
    chrome.tabs.onRemoved.removeListener(onRemoved);
    if (enabled) {
      chrome.tabs.onActivated.addListener(onActivated);
      chrome.windows.onFocusChanged.addListener(onFocusChanged);
      chrome.tabs.onRemoved.addListener(onRemoved);
      apply();
    }
    else {
      // restore tabs muted by the watcher
      for (const tabId of muted) {
        unmute(tabId);
      }
      muted.clear();
      save();
    }
  };

  // load persisted list first, then the preference
  const init = async () => {
    try {
      const o = await chrome.storage.session.get({
        [KEY]: []
      });
      for (const tabId of o[KEY]) {
        muted.add(tabId);
      }
    }
    catch (e) {}

    const prefs = await chrome.storage.local.get({
      'watch-mode': false
    });
    enabled = prefs['watch-mode'];
    activate();
  };
  init();
  init.then(() => init.done = true);

  chrome.storage.onChanged.addListener(ps => {
    if (ps['watch-mode']) {
      enabled = ps['watch-mode'].newValue;
      // ignore if init() has not loaded the persisted list yet;
      // init() will apply the correct state
      if (init.done) {
        activate();
      }
    }
  });
}
