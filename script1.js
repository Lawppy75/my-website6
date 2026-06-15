// ==========================
// キャンバス
// ==========================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const introVideo = document.getElementById("introVideo");

// ==========================
// ゲーム開始フラグ
// ==========================
let gameStarted = false;

// ==========================
// ミッション
// ==========================
let timeLimit = 60;
let killCount = 0;
const targetKill = 20;

let gameClear = false;
let gameOver = false;

// ==========================
// 操作モード
// ==========================
let controlMode = "AUTO";

// ==========================
// 高度
// ==========================
let altitude = 1000;

// ==========================
// 背景
// ==========================
const bg = new Image();
bg.src = "background1_1.png";

const clearBg = new Image();
clearBg.src = "START.png";

const failBg = new Image();
failBg.src = "BB.png";

let bgLoaded = false;

bg.onload = () => {
    bgLoaded = true;
};

// ==========================
// 爆発画像
// ==========================
const ds1 = new Image();
ds1.src = "DS1.png";

const ds2 = new Image();
ds2.src = "DS2.png";

const panelImg = new Image();
panelImg.src = "PANEL.png";

// ==========================
// BGM
// ==========================
const bgm = new Audio("BGM.mp3");
bgm.loop = true;
bgm.volume = 0.5;

// ==========================
// FAILED音声
// ==========================
const failVoice = new Audio("EE.ma3");
failVoice.volume = 1.0;

let failVoicePlayed = false;

// ==========================
// 効果音
// ==========================
const seUp = new Audio("PT1.mp3");
const seDown = new Audio("PT1.mp3");
const seLeft = new Audio("PT2.mp3");
const seRight = new Audio("PT3.mp3");

function playSE(src){

    const audio = new Audio(src);

    audio.volume = 1.0;

    audio.play().catch(err=>{
        console.log(err);
    });
}

// ==========================
// 爆発演出
// ==========================
const explosions = [];

class Explosion{

    constructor(type){

        this.type = type;

        this.phase = "panel";

        this.timer = 0;

        this.panelDuration = 30;
        this.explosionDuration = 40;

        this.finished = false;
    }

    update(){

        this.timer++;

        if(
            this.phase === "panel" &&
            this.timer >= this.panelDuration
        ){

            this.phase = "explosion";

            this.timer = 0;

            if(this.type === "yellow"){

                playSE("BO1.mp3");

            }else{

                playSE("BO2.mp3");
            }
        }

        if(
            this.phase === "explosion" &&
            this.timer >= this.explosionDuration
        ){

            this.finished = true;
        }
    }

    draw(){

        if(this.phase === "panel"){

            ctx.drawImage(
                panelImg,
                0,
                0,
                canvas.width,
                canvas.height
            );
        }

        else if(this.phase === "explosion"){

            const img =
                this.type === "yellow"
                ? ds1
                : ds2;

            ctx.globalAlpha =
                1 - (this.timer / this.explosionDuration);

            ctx.drawImage(
                img,
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.globalAlpha = 1;
        }
    }
}

// ==========================
// 敵画像
// ==========================
const enemyImages = [];

for(let i=1;i<=10;i++){

    const img = new Image();
    img.src = `D${i}.png`;

    enemyImages.push(img);
}

// ==========================
// カメラ
// ==========================
let cameraX = 0;
let cameraY = 0;
let cameraShake = 0;

// ==========================
// レーダー
// ==========================
let radarAngle = 0;

// ==========================
// スポーン
// ==========================
let spawnTimer = 0;

// ==========================
// キー入力
// ==========================
const keys = {};

window.addEventListener("keydown",e=>{

    const key = e.key.toLowerCase();

    if(keys[key]) return;

    keys[key] = true;

    // ==========================
    // Sキーで動画を止めてゲーム開始
    // ==========================
    if(key === "s" && !gameStarted){

        gameStarted = true;

        introVideo.pause();
        introVideo.style.display = "none";

        bgm.play().catch(()=>{});
    }

    if(!gameStarted) return;

    // ==========================
    // 矢印キー音
    // ==========================
    if(key === "arrowup"){

        seUp.currentTime = 0;
        seUp.play();

    }

    if(key === "arrowdown"){

        seDown.currentTime = 0;
        seDown.play();

    }

    if(key === "arrowleft"){

        seLeft.currentTime = 0;
        seLeft.play();

    }

    if(key === "arrowright"){

        seRight.currentTime = 0;
        seRight.play();
    }

    // ==========================
    // Hキー切替
    // ==========================
    if(key === "h"){

        if(controlMode === "AUTO"){

            controlMode = "MANUAL";

        }else{

            controlMode = "AUTO";
        }
    }
});

window.addEventListener("keyup",e=>{

    keys[e.key.toLowerCase()] = false;
});

// ==========================
// タイマー
// ==========================
setInterval(()=>{

    if(
        gameStarted &&
        !gameClear &&
        !gameOver
    ){

        timeLimit--;

        if(timeLimit <= 0){

            gameOver = true;
        }
    }

},1000);

// ==========================
// Entity
// ==========================
class Entity{

    constructor(x,y,color){

        this.x = x;
        this.y = y;

        this.color = color;

        this.speed = 2;
        this.size = 10;
    }

    draw(){

        const screenX =
            this.x - cameraX + canvas.width/2;

        const screenY =
            this.y - cameraY + canvas.height/2;

        ctx.fillStyle = this.color;

        ctx.beginPath();

        ctx.arc(
            screenX,
            screenY,
            this.size,
            0,
            Math.PI*2
        );

        ctx.fill();
    }
}

// ==========================
// Bullet
// ==========================
class Bullet{

    constructor(x,y,vx,vy,color){

        this.x = x;
        this.y = y;

        this.vx = vx;
        this.vy = vy;

        this.speed = 6;
        this.size = 5;

        this.color = color;
    }

    update(){

        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;
    }

    draw(){

        const screenX =
            this.x - cameraX + canvas.width/2;

        const screenY =
            this.y - cameraY + canvas.height/2;

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        ctx.fillStyle = this.color;

        ctx.beginPath();

        ctx.arc(
            screenX,
            screenY,
            this.size,
            0,
            Math.PI*2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

// ==========================
// AI
// ==========================
class AI extends Entity{

    constructor(x,y){

        super(x,y,"cyan");

        this.fireCooldown = 0;

        this.fovAngle = Math.PI/3;
        this.fovRange = 250;

        this.facingAngle = 0;

        this.state = "WAIT";

        this.waitMoveAngle = 0;
    }

    findNearestEnemy(enemies){

        let nearest = null;
        let minDist = Infinity;

        for(const e of enemies){

            const d =
                Math.hypot(
                    e.x - this.x,
                    e.y - this.y
                );

            if(d < minDist){

                minDist = d;
                nearest = e;
            }
        }

        return {
            enemy: nearest,
            distance: minDist
        };
    }

    drawFOV(){

        const screenX =
            this.x - cameraX + canvas.width/2;

        const screenY =
            this.y - cameraY + canvas.height/2;

        ctx.fillStyle =
            "rgba(0,255,255,0.15)";

        ctx.beginPath();

        ctx.moveTo(screenX,screenY);

        ctx.arc(
            screenX,
            screenY,
            this.fovRange,
            this.facingAngle - this.fovAngle/2,
            this.facingAngle + this.fovAngle/2
        );

        ctx.closePath();

        ctx.fill();
    }

    fireBullet(
        bullets,
        dx,
        dy,
        dist,
        color
    ){

        bullets.push(

            new Bullet(
                this.x,
                this.y,
                dx/dist,
                dy/dist,
                color
            )
        );
    }

    updateAI(enemies,bullets){

        const result =
            this.findNearestEnemy(enemies);

        const target = result.enemy;
        const dist = result.distance;

        if(target){

            const dx = target.x - this.x;
            const dy = target.y - this.y;

            this.facingAngle =
                Math.atan2(dy,dx);

            if(dist < 80){

                this.state = "EVADE";

            }else if(dist < 250){

                this.state = "CHASE";

            }else{

                this.state = "WAIT";
            }

            if(this.state === "EVADE"){

                this.x -=
                    (dx/dist)
                    * this.speed * 1.5;

                this.y -=
                    (dy/dist)
                    * this.speed * 1.5;

                if(this.fireCooldown <= 0){

                    const bulletColor =
                        Math.random() < 0.5
                        ? "yellow"
                        : "lime";

                    for(let i=0;i<3;i++){

                        this.fireBullet(
                            bullets,
                            dx + (Math.random()-0.5)*30,
                            dy + (Math.random()-0.5)*30,
                            dist,
                            bulletColor
                        );
                    }

                    cameraShake = 10;

                    this.fireCooldown = 15;
                }
            }

            else if(this.state === "CHASE"){

                this.x +=
                    (dx/dist)
                    * this.speed;

                this.y +=
                    (dy/dist)
                    * this.speed;

                if(dist < 180 &&
                   this.fireCooldown <= 0){

                    const bulletColor =
                        Math.random() < 0.5
                        ? "yellow"
                        : "lime";

                    for(let i=0;i<5;i++){

                        this.fireBullet(
                            bullets,
                            dx + (Math.random()-0.5)*40,
                            dy + (Math.random()-0.5)*40,
                            dist,
                            bulletColor
                        );
                    }

                    cameraShake = 8;

                    this.fireCooldown = 35;
                }
            }
        }

        if(this.state === "WAIT"){

            this.facingAngle += 0.03;

            if(Math.random() < 0.008){

                this.waitMoveAngle =
                    Math.random()
                    * Math.PI * 2;
            }

            this.x +=
                Math.cos(this.waitMoveAngle)
                * 3;

            this.y +=
                Math.sin(this.waitMoveAngle)
                * 3;
        }
    }

    updateManual(){

        this.state = "MANUAL";

        const moveSpeed = 4;

        if(keys["arrowup"]) this.y -= moveSpeed;
        if(keys["arrowdown"]) this.y += moveSpeed;
        if(keys["arrowleft"]) this.x -= moveSpeed;
        if(keys["arrowright"]) this.x += moveSpeed;
    }

    update(enemies,bullets){

        if(
            !gameStarted ||
            gameClear ||
            gameOver
        ) return;

        if(keys["w"]) altitude += 2;
        if(keys["r"]) altitude -= 2;

        altitude = Math.max(0,altitude);

        this.speed =
            1.5 + altitude * 0.001;

        this.fovRange =
            200 + altitude * 0.05;

        if(controlMode === "AUTO"){

            this.updateAI(enemies,bullets);

        }else{

            this.updateManual();
        }

        if(this.fireCooldown > 0){

            this.fireCooldown--;
        }
    }

    drawHUD(){

        ctx.fillStyle =
            "rgba(0,0,0,0.7)";

        ctx.fillRect(10,10,340,190);

        ctx.strokeStyle = "cyan";
        ctx.lineWidth = 2;

        ctx.strokeRect(10,10,340,190);

        ctx.font =
            "bold 22px sans-serif";

        ctx.fillStyle =
            controlMode === "AUTO"
            ? "lime"
            : "orange";

        ctx.fillText(
            "CONTROL : " + controlMode,
            20,
            40
        );

        ctx.fillStyle = "white";

        ctx.fillText(
            "AI MODE : " + this.state,
            20,
            75
        );

        ctx.fillStyle = "cyan";

        ctx.fillText(
            "ALTITUDE : "
            + Math.floor(altitude)
            + " m",
            20,
            110
        );

        ctx.fillStyle = "yellow";

        ctx.fillText(
            "TIME : " + timeLimit,
            20,
            145
        );

        ctx.fillStyle = "orange";

        ctx.fillText(
            "KILL : "
            + killCount
            + " / "
            + targetKill,
            20,
            180
        );
    }
}

// ==========================
// Enemy
// ==========================
class Enemy extends Entity{

    constructor(x,y){

        super(x,y,"red");

        this.speed = 0.8;

        this.image =
            enemyImages[
                Math.floor(
                    Math.random()
                    * enemyImages.length
                )
            ];

        this.size = 40;
    }

    update(){

        if(
            !gameStarted ||
            gameClear ||
            gameOver
        ) return;

        this.x +=
            (Math.random()-0.5)
            * this.speed;

        this.y +=
            (Math.random()-0.5)
            * this.speed;
    }

    draw(){

        const screenX =
            this.x - cameraX + canvas.width/2;

        const screenY =
            this.y - cameraY + canvas.height/2;

        if(this.image.complete){

            ctx.drawImage(
                this.image,
                screenX - this.size/2,
                screenY - this.size/2,
                this.size,
                this.size
            );
        }
    }
}

// ==========================
// 初期化
// ==========================
const ai =
    new AI(400,300);

const enemies = [];
const bullets = [];

for(let i=0;i<8;i++){

    enemies.push(

        new Enemy(
            Math.random()*2000,
            Math.random()*2000
        )
    );
}

// ==========================
// 背景
// ==========================
function drawBackground(){

    if(gameClear){

        ctx.drawImage(
            clearBg,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return;
    }

    if(gameOver){

        ctx.drawImage(
            failBg,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return;
    }

    if(!bgLoaded){

        ctx.fillStyle = "#111";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        return;
    }

    const offsetX =
        (-cameraX % bg.width);

    const offsetY =
        (-cameraY % bg.height);

    for(let x=-1;x<=2;x++){

        for(let y=-1;y<=2;y++){

            ctx.drawImage(
                bg,
                offsetX + x * bg.width,
                offsetY + y * bg.height
            );
        }
    }
}

// ==========================
// レーダー
// ==========================
function drawRadar(){

    const radarX = 650;
    const radarY = 100;

    const radarRadius = 80;

    // 背景
    ctx.fillStyle =
        "rgba(0,0,0,0.5)";

    ctx.beginPath();

    ctx.arc(
        radarX,
        radarY,
        radarRadius,
        0,
        Math.PI*2
    );

    ctx.fill();

    // 枠
    ctx.strokeStyle = "lime";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(
        radarX,
        radarY,
        radarRadius,
        0,
        Math.PI*2
    );

    ctx.stroke();

    // 自機
    ctx.fillStyle = "cyan";

    ctx.beginPath();

    ctx.arc(
        radarX,
        radarY,
        5,
        0,
        Math.PI*2
    );

    ctx.fill();

    // 敵
    for(const e of enemies){

        const dx = e.x - ai.x;
        const dy = e.y - ai.y;

        const scale = 0.08;

        const rx =
            radarX + dx * scale;

        const ry =
            radarY + dy * scale;

        const dist =
            Math.hypot(
                rx - radarX,
                ry - radarY
            );

        if(dist < radarRadius){

            ctx.fillStyle = "red";

            ctx.beginPath();

            ctx.arc(
                rx,
                ry,
                3,
                0,
                Math.PI*2
            );

            ctx.fill();
        }
    }

    // スキャン線
    radarAngle += 0.03;

    const sweepX =
        radarX +
        Math.cos(radarAngle)
        * radarRadius;

    const sweepY =
        radarY +
        Math.sin(radarAngle)
        * radarRadius;

    ctx.strokeStyle =
        "rgba(0,255,0,0.9)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(radarX,radarY);

    ctx.lineTo(sweepX,sweepY);

    ctx.stroke();
}

// ==========================
// 敵スポーン
// ==========================
function spawnEnemy(){

    if(enemies.length >= 20) return;

    const angle =
        Math.random()
        * Math.PI * 2;

    const distance =
        600 + Math.random() * 400;

    const x =
        ai.x +
        Math.cos(angle)
        * distance;

    const y =
        ai.y +
        Math.sin(angle)
        * distance;

    enemies.push(
        new Enemy(x,y)
    );
}

// ==========================
// LOOP
// ==========================
function loop(){

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    cameraShake *= 0.92;

    const shakeX =
        (Math.random()-0.5)
        * cameraShake * 2;

    const shakeY =
        (Math.random()-0.5)
        * cameraShake * 2;

    cameraX = ai.x + shakeX;
    cameraY = ai.y + shakeY;

    drawBackground();

    // FAILED音声
    if(gameOver && !failVoicePlayed){

        failVoicePlayed = true;

        bgm.pause();

        failVoice.play().catch(()=>{});
    }

    // 開始前はSB.mp4を表示し、Sキー入力を待つ
    if(!gameStarted){

        requestAnimationFrame(loop);
        return;
    }

    ai.update(enemies,bullets);

    ai.drawFOV();

    ai.draw();

    for(const e of enemies){

        e.update();
        e.draw();
    }

    for(let i=bullets.length-1;i>=0;i--){

        const b = bullets[i];

        b.update();
        b.draw();

        for(let j=enemies.length-1;j>=0;j--){

            const e = enemies[j];

            const dist =
                Math.hypot(
                    b.x - e.x,
                    b.y - e.y
                );

            if(dist < e.size/2){

                const hitType =
                    b.color === "yellow"
                    ? "yellow"
                    : "green";

                explosions.push(
                    new Explosion(hitType)
                );

                enemies.splice(j,1);
                bullets.splice(i,1);

                killCount++;

                cameraShake = 12;

                if(killCount >= targetKill){

                    gameClear = true;

                    bgm.pause();
                }

                break;
            }
        }
    }

    for(let i=explosions.length-1;i>=0;i--){

        explosions[i].update();
        explosions[i].draw();

        if(explosions[i].finished){

            explosions.splice(i,1);
        }
    }

    if(!gameClear && !gameOver){

        spawnTimer++;

        if(spawnTimer > 120){

            spawnEnemy();

            spawnTimer = 0;
        }
    }

    drawRadar();

    ai.drawHUD();

    // CLEAR
    if(gameClear){

        ctx.fillStyle =
            "rgba(0,0,0,0.5)";

        ctx.fillRect(
            120,
            220,
            560,
            120
        );

        ctx.fillStyle = "lime";

        ctx.font =
            "bold 50px sans-serif";

        ctx.fillText(
            "MISSION COMPLETE",
            145,
            295
        );
    }

    // FAILED
    if(gameOver){

        ctx.fillStyle =
            "rgba(0,0,0,0.5)";

        ctx.fillRect(
            150,
            220,
            500,
            120
        );

        ctx.fillStyle = "red";

        ctx.font =
            "bold 50px sans-serif";

        ctx.fillText(
            "MISSION FAILED",
            170,
            295
        );
    }

    requestAnimationFrame(loop);
}

introVideo.play().catch(()=>{});
loop();
