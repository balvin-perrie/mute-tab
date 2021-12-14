'use strict';

const validate = () => new Promise(resolve => chrome.extension.isAllowedIncognitoAccess(a => {
  if (a === false) {
    alert('Please enable Incognito access!');
    chrome.tabs.create({
      'url': 'chrome://extensions/?id=' + chrome.runtime.id
    });
  }
  resolve();
}));

document.addEventListener('click', async e => {
  const command = e.target.dataset.command;
  if (command) {
    if (command.indexOf('incognito') !== -1) {
      await validate();
    }

    chrome.runtime.sendMessage({
      command,
      forced: e.shiftKey
    }, () => window.close());
  }
});

chrome.storage.local.get({
  'silent-normal': false,
  'silent-incognito': false
}, prefs => {
  document.getElementById('silent-normal').checked = prefs['silent-normal'];
  document.getElementById('silent-incognito').checked = prefs['silent-incognito'];
});

document.getElementById('tools').addEventListener('change', async e => {
  if (e.target.id) {
    if (e.target.id.indexOf('incognito') !== -1 && e.target.checked) {
      await validate();
    }

    chrome.storage.local.set({
      [e.target.id]: e.target.checked
    });
  }
});
