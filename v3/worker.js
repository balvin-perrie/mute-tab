'use strict';

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
  console.log(command, forced);

  if (command === 'faqs') {
    return chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url
    });
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
  }
};

chrome.storage.local.get({
  'silent-normal': false,
  'silent-incognito': false
}, prefs => {
  if (prefs['silent-normal']) {
    chrome.tabs.onCreated.removeListener(observe.normal);
    chrome.tabs.onCreated.addListener(observe.normal);
  }
  if (prefs['silent-incognito']) {
    chrome.tabs.onCreated.removeListener(observe.incognito);
    chrome.tabs.onCreated.addListener(observe.incognito);
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
});

/* context menu */
const contexts = b => {
  if (b) {
    chrome.contextMenus.onClicked.removeListener(contexts.onClicked);
    chrome.contextMenus.onClicked.addListener(contexts.onClicked);

    chrome.contextMenus.create({
      id: 'toggle-tab',
      title: 'Toggle Tab',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'toggle-other-tabs-window',
      title: 'Toggle Other Tabs in This Window',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'toggle-tabs-other-windows',
      title: 'Toggle Tabs in Other Windows',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'toggle-all-other-tabs',
      title: 'Toggle All Other Tabs',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'toggle-all-incognito-tabs',
      title: 'Toggle All Incognito Tabs',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'separator-0',
      contexts: ['page'],
      type: 'separator'
    });
    chrome.contextMenus.create({
      id: 'mute-tab',
      title: 'Mute Tab',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'mute-other-tabs-window',
      title: 'Mute Other Tabs in This Window',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'mute-tabs-other-windows',
      title: 'Mute Tabs in Other Windows',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'mute-all-other-tabs',
      title: 'Mute All Other Tabs',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'mute-all-incognito-tabs',
      title: 'Mute All Incognito Tabs',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'separator-1',
      contexts: ['page'],
      type: 'separator'
    });
    chrome.contextMenus.create({
      id: 'unmute-tab',
      title: 'Stop Muting Tab',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'unmute-other-tabs-window',
      title: 'Stop Muting Other Tabs in This Window',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'unmute-tabs-other-windows',
      title: 'Stop Muting Tabs in Other Windows',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'unmute-all-other-tabs',
      title: 'Stop Muting All Other Tabs',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'unmute-all-incognito-tabs',
      title: 'Stop Muting All Incognito Tabs',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'separator-2',
      contexts: ['page'],
      type: 'separator'
    });
    chrome.contextMenus.create({
      id: 'close-other-noisy-tabs-window',
      title: 'Close Other Noisy Tabs in This Window',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'close-noisy-tabs-other-windows',
      title: 'Close Noisy Tabs in Other Windows',
      contexts: ['page']
    });
    chrome.contextMenus.create({
      id: 'close-all-other-noisy-tabs',
      title: 'Close All Other Noisy Tabs',
      contexts: ['page']
    });
  }
  else {
    if (chrome.contextMenus) {
      chrome.contextMenus.onClicked.removeListener(contexts.onClicked);
      chrome.contextMenus.removeAll();
    }
  }
};
contexts.onClicked = info => action(info.menuItemId, false);

chrome.storage.onChanged.addListener(ps => {
  if (ps['page-context']) {
    contexts(ps['page-context'].newValue);
  }
});
{
  const once = () => {
    if (once.done) {
      return;
    }
    once.done = true;
    chrome.storage.local.get({
      'page-context': false
    }, prefs => contexts(prefs['page-context']));
  };

  chrome.runtime.onInstalled.addListener(once);
  chrome.runtime.onStartup.addListener(once);
}


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
