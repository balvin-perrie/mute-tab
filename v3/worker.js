'use strict';

if (typeof importScripts !== 'undefined') {
  self.importScripts('/context.js');
  self.importScripts('/watch.js');
}

const query = opts => chrome.tabs.query(opts);

const icon = (tabId, muted) => {
  chrome.action.setIcon({
    tabId,
    path: {
      '16': 'data/icons/' + (muted ? 'mute/' : '') + '16.png',
      '32': 'data/icons/' + (muted ? 'mute/' : '') + '32.png'
    }
  });
  chrome.action.setTitle({
    tabId,
    title: muted ? 'Tab is muted' : 'Tab can play audio'
  });
};

const action = async (command, forced = false) => {
  if (command === 'faqs') {
    return chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url
    });
  }

  if (command === 'focus-mode') {
    const atb = (await query({
      active: true,
      currentWindow: true
    })).shift();
    chrome.tabs.update(atb.id, {
      muted: false
    });
    icon(atb.id, false);

    // switch to mute-all-other-tabs
    command = 'mute-all-other-tabs';
  }

  const tabs = new Set();
  if (command === 'mute-tab' || command === 'unmute-tab' || command === 'toggle-tab') {
    forced = false;
    for (const tab of await query({active: true, currentWindow: true})) {
      tabs.add(tab);
    }
  }
  else if (
    command === 'mute-all-incognito-tabs' ||
    command === 'unmute-all-incognito-tabs' ||
    command === 'toggle-all-incognito-tabs'
  ) {
    for (const tab of await query({})) {
      if (tab.incognito) {
        tabs.add(tab);
      }
    }
  }
  else if (
    command === 'mute-other-tabs-window' ||
    command === 'unmute-other-tabs-window' ||
    command === 'toggle-other-tabs-window' ||
    command === 'close-other-noisy-tabs-window'
  ) {
    for (const tab of await query({active: false, currentWindow: true})) {
      tabs.add(tab);
    }
  }
  else if (
    command === 'mute-tabs-other-windows' ||
    command === 'unmute-tabs-other-windows' ||
    command === 'toggle-tabs-other-windows' ||
    command === 'close-noisy-tabs-other-windows'
  ) {
    for (const tab of await query({currentWindow: false})) {
      tabs.add(tab);
    }
  }
  else if (
    command === 'mute-all-other-tabs' ||
    command === 'unmute-all-other-tabs' ||
    command === 'toggle-all-other-tabs' ||
    command === 'close-all-other-noisy-tabs'
  ) {
    const tbs = await query({});
    const atb = (await query({
      active: true,
      currentWindow: true
    })).shift();
    for (const tab of tbs) {
      if (atb) {
        if (tab.id !== atb.id) {
          tabs.add(tab);
        }
      }
      else {
        tabs.add(tab);
      }
    }
  }
  // convert "toggle-" to "mute-" or "unmute-"
  if (command.startsWith('toggle-')) {
    let b = false;
    for (const tab of tabs) {
      if (forced) {
        if (tab.audible === false) {
          continue;
        }
      }
      if (tab.mutedInfo.muted === false) {
        b = true;
        break;
      }
    }
    command = command.replace('toggle-', b ? 'mute-' : 'unmute-');
  }
  // apply forced filter
  if (forced) {
    if (command.startsWith('mute-')) {
      for (const tab of tabs) {
        if (tab.audible === false) {
          tabs.delete(tab);
        }
      }
    }
    else if (command.startsWith('unmute-')) {
      for (const tab of tabs) {
        if (tab.audible === false && tab.mutedInfo.muted === false) {
          tabs.delete(tab);
        }
      }
    }
  }

  tabs.forEach(tab => {
    if (command.startsWith('close-')) {
      if (tab.audible) {
        chrome.tabs.remove(tab.id);
      }
    }
    else if (command.startsWith('mute-')) {
      icon(tab.id, true);
      chrome.tabs.update(tab.id, {
        muted: true
      });
    }
    else {
      icon(tab.id, false);
      chrome.tabs.update(tab.id, {
        muted: false
      });
    }
  });
};

chrome.runtime.onMessage.addListener((request, sender, response) => {
  const {command, forced} = request;
  action(command, forced);

  response(true);
});
chrome.commands.onCommand.addListener(command => action(command, false));

/* Monitor and Mute */
const observe = {
  normal(tab) {
    if (tab.incognito === false) {
      chrome.tabs.update(tab.id, {
        muted: true
      });
    }
  },
  incognito(tab) {
    if (tab.incognito) {
      chrome.tabs.update(tab.id, {
        muted: true
      });
    }
  },
  async unmute(tabId, info, tab) {
    if (info.status === 'complete') {
      try {
        const {hostname} = new URL(tab.url);
        if (hostname) {
          const prefs = await chrome.storage.local.get({
            'unmute-list': []
          });
          if (prefs['unmute-list'].some(s => hostname.includes(s))) {
            console.info('[unmuting]', tab.url);
            chrome.tabs.update(tab.id, {
              muted: false
            });
          }
        }
      }
      catch (e) {}
    }
  }
};

chrome.storage.local.get({
  'silent-normal': false,
  'silent-incognito': false,
  'unmute-list': []
}, prefs => {
  chrome.tabs.onCreated.removeListener(observe.normal);
  if (prefs['silent-normal']) {
    chrome.tabs.onCreated.addListener(observe.normal);
  }
  chrome.tabs.onCreated.removeListener(observe.incognito);
  if (prefs['silent-incognito']) {
    chrome.tabs.onCreated.addListener(observe.incognito);
  }
  chrome.tabs.onUpdated.removeListener(observe.unmute);
  if (prefs['unmute-list'].length > 0) {
    chrome.tabs.onUpdated.addListener(observe.unmute);
  }
});
chrome.storage.onChanged.addListener(ps => {
  if (ps['silent-normal']) {
    chrome.tabs.onCreated.removeListener(observe.normal);
    if (ps['silent-normal'].newValue === true) {
      chrome.tabs.onCreated.addListener(observe.normal);
    }
  }
  if (ps['silent-incognito']) {
    chrome.tabs.onCreated.removeListener(observe.incognito);
    if (ps['silent-incognito'].newValue === true) {
      chrome.tabs.onCreated.addListener(observe.incognito);
    }
  }
  if (ps['unmute-list']) {
    chrome.tabs.onUpdated.removeListener(observe.unmute);
    if (ps['unmute-list'].newValue.length > 0) {
      chrome.tabs.onUpdated.addListener(observe.unmute);
    }
  }
});

// Simple/Interface modes
{
  const startup = async () => {
    if (startup.done) {
      return;
    }
    startup.done = true;
    const prefs = await chrome.storage.local.get({
      'open-mode': 'popup'
    });
    chrome.action.setPopup({
      popup: prefs['open-mode'] === 'popup' ? '/data/popup/index.html' : ''
    });
  };
  chrome.runtime.onStartup.addListener(startup);
  chrome.runtime.onInstalled.addListener(startup);
}
chrome.storage.onChanged.addListener(ps => {
  if (ps['open-mode']) {
    chrome.action.setPopup({
      popup: ps['open-mode'].newValue === 'popup' ? '/data/popup/index.html' : ''
    });
  }
});
chrome.action.onClicked.addListener(() => chrome.storage.local.get({
  'open-mode': 'toggle-tab'
}).then(prefs => action(prefs['open-mode'], false)));

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const {homepage_url: page, name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, lastFocusedWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
