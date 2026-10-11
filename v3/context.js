/* global action */

const buildMenu = async () => {
  const prefs = await chrome.storage.local.get({
    'page-context': false,
    'tab-context': false
  });

  const contexts = [];
  if (prefs['page-context']) {
    contexts.push('page');
  }
  if (prefs['tab-context'] && 'TAB' in chrome.contextMenus.ContextType) {
    contexts.push('tab');
  }
  for (const id of [
    'toggle-tab', 'toggle-other-tabs-window', 'toggle-tabs-other-windows', 'toggle-all-other-tabs',
    'toggle-all-incognito-tabs', 'separator-0', 'mute-tab', 'mute-other-tabs-window', 'mute-tabs-other-windows',
    'mute-all-other-tabs', 'mute-all-incognito-tabs', 'separator-1', 'unmute-tab', 'unmute-other-tabs-window',
    'unmute-tabs-other-windows', 'unmute-all-other-tabs', 'unmute-all-incognito-tabs', 'separator-2',
    'close-other-noisy-tabs-window', 'close-noisy-tabs-other-windows', 'close-all-other-noisy-tabs'
  ]) {
    chrome.contextMenus.remove(id).catch(() => {});
  }

  if (contexts.length) {
    chrome.contextMenus.create({
      id: 'toggle-tab',
      title: 'Toggle Mute',
      contexts
    });
    chrome.contextMenus.create({
      id: 'toggle-other-tabs-window',
      title: 'Toggle Mute for Other Tabs in This Window',
      contexts
    });
    chrome.contextMenus.create({
      id: 'toggle-tabs-other-windows',
      title: 'Toggle Mute for Tabs in Other Windows',
      contexts
    });
    chrome.contextMenus.create({
      id: 'toggle-all-other-tabs',
      title: 'Toggle Mute for All Other Tabs',
      contexts
    });
    chrome.contextMenus.create({
      id: 'toggle-all-incognito-tabs',
      title: 'Toggle Mute for All Incognito Tabs',
      contexts
    });
    chrome.contextMenus.create({
      id: 'separator-0',
      contexts,
      type: 'separator'
    });
    chrome.contextMenus.create({
      id: 'mute-tab',
      title: 'Mute Tab',
      contexts
    });
    chrome.contextMenus.create({
      id: 'mute-other-tabs-window',
      title: 'Mute Other Tabs in This Window',
      contexts
    });
    chrome.contextMenus.create({
      id: 'mute-tabs-other-windows',
      title: 'Mute Tabs in Other Windows',
      contexts
    });
    chrome.contextMenus.create({
      id: 'mute-all-other-tabs',
      title: 'Mute All Other Tabs',
      contexts
    });
    chrome.contextMenus.create({
      id: 'mute-all-incognito-tabs',
      title: 'Mute All Incognito Tabs',
      contexts
    });
    chrome.contextMenus.create({
      id: 'separator-1',
      contexts,
      type: 'separator'
    });
    chrome.contextMenus.create({
      id: 'unmute-tab',
      title: 'Stop Muting Tab',
      contexts
    });
    chrome.contextMenus.create({
      id: 'unmute-other-tabs-window',
      title: 'Stop Muting Other Tabs in This Window',
      contexts
    });
    chrome.contextMenus.create({
      id: 'unmute-tabs-other-windows',
      title: 'Stop Muting Tabs in Other Windows',
      contexts
    });
    chrome.contextMenus.create({
      id: 'unmute-all-other-tabs',
      title: 'Stop Muting All Other Tabs',
      contexts
    });
    chrome.contextMenus.create({
      id: 'unmute-all-incognito-tabs',
      title: 'Stop Muting All Incognito Tabs',
      contexts
    });
    chrome.contextMenus.create({
      id: 'separator-2',
      contexts,
      type: 'separator'
    });
    chrome.contextMenus.create({
      id: 'close-other-noisy-tabs-window',
      title: 'Close Other Noisy Tabs in This Window',
      contexts
    });
    chrome.contextMenus.create({
      id: 'close-noisy-tabs-other-windows',
      title: 'Close Noisy Tabs in Other Windows',
      contexts
    });
    chrome.contextMenus.create({
      id: 'close-all-other-noisy-tabs',
      title: 'Close All Other Noisy Tabs',
      contexts
    });
  }
};
chrome.contextMenus.onClicked.addListener(info => action(info.menuItemId.replace('-alt', ''), false));

{
  const once = () => {
    if (once.done) {
      return;
    }
    once.done = true;

    // action
    chrome.contextMenus.create({
      id: 'toggle',
      title: 'Toggle',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'toggle-tab-alt',
      title: 'Toggle Mute',
      contexts: ['action'],
      parentId: 'toggle'
    });
    chrome.contextMenus.create({
      id: 'toggle-other-tabs-window-alt',
      title: 'Toggle Mute for Other Tabs in This Window',
      contexts: ['action'],
      parentId: 'toggle'
    });
    chrome.contextMenus.create({
      id: 'toggle-tabs-other-windows-alt',
      title: 'Toggle Mute for Tabs in Other Windows',
      contexts: ['action'],
      parentId: 'toggle'
    });
    chrome.contextMenus.create({
      id: 'toggle-all-other-tabs-alt',
      title: 'Toggle Mute for All Other Tabs',
      contexts: ['action'],
      parentId: 'toggle'
    });
    chrome.contextMenus.create({
      id: 'toggle-all-incognito-tabs-alt',
      title: 'Toggle Mute for All Incognito Tabs',
      contexts: ['action'],
      parentId: 'toggle'
    });

    chrome.contextMenus.create({
      id: 'mute',
      title: 'Mute',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'mute-tab-alt',
      title: 'Mute Tab',
      contexts: ['action'],
      parentId: 'mute'
    });
    chrome.contextMenus.create({
      id: 'mute-other-tabs-window-alt',
      title: 'Mute Other Tabs in This Window',
      contexts: ['action'],
      parentId: 'mute'
    });
    chrome.contextMenus.create({
      id: 'mute-tabs-other-windows-alt',
      title: 'Mute Tabs in Other Windows',
      contexts: ['action'],
      parentId: 'mute'
    });
    chrome.contextMenus.create({
      id: 'mute-all-other-tabs-alt',
      title: 'Mute All Other Tabs',
      contexts: ['action'],
      parentId: 'mute'
    });
    chrome.contextMenus.create({
      id: 'mute-all-incognito-tabs-alt',
      title: 'Mute All Incognito Tabs',
      contexts: ['action'],
      parentId: 'mute'
    });

    chrome.contextMenus.create({
      id: 'unmute',
      title: 'Stop Muting',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'unmute-tab',
      title: 'Stop Muting Tab',
      contexts: ['action'],
      parentId: 'unmute'
    });
    chrome.contextMenus.create({
      id: 'unmute-other-tabs-window-alt',
      title: 'Stop Muting Other Tabs in This Window',
      contexts: ['action'],
      parentId: 'unmute'
    });
    chrome.contextMenus.create({
      id: 'unmute-tabs-other-windows-alt',
      title: 'Stop Muting Tabs in Other Windows',
      contexts: ['action'],
      parentId: 'unmute'
    });
    chrome.contextMenus.create({
      id: 'unmute-all-other-tabs-alt',
      title: 'Stop Muting All Other Tabs',
      contexts: ['action'],
      parentId: 'unmute'
    });
    chrome.contextMenus.create({
      id: 'unmute-all-incognito-tabs-alt',
      title: 'Stop Muting All Incognito Tabs',
      contexts: ['action'],
      parentId: 'unmute'
    });

    chrome.contextMenus.create({
      id: 'close',
      title: 'Close',
      contexts: ['action']
    });
    chrome.contextMenus.create({
      id: 'close-other-noisy-tabs-window-alt',
      title: 'Close Other Noisy Tabs in This Window',
      contexts: ['action'],
      parentId: 'close'
    });
    chrome.contextMenus.create({
      id: 'close-noisy-tabs-other-windows-alt',
      title: 'Close Noisy Tabs in Other Windows',
      contexts: ['action'],
      parentId: 'close'
    });
    chrome.contextMenus.create({
      id: 'close-all-other-noisy-tabs-alt',
      title: 'Close All Other Noisy Tabs',
      contexts: ['action'],
      parentId: 'close'
    });

    buildMenu();
  };

  chrome.runtime.onInstalled.addListener(once);
  chrome.runtime.onStartup.addListener(once);
}

chrome.storage.onChanged.addListener(ps => {
  if (ps['page-context'] || ps['tab-context']) {
    buildMenu();
  }
});
