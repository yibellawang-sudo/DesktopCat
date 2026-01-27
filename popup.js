
let todos = [];

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

//reminder type change
document.getElementById('reminderType').addEventListener('change', function(e) {
  const isTimeReminder = e.target.value === 'time';
  document.getElementById('reminderInterval').classList.toggle('hidden', isTimeReminder);
  document.getElementById('reminderTime').classList.toggle('hidden', !isTimeReminder);
});

//add todo
document.getElementById('addTodoBtn').addEventListener('click', addTodo);
document.getElementById('todoInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    addTodo();
  }
});
function addTodo() {
  const input = document.getElementById('todoInput');
  const text = input.value.trim();
  const reminderType = document.getElementById('reminderType').value;

  if (text) {
    const todo = {
      id: Date.now(),
      text: text,
      created: Date.now(),
      reminderType: reminderType
    };

    if (reminderType === 'interval') {
      todo.interval = parseInt(document.getElementById('reminderInterval').value);
      todo.lastReminded =Date.now();
    } else {
      todo.time = document.getElementById('reminderTime').value;
      todo.reminded = false;
    }

    todos.push(todo);
    saveTodos();
    renderTodos();
    input.value = '';

    //notify all tabs of new todos
    chrome.tabs.query({}, function(tabs) {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateTodos',
          todos: todos
        }).catch(() => {}); //ignore errors for tabs without content script
      });
    });
  }
}

//delete todos
  //notify all tabs

//save todos

//render todos

//format time

//escape html

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