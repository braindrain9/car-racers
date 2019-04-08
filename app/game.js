window.onload = () => {
  const speed = document.querySelector(".speed"),
        score = document.querySelector(".score"),
        lives = document.querySelector(".lives"),
        miles = document.querySelector(".miles"),
        level = document.querySelector(".level"),
        btnStart = document.querySelector(".btn-start"),
        btnStartNew = document.querySelector(".btn-start-new"),
        container = document.getElementById("container"),
        levels = [
          {
            miles: 300,
            speed: 6
          },
          {
            miles: 350,
            speed: 8
          },
          {
            miles: 400,
            speed: 10
          },
          {
            miles: 450,
            speed: 12
          },
          {
            miles: 500,
            speed: 16
          }
        ],
        roadParams = {
          left: 200,
          width: 300
        },
        keys = {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false
      };

  let animationGame,
      resetSpeed,
      player = {},
      gamePlay = false,
      onFinish = false,
      onSpeed = false;

  btnStartNew.addEventListener('click', startNewGame);
  btnStart.addEventListener('click', startGame);
  document.addEventListener('keydown', pressKeyOn);
  document.addEventListener('keyup', pressKeyOff);

  function startNewGame() {
    localStorage.removeItem("player");
    initParams();
  }

  function startGame() {
    initParams();
  }

  function initParams() {
    let playerCar,
        savedPlayer;

    if (localStorage.getItem('player')) {
      savedPlayer = JSON.parse(localStorage.getItem('player'));
    }

    // clear
    btnStart.style.display = 'none';
    btnStartNew.style.display = 'none';
    container.innerText = '';
    container.style.backgroundColor = '#FFDAAC';

    // add player car
    playerCar = document.createElement('div');
    playerCar.setAttribute('class', 'player-car');
    playerCar.x = 250;
    playerCar.y = 400;
    container.appendChild(playerCar);

    // set default params
    onFinish = false;
    gamePlay = true;

    player = {
      ele: playerCar,
      mapEle: document.querySelector('.road-map-car'),
      lives: 3,
      miles: 0,
      score: savedPlayer ? +savedPlayer.score : 0,
      level: savedPlayer ? +savedPlayer.level : 0,
    };
    player.speed = levels[player.level].speed;
    player.speedMax = levels[player.level].speed;

    // start game
    animationGame = requestAnimationFrame(playGame);
    startBoard();
    createRoadElements('bad-car', 6, makeCars);
    createRoadElements('speed-bonus', 2, makeExtras);
    createRoadElements('pit', 1, makeExtras);
  }


  // start

  function startBoard() {
    for(let x=0; x<13; x++) {
      let div = document.createElement('div');
      div.setAttribute('class', 'road simple');
      div.style.top = (x*50) + 'px';
      div.style.width = roadParams.width + 'px';
      container.appendChild(div);
    }
  }

  function updateDash() {
    score.innerHTML = player.score;
    speed.innerHTML = Math.round(player.speed*13).toString();
    lives.innerHTML = player.lives;
    miles.innerHTML = player.miles;
    level.innerHTML = player.level + 1;
  }

  function createRoadElements(ele, num, cb) {
    for(let x=0; x<num; x++) {
      let div = document.createElement('div');
      div.setAttribute('class', ele);
      cb(div);
      container.appendChild(div);
    }
  }

  // create
  function setRoadElementsParams(){
    let tempRoad = document.querySelector('.road'),
        left = tempRoad.offsetLeft + Math.ceil(Math.random()*(tempRoad.offsetWidth - 40)) + 'px',
        top = Math.ceil(Math.random()*-500)+'px';
    return {top, left};
  }

  function makeExtras(ele){
    const {top, left} = setRoadElementsParams();
    ele.style.top = top;
    ele.style.left = left;
  }

  function makeCars(ele){
    const {top, left} = setRoadElementsParams(),
          num = Math.ceil(Math.random()*7);

    ele.style.top = top;
    ele.style.left = left;
    ele.speed = num;
    ele.style.backgroundImage = `url('img/car-${num}.svg')`;
  }

  // movement
  function isCollide(a, b) {
    let aRect = a.getBoundingClientRect(),
        bRect = b.getBoundingClientRect(),
        check = !(
            (aRect.bottom < bRect.top) ||
            (aRect.top > bRect.bottom) ||
            (aRect.right < bRect.left) ||
            (aRect.left > bRect.right)
        );

    return check;
  }

  function avoidCollidingElements(tempElement, i) {
    for(let j=0; j < tempElement.length; j++) {
      if(i !== j && isCollide(tempElement[i], tempElement[j])){
        tempElement[i].style.top = (tempElement[i].offsetTop + 20) + 'px';
        tempElement[j].style.top = (tempElement[j].offsetTop - 20) + 'px';
        tempElement[i].style.left = (tempElement[i].offsetLeft - 20) + 'px';
        tempElement[j].style.left = (tempElement[j].offsetLeft + 20) + 'px';
      }
    }
  }

  function moveRoad() {
    let tempRoad = document.querySelectorAll('.road');

    for (let x=0; x<tempRoad.length; x++){
      let num = tempRoad[x].offsetTop + player.speed;

      if(num > 600) {
        num = num - 650;
        player.miles++;
        player.score++;
      }

      tempRoad[x].style.top = num + 'px';
    }
  }

  function moveExtras(ele) {
    let tempElement = document.querySelectorAll('.' + ele);

    for(let i=0; i<tempElement.length;i++){
      let y = tempElement[i].offsetTop + player.speed;

      avoidCollidingElements(tempElement, i);

      if (y>2000 || y<-2000) {
        makeExtras(tempElement[i]);
      } else {
        let hitCar;

        tempElement[i].style.top = y + 'px';
        hitCar = isCollide(tempElement[i], player.ele);

        if(hitCar && !onFinish) {
          if(ele === 'speed-bonus') {
            onSpeed = true;

            if(resetSpeed) {
              clearTimeout(resetSpeed);
            }

            // increase speed and score
            player.speed += 1;
            player.speedMax = player.speed;
            player.score += 30;

            document.querySelector('.player-car').setAttribute('class', 'player-car on-speed');

            let div = document.createElement('div');
            div.setAttribute('class', 'on-slow-2 fade-out');
            div.style.left = player.ele.x - 15 + 'px';
            div.style.top = player.ele.y - 25 + 'px';
            container.appendChild(div);

            resetSpeed = setTimeout(() => {
              // slowly decrease speed
              const iterations = Math.ceil(player.speed / levels[player.level].speed);

              for(let k=0; k<iterations; k++){
                player.speed -= 0.002;
              }

              player.speedMax = levels[player.level].speed;
              onSpeed = false;
              document.querySelector('.player-car').setAttribute('class', 'player-car');
            }, 3000);
            makeExtras(tempElement[i]);
          }

          if(ele === 'pit' && player.speed > 0) {
            let div;
            player.speed -= 1;
            player.score = player.score > 30 ? player.score - 30 : 5;

            // add slow speed warning
            div = document.createElement('div');
            div.setAttribute('class', 'on-slow fade-out');
            div.style.left = player.ele.x - 15 + 'px';
            div.style.top = player.ele.y - 25 + 'px';
            container.appendChild(div);

            makeExtras(tempElement[i]);
          }
        }
      }
    }
  }

  function moveCars() {
    let tempElement = document.querySelectorAll('.bad-car');

    for(let i=0; i<tempElement.length;i++){
      let y = tempElement[i].offsetTop + player.speed - tempElement[i].speed;

      avoidCollidingElements(tempElement, i);

      if (y > 2000 || y < -2000) {
        makeCars(tempElement[i]);
      } else {
        let hitCar;

        tempElement[i].style.top = y + 'px';
        hitCar = isCollide(tempElement[i], player.ele);

        if(hitCar && !onFinish) {
          let div;

          // stop car, decrease speed
          player.speed = 0;
          player.lives -= 1;
          player.score = player.score > 50 ? player.score - 50 : 5;

          // add car crash warning
          div = document.createElement('div');
          div.setAttribute('class', 'car-crash fade-out');
          div.style.left = player.ele.x - 15 + 'px';
          div.style.top = player.ele.y - 70 + 'px';
          container.appendChild(div);

          makeCars(tempElement[i]);

          console.log(player.lives, 'lives');

          if(player.lives < 0) {
            gameOverFailure();
          }
        }
      }

    }
  }

  // game over methods
  function gameOverSuccess() {
    let div;
    onFinish = true;

    // add finish element
    div = document.createElement('div');
    div.setAttribute('class', 'finish');
    container.appendChild(div);

    // update player params
    player.ele.y = 20;
    player.speed = 0;
    setTimeout(() => overGame(true), 2000);
  }

  function gameOverFailure() {
    // add game over failure
    let div = document.createElement('div');
    div.setAttribute('class', 'game-over');
    div.innerText = 'GAME OVER';
    container.appendChild(div);
    container.style.backgroundColor = '#333';

    overGame(false);
  }

  function overGame(success) {
    gamePlay = false;
    cancelAnimationFrame(animationGame);
    btnStartNew.style.display = 'block';

    if(!gamePlay) {
      if (success) {
        let result;

        player.level = player.level < levels.length ? player.level + 1 : levels.length;
        result = {
          score: player.score,
          level: player.level
        };

        localStorage.setItem("player", JSON.stringify(result));
      }

      if (player.level === levels.length) {
        showFinalDashboard();
      } else {
        btnStart.innerHTML = success ? 'Continue': 'Replay';
        btnStart.style.display = 'block';
      }
    }
  }

  function showFinalDashboard() {
    let div = document.createElement('h3');
    div.setAttribute('class', 'final-dashboard');
    div.innerHTML = 'Congrats! Your final score ' + player.score;
    container.innerHTML = '';
    container.style.backgroundColor = 'pink';
    container.appendChild(div);
  }

  function playGame() {
    if (player.miles >= levels[player.level].miles) {
      gameOverSuccess();
    }

    if (gamePlay) {
      updateDash();

      // movement
      moveRoad();
      moveCars();
      moveExtras('speed-bonus');
      moveExtras('pit');

      if(!onFinish) {
        if(keys.ArrowUp) {

          if(player.speed < levels[player.level].speed) {
            player.speed = player.speed + 0.5;
          } else {
            player.speed = player.speed < player.speedMax
                ? (player.speed + 0.05)
                : player.speedMax;
          }
        } else {
          player.speed = player.speed > 0.05 ? player.speed - 0.05 : 0;
        }

        if(keys.ArrowDown){
          player.speed = player.speed > 0 ? player.speed - 0.2 : 0;
        }

        if(keys.ArrowRight){
          player.ele.x += (player.speed / (player.speed > 6 ? 2 : 1));
        }

        if(keys.ArrowLeft){
          player.ele.x -= (player.speed / (player.speed > 6 ? 2 : 1));
        }

        animationGame = requestAnimationFrame(playGame);
      }

      if((player.ele.x + 20) < roadParams.left || player.ele.x + 20> roadParams.left + roadParams.width) {
        if (player.ele.y < 400) player.ele.y += 2;
        player.speed = player.speed > 0 ? (player.speed - 0.1) : 1;
      }

      // move car
      player.ele.style.top = player.ele.y + 'px';
      player.ele.style.left = player.ele.x + 'px';
      player.mapEle.style.bottom = player.miles / levels[player.level].miles * 100 + '%';
    }
  }

  // event handlers
  function pressKeyOn(event) {
    event.preventDefault();
    keys[event.key] = true;
  }

  function pressKeyOff() {
    event.preventDefault();
    keys[event.key] = false;
  }
};