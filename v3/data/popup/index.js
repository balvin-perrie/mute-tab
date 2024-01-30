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

const permission = () => chrome.permissions.request({
  permissions: ['contextMenus']
});

document.addEventListener('click', async e => {
  const command = e.target.dataset.command;
  if (command) {
    if (command.includes('incognito')) {
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
  'silent-incognito': false,
  'page-context': false
}, prefs => {
  document.getElementById('silent-normal').checked = prefs['silent-normal'];
  document.getElementById('silent-incognito').checked = prefs['silent-incognito'];
  document.getElementById('page-context').checked = prefs['page-context'];
});

document.getElementById('tools').addEventListener('change', async e => {
  if (e.target.id) {
    if (e.target.id.includes('incognito') && e.target.checked) {
      await validate();
    }
    if (e.target.id === 'page-context' && e.target.checked) {
      if (await permission() !== true) {
        e.target.checked = false;
        return;
      }
    }

    chrome.storage.local.set({
      [e.target.id]: e.target.checked
    });
  }
});
