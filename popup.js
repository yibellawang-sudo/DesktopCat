//update so that after the reminder time passes it turns grey & shows complete
let todos = [];

//load saved state
chrome.storage.sync.get(['catEnabled', 'todos'], function(result) {  
  const isEnabled = result.catEnabled !== false; 
  document.getElementById('catToggle').checked = isEnabled;
  updateStatus(isEnabled);
  
  // Load existing todos
  if (result.todos) {
    todos = result.todos;
    renderTodos();
  }
});

document.getElementById('catToggle').addEventListener('change', function(e) {
  const isEnabled = e.target.checked;
  
  chrome.storage.sync.set({ catEnabled: isEnabled }, function() {
    console.log('Cat enabled state saved:', isEnabled);
  });
  
  //send message to content script
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {  
      chrome.tabs.sendMessage(tabs[0].id, {
        action: isEnabled ? 'enableCat' : 'disableCat'
      });
    }
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
      todo.lastReminded = Date.now();
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
function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
  //notify all tabs
  chrome.tabs.query({}, function(tabs) {  
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateTodos',
        todos: todos
      }).catch(() => {});
    });
  });
}
  
//save todos
function saveTodos() {
  chrome.storage.sync.set({ todos: todos });
}

//render todos
function renderTodos() {
  const todoList = document.getElementById('todoList');

  if (todos.length === 0) {
    todoList.innerHTML = '<div class="empty-state">No reminders yet!</div>';
    return;  
  }
  
  todoList.innerHTML = todos.map(todo => {
    let reminderInfo = '';
    if (todo.reminderType === 'interval') {
      reminderInfo = `Every ${todo.interval} minutes`;  
    } else {
      reminderInfo = `At ${formatTime(todo.time)}`;
    }

    return `
      <div class="todo-item">
        <div class="todo-header">
          <span class="todo-text">${escapeHtml(todo.text)}</span>
          <button class="delete-btn" data-id="${todo.id}">Delete</button>
        </div>
        <div class="todo-reminder-info">${reminderInfo}</div>
      </div>
    `;
  }).join('');

  //delete listeners
  todoList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      deleteTodo(parseInt(this.dataset.id));
    });
  });
}

//format time
function formatTime(timeString) {
  const [hrs, mins] = timeString.split(':');
  const hr = parseInt(hrs);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const displayHr = hr % 12 || 12;
  return `${displayHr}:${mins} ${ampm}`;
}

//escape html
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateStatus(isEnabled) {
  const statusDiv = document.getElementById('status');
  if (isEnabled) {
    statusDiv.textContent = 'Cat is active on all pages';
    statusDiv.style.color = '#75c5f7';
  } else {
    statusDiv.textContent = 'Cat is disabled';
    statusDiv.style.color = '#999';
  }
}