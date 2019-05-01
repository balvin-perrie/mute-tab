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
