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

const permission = () => new Promise(resolve => {
  try {
    chrome.permissions.request({
      permissions: ['contextMenus']
    }, resolve);
  }
  catch (e) { // Firefox
    resolve(true);
  }
});

const list = async () => {
  const tabs = await chrome.tabs.query({});
  const t = document.getElementById('entry');

  document.body.setAttribute('tabs-ready', true);
  if (tabs.some(t => t.audible)) {
    document.body.setAttribute('tabs', true);
  }

  for (const tab of tabs) {
    if (tab.audible === false) {
      continue;
    }
    const clone = document.importNode(t.content, true);
    const a = clone.querySelector('a');
    const b = tab.mutedInfo?.muted;
    a.setAttribute('muted', b);
    a.title = tab.title + (b ? ' (muted)' : '');
    a.dataset.tid = tab.id;
    a.dataset.wid = tab.windowId;
    a.dataset.command = 'focus-tab';
    clone.querySelector('img').src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${tab.url}&size=32`;

    document.querySelector('.tabs').append(clone);
  }
};

document.addEventListener('click', async e => {
  let command = e.target.dataset.command;
  if (command === 'tabs-permission') {
    chrome.permissions.request({
      permissions: ['tabs', 'favicon']
    }, granted => {
      if (granted) {
        list();
      }
    });
  }
  else if (command === 'focus-tab') {
    chrome.tabs.update(Number(e.target.dataset.tid), {
      active: true
    });
    chrome.windows.update(Number(e.target.dataset.wid), {
      focused: true
    });
  }
  else if (command) {
    if (command.includes('incognito')) {
      await validate();
    }

    if (command.startsWith('toggle-')) {
      if (e.ctrlKey || e.metaKey) {
        command = command.replace('toggle-', 'mute-');
      }
      else if (e.altKey) {
        command = command.replace('toggle-', 'unmute-');
      }
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

chrome.permissions.contains({
  permissions: ['tabs', 'favicon']
}, granted => {
  if (granted) {
    list();
  }
});
