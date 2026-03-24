//REMINDER DATA
let reminderData = {
  todos: []
};
let cat, catSprite, catState, setAnimation; 
let currentBreed = 'ragdoll';

//IMG HELPER
const getImageUrl = (filename) => {
  return chrome.runtime.getURL("assets/" + filename); 
};

//SPRITE CONFIG

function getSpriteConfig(breed) {
  return {
    frameWidth: 256,
    frameHeight: 256,
    
    animations: {
      sitting: {
        file: `${breed}/sitting.png`,
        frames: 1,
        fps: 0
      },
      walking: {
        file: `${breed}/walking seq.png`,
        frames: 2,
        fps: 3
      },
      sleeping: {
        file: `${breed}/sleep seq.png`,
        frames: 5,
        fps: 3
      },
      grabbed: {
        file: `${breed}/pickup.png`,
        frames: 1,
        fps: 0
      },
      lying: {
        file: `${breed}/cat lying.png`,
        frames: 1,
        fps: 0
      },
      sad: {
        file: `${breed}/sad.png`, 
        frames: 1,
        fps: 0
      },
      peek: {
        file: `${breed}/peek.png`, 
        frames: 1,
        fps: 0
      }
    }
  };
}

let SPRITE_CONFIG = getSpriteConfig(currentBreed);

//SPEECH BUBBELE
const speechBubble = document.createElement('div');
speechBubble.id = 'cat-speech-bubble';
speechBubble.style.cssText = `
  position: fixed;
  background: white;
  border: 3px solid #333;
  border-radius: 15px;
  padding: 12px 16px;
  font-family: 'Coin', sans-serif;
  font-size: 16px;
  color: #333;
  max-width: 250px;
  display: none;
  z-index: 2147483646;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  pointer-events: none;
`;

function buildBubbleTail(bubble) {
  const tail = document.createElement('div');
  tail.style.cssText = `
    position: absolute;
    bottom: -10px;
    left: 20px;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid #333;
  `;
  const tailInner = documnet.createElement('div');
  tailInner.style.cssText = `
    position: absolute;
    bottom: 2px;
    left: -8px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid white;
  `;
  tail.appendChild(tailInner);
  bubble.appendChild(tail);
}

function initSpeechBubble() {
  document.boby.appendChild(speechBubble);
  buildBubbleTail(speechBubble);
}

//SNOOZE BTN
let snoozedReminder = null;
let snoozeTimeout = null;

function addSnoozeBtn(bubble, text) {
  const snooxeBtn = document.createElement('button');
  snoozeBtn.textContent = '💤 Snooze 10min';
  snoozeBtn.style.cssText = `
    display: clock;
    margin-top: 8px;
    padding = 4px 10px;
    background = #75c5f7;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    cursor: pointer;
    font-family: 'Coin, sans-serif;
    pointer-events: auto;
  `;
  snoozeBtn.addEventListener('click', (e) =>{
    e.stopPropagation();
    bubble.style.display = 'none';
    catState.isSitting = false;

    if(snoozeTimeout) clearTimeout(snoozeTimeout);
    snoozeTimeout = setTimeout(() => {
      showReminder(text);
    }, 10*60*1000);
  });
  bubble.appendChild(snoozeBtn);
}

//SHOW REMINDER
function showReminder(text) {
  if (!cat) return; // Safety check
  
  // Make cat sit down and stop moving
  catState.isSitting = true;
  catState.velocityX = 0;
  setAnimation('sitting');
  
  speechBubble.innerHTML = ''; //clear
  buildBubbleTail(speechBubble);
  
  //text container
  const textContainer = document.createElement('span');
  speechBubble.appendChild(textContainer);
  
  speechBubble.style.display = 'block';
  
  function updateBubblePosition() {
    if (!cat) return;
    const catRect = cat.getBoundingClientRect();
    speechBubble.style.left = (catRect.left + catRect.width / 2 - 90) + 'px';
    speechBubble.style.top = (catRect.top - speechBubble.offsetHeight -10) + 'px';
  }

  updateBubblePosition();
  
  //update position continuously while visible
  const positionInterval = setInterval(updateBubblePosition, 50);
  
  let currentIndex = 0;
  
  function typeNextCharacter() {
    if (currentIndex < text.length) {
      textContainer.textContent += text[currentIndex++];
      updateBubblePosition(); 
      setTimeout(typeNextCharacter, 50);
    } else {
      // Add snooze button after typing finishes
      addSnoozeButton(speechBubble, text);
      updateBubblePosition();

      setTimeout(() => {
        setAnimation('happy');
        
        //hide bubble & resume normal behavior after 5 seconds
        setTimeout(() => {
          speechBubble.style.display = 'none';
          clearInterval(positionInterval); //stop updating position
          catState.isSitting = false;
          if (catState && !catState.isDragging && !catState.isNapping && setAnimation) {
            setAnimation('sitting');
          }
        }, 5000);
      }, 500);
    }
  }
  typeNextCharacter();
}

//FLOATING HEART
function spawnHeart() {
  if (!cat) return;
  const heart = document.createElement('img');
  heart.src = getImageUrl('heart.png');
  heart.style.cssText = `
    position: fixed;
    width: 32px;
    height: 32px;
    image-rendering: pixelated;
    pointer-events: none;
    z-index: 2147483645;
    transition: opacity 1s ease, transform 1s ease;
  `;
  const catRect = cat.getBoundingClientRect();
  heart.style.left = (catRect.left + catRect.width / 2 - 16) + 'px';
  heart.style.top  = (catRect.top - 10) + 'px';
  document.body.appendChild(heart);
 
  requestAnimationFrame(() => {
    heart.style.opacity = '0';
    heart.style.transform = 'translateY(-40px) scale(1.4)';
  });
 
  setTimeout(() => heart.remove(), 1100);
}

// TREAT
let treatEl = null;
let catIsEating = false;
 
function spawnTreat(x, y) {
  if (treatEl) return; //only one treat at a time
 
  treatEl = document.createElement('img');
  treatEl.src = getImageUrl('fish.png');
  treatEl.style.cssText = `
    position: fixed;
    width: 64px;
    height: 64px;
    left: ${x - 32}px;
    top:  ${y - 32}px;
    image-rendering: pixelated;
    pointer-events: none;
    z-index: 2147483645;
  `;
  document.body.appendChild(treatEl);
}
 /*
function checkTreatProximity() {
  if (!treatEl || catIsEating) return;
 
  const catCenterX = catState.x + 128;
  const catCenterY = catState.y + 128;
  const treatX = parseFloat(treatEl.style.left) + 32;
  const treatY = parseFloat(treatEl.style.top)  + 32;
  const dist = Math.hypot(catCenterX - treatX, catCenterY - treatY);
 
  if (dist < 80) {
    catIsEating = true;
    catState.isSitting = true;
    catState.velocityX = 0;
    setAnimation('eating');
 
    setTimeout(() => {
      if (treatEl) { treatEl.remove(); treatEl = null; }
      catIsEating = false;
      catState.isSitting = false;
      catState.energy = Math.min(100, catState.energy + 40);
      setAnimation('happy');
      setTimeout(() => { if (!catState.isDragging) setAnimation('sitting'); }, 1000);
    }, 1500);
  }
} */
 
//SAD
let petCount = 0;
let lastPetTime = Date.now();
 
function getMoodLevel() {
  // 0 = very sad, 1 = neutral, above 1 = happy
  const minutesSincePet = (Date.now() - lastPetTime) / 60000;
  if (minutesSincePet > 30) return 0;
  if (minutesSincePet > 10) return 0.5;
  return 1;
}
 
function applyMoodFilter() {
  if (!catSprite) return;
  const mood = getMoodLevel();
  if (mood === 0) {
    catSprite.style.filter = 'grayscale(70%) brightness(0.85)';
  } else if (mood === 0.5) {
    catSprite.style.filter = 'grayscale(30%)';
  } else {
    catSprite.style.filter = 'none';
  }
}
 
//CURSOR AVOIDANCE
let mouseX = -999, mouseY = -999;
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});
 
function checkCursorAvoidance() {
  if (catState.isDragging || catState.isNapping || catState.isSitting || catIsEating) return;
 
  const catCenterX = catState.x + 64;
  const catCenterY = catState.y + 64;
  const dist = Math.hypot(catCenterX - mouseX, catCenterY - mouseY);
 
  if (dist < 100) {
    //scoot away from cursor
    const dx = catCenterX - mouseX;
    catState.velocityX = dx > 0 ? 3 : -3;
    setAnimation('scared');
  }
}
 
//PEEK
let isPeeking = false;
let peekTimeout = null;
 
function tryPeek() {
  if (isPeeking || catState.isDragging || catState.isNapping || catState.isSitting || catIsEating) return;
  if (Math.random() > 0.0002) return; //rare trigger
 
  isPeeking = true;
  const peekFromLeft = Math.random() > 0.5;
 
  //cat off-screen
  catState.velocityX = 0;
  catState.x = peekFromLeft ? -220 : window.innerWidth - 36;
  catState.y = window.innerHeight - 180;
  catState.facingRight = peekFromLeft;
  setAnimation('peek');
 
  if (peekTimeout) clearTimeout(peekTimeout);
  peekTimeout = setTimeout(() => {
    isPeeking = false;
    //walk back onto screen
    catState.velocityX = peekFromLeft ? 2 : -2;
    setAnimation('walking');
  }, 3000 + Math.random() * 2000);
}

//REMINDERS FUNCTIONALITY
function checkReminders() {
  if (reminderData.todos.length === 0) return;
  
  const now = Date.now();
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  
  reminderData.todos.forEach(todo => {
    if (todo.reminderType === 'interval') {
      //interval-based reminders
      const timeSinceLastReminder = now - (todo.lastReminded || todo.created);
      const intervalMs = todo.interval * 60 * 1000;
      
      if (timeSinceLastReminder >= intervalMs) {
        showReminder(`${todo.text}`);
        todo.lastReminded = now;
        
        //update storage
        chrome.storage.sync.set({ todos: reminderData.todos });
      }
    } else {
      //time-based reminders
      const [todoHour, todoMinute] = todo.time.split(':').map(Number);
      
      if (currentHour === todoHour && currentMinute === todoMinute && !todo.reminded) {
        showReminder(`${todo.text}`);
        todo.reminded = true;
        
        chrome.storage.sync.set({ todos: reminderData.todos });
      }
      
      if ((currentHour === 0 && currentMinute === 0) || 
          (currentHour > todoHour || (currentHour === todoHour && currentMinute > todoMinute))) {
        if (currentHour === 0 && currentMinute === 0) {
          todo.reminded = false;
        }
      }
    }
  });
}

chrome.storage.sync.get(['todos'], function(result) {
  if (result.todos) {
    reminderData.todos = result.todos;
    console.log('Loaded todos:', reminderData.todos);
  }
});

//wait for the page to be ready
function initCat() {
  console.log('Initializing cat...');
  initSpeechBubble();
  
  //create cat element
  cat = document.createElement('div'); 
  cat.id = 'desktop-cat';
  cat.style.pointerEvents = 'auto'; 
  
  const catSprite = document.createElement('div');
  catSprite.id = 'desktop-cat-sprite';
  cat.appendChild(catSprite);
  document.body.appendChild(cat);

  //cat state
  catState = { 
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    velocityX: 2,
    velocityY: 0,
    isDragging: false,
    isNapping: false,
    isSitting: false,
    energy: 100,
    currentAnimation: 'sitting',
    currentFrame: 0,
    frameCounter: 0,
    facingRight: true,
    idleTimer: 0
  };

  //update frame
  function updateSpriteFrame() {
    const anim = SPRITE_CONFIG.animations[catState.currentAnimation];
    
    //set background img
    const imageUrl = getImageUrl(anim.file);
    catSprite.style.backgroundImage = `url('${imageUrl}')`;
    
    //calc sprite sheet position
    if (anim.frames > 1) {
      const frameX = catState.currentFrame * SPRITE_CONFIG.frameWidth;
      catSprite.style.backgroundPosition = `-${frameX}px 0px`;
      catSprite.style.backgroundSize = `${anim.frames * 100}% 100%`;
    } else {
      catSprite.style.backgroundPosition = '0px 0px';
      catSprite.style.backgroundSize = '100% 100%';
    }
    
    //flip if facing left
    if (!catState.facingRight) {
      catSprite.style.transform = 'scaleX(-1)';
    } else {
      catSprite.style.transform = 'scaleX(1)';
    }
  }

  //advance animation frame
  function advanceFrame() {
    const anim = SPRITE_CONFIG.animations[catState.currentAnimation];
    
    if (anim.fps === 0 || anim.frames === 1) {
      catState.currentFrame = 0;
      return;
    }
    
    catState.frameCounter++;
    const framesPerUpdate = Math.floor(60 / anim.fps);
    
    if (catState.frameCounter >= framesPerUpdate) {
      catState.frameCounter = 0;
      catState.currentFrame = (catState.currentFrame + 1) % anim.frames;
    }
  }

  //change anim
  setAnimation = function(animName) { 
    if (catState.currentAnimation !== animName) {
      catState.currentAnimation = animName;
      catState.currentFrame = 0;
      catState.frameCounter = 0;
      updateSpriteFrame();
    }
  }
  function updateCatPosition() {
    cat.style.left = catState.x + 'px';
    cat.style.top = catState.y + 'px';
  }

  //random walk
  function randomWalk() {
    if (catState.isDragging) {
      setAnimation('grabbed');
      return;
    }
    
    if (catState.isNapping) {
      setAnimation('sleeping');
      return;
    }
    
    if (catState.isSitting) {
      setAnimation('sitting');
      catState.velocityX = 0;
      catState.idleTimer++;
      
      //lie down after sitting
      if (catState.idleTimer > 3000) { 
        setAnimation('lying');
        catState.idleTimer = 0;
      }
      return;
    }
    //randomly sit
    if (Math.abs(catState.velocityX) < 0.5 && Math.random() < 0.0005) {
      catState.isSitting = true;
      catState.velocityX = 0;
      catState.idleTimer = 0;
      setAnimation('sitting');
      
      //get up after a while
      setTimeout(() => {
        catState.isSitting = false;
      }, 15000 + Math.random() * 15000); 
      return;
    }
    
    //randomly change direction
    if (Math.random() < 0.0005) {
      catState.velocityX = (Math.random() - 0.5) * 3;
    }
    //update facing direction
    if (catState.velocityX > 0.1) {
      catState.facingRight = true;
    } else if (catState.velocityX < -0.1) {
      catState.facingRight = false;
    }
    
    //set anim
    if (Math.abs(catState.velocityX) > 0.5) {
      setAnimation('walking');
    } else {
      setAnimation('sitting');
    }
    //move
    catState.x += catState.velocityX;
    
    //gravity sim
    if (catState.y < window.innerHeight - 180) {
      catState.velocityY += 0.5;
      catState.y += catState.velocityY;
    } else {
      catState.y = window.innerHeight - 180;
      catState.velocityY = 0;
    }
    
    //bounce off walls
    if (catState.x <= 0 || catState.x >= window.innerWidth - 256) {
      catState.velocityX *= -1;
      catState.x = Math.max(0, Math.min(window.innerWidth - 256, catState.x));
    }
    //decrease energy
    catState.energy -= 0.01;
    if (catState.energy <= 0) {
      takeNap();
    }
    
    updateCatPosition();
  }

  //nap
  function takeNap() {
    catState.isNapping = true;
    catState.isSitting = false;
    catState.velocityX = 0;
    setAnimation('sleeping');
    
    setTimeout(() => {
      catState.isNapping = false;
      catState.energy = 100;
      setAnimation('sitting');
    }, 80000); //8secs
  }

  //click interaction
  cat.addEventListener('click', (e) => {
    if (!catState.isDragging) {
      //happy animation
      const wasNapping = catState.isNapping;
      catState.isNapping = false;
      catState.isSitting = false;
      
      setAnimation('happy');
      cat.style.transform = 'scale(1.1)';
      
      setTimeout(() => {
        cat.style.transform = 'scale(1)';
        if (!wasNapping) {
          setAnimation('sitting');
        }
      }, 1000);
      //add energy
      catState.energy = Math.min(100, catState.energy + 30);
    }
  });

  //drag function
  let dragOffset = { x: 0, y: 0 };

  cat.addEventListener('mousedown', (e) => {
    catState.isDragging = true;
    catState.isSitting = false;
    dragOffset.x = e.clientX - catState.x;
    dragOffset.y = e.clientY - catState.y;
    setAnimation('grabbed');
  });

  document.addEventListener('mousemove', (e) => {
    if (catState.isDragging) {
      catState.x = e.clientX - dragOffset.x;
      catState.y = e.clientY - dragOffset.y;
      updateCatPosition();
    }
  });

  document.addEventListener('mouseup', () => {
    if (catState.isDragging) {
      catState.isDragging = false;
      
      //fall when dropped high
      if (catState.y < window.innerHeight - 400) {
        catState.velocityY = 0;
      }
      
      setAnimation('sitting');
    }
  });

  //listen for enable/disable msgs
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'enableCat') {
      cat.style.display = 'block';
      console.log('Cat enabled');
    } else if (request.action === 'disableCat') {
      cat.style.display = 'none';
      console.log('Cat disabled');
    } else if (request.action === 'updateTodos') {
      reminderData.todos = request.todos;
      console.log('Todos updated:', request.todos);
    } else if (request.action === 'updateReminderFrequency') {
      reminderData.frequency = request.frequency;
      console.log('Reminder frequency updated:', request.frequency);
    } else if (request.action === 'updateCatBreed') {
      currentBreed = request.breed;
      SPRITE_CONFIG = getSpriteConfig(currentBreed);
      updateSpriteFrame(); 
      console.log('Cat breed updated:', currentBreed);
    }
  });

  //check init state
  chrome.storage.sync.get(['catEnabled', 'catBreed'], function(result) {
    const isEnabled = result.catEnabled !== false; 
    cat.style.display = isEnabled ? 'block' : 'none';
    
    //load saved breed
    if (result.catBreed) {
      currentBreed = result.catBreed;
      SPRITE_CONFIG = getSpriteConfig(currentBreed);
      updateSpriteFrame();
      console.log('Loaded cat breed:', currentBreed);
    }
  });

  //main animation loop
  function gameLoop() {
    randomWalk();
    advanceFrame();
    updateSpriteFrame();
    checkReminders();
    requestAnimationFrame(gameLoop);
  }

  updateCatPosition();
  updateSpriteFrame();
  gameLoop();
}

//check DOM is ready before init
if (document.body) {
  initCat();
} else {
  document.addEventListener('DOMContentLoaded', initCat);
}