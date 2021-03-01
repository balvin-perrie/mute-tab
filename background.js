'use strict';

const action = command => {
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
