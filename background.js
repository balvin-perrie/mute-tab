'use strict';

var action = command => {
  if (command === 'faqs') {
    chrome.tabs.create({
      url: chrome.runtime.getManifest().homepage_url
    });
  }
  const query = {};
  if (command === 'mute-tab' || command === 'unmute-tab') {
    query.active = true;
    query.currentWindow = true;
  }
  else if (command === 'mute-other-tabs-window' || command === 'unmute-other-tabs-window') {
    query.active = false;
    query.currentWindow = true;
  }
  else if (command === 'mute-tabs-other-windows' || command === 'unmute-tabs-other-windows') {
    query.currentWindow = false;
  }
  else if (command === 'mute-all-other-tabs' || command === 'unmute-all-other-tabs') {
    query.active = false;
  }

  chrome.tabs.query(query, tabs => tabs.forEach(tab => chrome.tabs.update(tab.id, {
    muted: command.startsWith('mute')
  })));
};

chrome.runtime.onMessage.addListener(request => {
  const {command} = request;
  action(command);
});

chrome.commands.onCommand.addListener(action);

// FAQs
{
  const {onInstalled, setUninstallURL, getManifest} = chrome.runtime;
  const {name, version} = getManifest();
  const page = getManifest().homepage_url;
  onInstalled.addListener(({reason, previousVersion}) => {
    chrome.storage.local.get({
      'faqs': true,
      'last-update': 0
    }, prefs => {
      if (reason === 'install' || (prefs.faqs && reason === 'update')) {
        const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
        if (doUpdate && previousVersion !== version) {
          chrome.tabs.create({
            url: page + '?version=' + version +
              (previousVersion ? '&p=' + previousVersion : '') +
              '&type=' + reason,
            active: reason === 'install'
          });
          chrome.storage.local.set({'last-update': Date.now()});
        }
      }
    });
  });
  setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
}
