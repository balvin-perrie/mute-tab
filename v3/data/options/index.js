chrome.storage.local.get({
  'unmute-list': [],
  'open-mode': 'popup',
  'page-context': false,
  'tab-context': false
}).then(prefs => {
  document.getElementById('unmute-list').value = prefs['unmute-list'].join(', ');
  document.getElementById('open-mode').value = prefs['open-mode'];
  document.getElementById('page-context').checked = prefs['page-context'];
  document.getElementById('tab-context').checked = prefs['tab-context'];
});

document.getElementById('save').onclick = async () => {
  const hosts = document.getElementById('unmute-list').value.split(/\s*,\s*/).filter((s, n, l) => {
    return s && l.indexOf(s) === n;
  });
  if (hosts.length) {
    try {
      await chrome.permissions.request({
        origins: ['*://*/*']
      });
    }
    catch (e) {}
  }
  await chrome.storage.local.set({
    'unmute-list': hosts,
    'open-mode': document.getElementById('open-mode').value,
    'page-context': document.getElementById('page-context').checked,
    'tab-context': document.getElementById('tab-context').checked
  });
  const toast = document.getElementById('toast');
  toast.textContent = 'Options saved';
  setTimeout(() => toast.textContent = '', 1000);
};

document.getElementById('faqs').onclick = () => chrome.tabs.create({
  url: chrome.runtime.getManifest().homepage_url
});
