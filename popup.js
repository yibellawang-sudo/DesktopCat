//load saved state
chrome.storage.sync.get(['catEnabled'], function(result) {
  const isEnabled = result.catEnabled !== false; 
  document.getElementById('catToggle').checked = isEnabled;
  updateStatus(isEnabled);
});

document.getElementById('catToggle').addEventListener('change', function(e) {
  const isEnabled = e.target.checked;
  
  chrome.storage.sync.set({ catEnabled: isEnabled }, function() {
    console.log('Cat enabled state saved:', isEnabled);
  });
  
  //send message to content script
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: isEnabled ? 'enableCat' : 'disableCat'
    });
  });
  
  updateStatus(isEnabled);
});

function updateStatus(isEnabled) {
  const statusDiv = document.getElementById('status');
  if (isEnabled) {
    statusDiv.textContent = 'Cat is active on all pages';
    statusDiv.style.color = '#4CAF50';
  } else {
    statusDiv.textContent = 'Cat is disabled';
    statusDiv.style.color = '#999';
  }
}