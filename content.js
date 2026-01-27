//UPDATE TO PROVIDE REMINDERS

//extension URL for loading images
const getImageUrl = (filename) => {
  return chrome.runtime.getURL("assets/" + filename); 
};
//cracker
//sprite config per animation 
const SPRITE_CONFIG = {
  frameWidth: 256,
  frameHeight: 256,
  
  animations: {
    sitting: {
      file: 'cat sitting.png',
      frames: 1,
      fps: 0
    },
    walking: {
      file: 'cat walking seq.png',
      frames: 2,
      fps: 3
    },
    sleeping: {
      file: 'cat sleeping seq.png',
      frames: 5,
      fps: 3
    },
    happy: {
      file: 'cat happy seq.png',
      frames: 8,
      fps: 12
    },
    grabbed: {
      file: 'cat picked up.png',
      frames: 1,
      fps: 0
    },
    lying: {
      file: 'cat lying.png',
      frames: 1,
      fps: 0
    }
  }
};

//wait for the page to be ready
function initCat() {
  
  //create cat element
  const cat = document.createElement('div');
  cat.id = 'desktop-cat';
  cat.style.pointerEvents = 'auto'; 
  
  const catSprite = document.createElement('div');
  catSprite.id = 'desktop-cat-sprite';
  cat.appendChild(catSprite);
  document.body.appendChild(cat);

  //cat state
  let catState = {
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
  function setAnimation(animName) {
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
    } else if (request.action === 'disableCat') {
      cat.style.display = 'none';
    }
  });

  //check init state
  chrome.storage.sync.get(['catEnabled'], function(result) {
    const isEnabled = result.catEnabled !== false; 
    cat.style.display = isEnabled ? 'block' : 'none';
  });

  //main animation loop
  function gameLoop() {
    randomWalk();
    advanceFrame();
    updateSpriteFrame();
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