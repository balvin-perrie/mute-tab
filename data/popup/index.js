'use strict';

document.addEventListener('click', e => {
  const command = e.target.dataset.command;
  if (command) {
    chrome.runtime.sendMessage({
      command,
      forced: e.shiftKey
    });
  }
});
