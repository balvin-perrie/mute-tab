chrome.storage.local.get({
  'unmute-list': []
}).then(prefs => {
  document.getElementById('unmute-list').value = prefs['unmute-list'].join(', ');
});

document.getElementById('save').onclick = () => chrome.storage.local.set({
  'unmute-list': document.getElementById('unmute-list').value.split(/\s*,\s*/).filter((s, n, l) => {
    return s && l.indexOf(s) === n;
  })
}).then(() => {
  const toast = document.getElementById('toast');
  toast.textContent = 'Options saved';
  setTimeout(() => toast.textContent = '', 1000);
});
