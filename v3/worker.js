'use strict';

const query = opts => chrome.tabs.query(opts);

const action = async (command, forced = false) => {
  if (command === 'faqs') {
    return chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url
    });
  }
  const tabs = [];
  if (command === 'mute-tab' || command === 'unmute-tab') {
    forced = false;
    tabs.push(...await query({
      active: true,
      currentWindow: true
    }));
  }
  else if (
    command === 'mute-all-incognito-tabs' ||
    command === 'unmute-all-incognito-tabs'
  ) {
    tabs.push(...(await query({})).filter(t => t.incognito));
  }
  else if (
    command === 'mute-other-tabs-window' ||
    command === 'unmute-other-tabs-window' ||
    command === 'close-other-noisy-tabs-window'
  ) {
    tabs.push(...await query({
      active: false,
      currentWindow: true
    }));
  }
  else if (
    command === 'mute-tabs-other-windows' ||
    command === 'unmute-tabs-other-windows' ||
    command === 'close-noisy-tabs-other-windows'
  ) {
    tabs.push(...await query({
      currentWindow: false
    }));
  }
  else if (
    command === 'mute-all-other-tabs' ||
    command === 'unmute-all-other-tabs' ||
    command === 'close-all-other-noisy-tabs'
  ) {
    const tbs = await query({});
    const atb = (await query({
      active: true,
      currentWindow: true
    })).shift();
    tabs.push(...tbs.filter(t => atb ? t.id !== atb.id : true));
  }
  tabs.forEach(tab => {
    if (command.startsWith('close-')) {
      if (tab.audible) {
        chrome.tabs.remove(tab.id);
      }
    }
    else if (command.startsWith('mute-')) {
      if (forced) {
        if (tab.audible) {
          chrome.tabs.update(tab.id, {
            muted: true
          });
        }
      }
      else {
        chrome.tabs.update(tab.id, {
          muted: true
        });
      }
    }
    else {
      if (forced) {
        if (tab.audible || tab.mutedInfo.muted) {
          chrome.tabs.update(tab.id, {
            muted: false
          });
        }
      }
      else {
        chrome.tabs.update(tab.id, {
          muted: false
        });
      }
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

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
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