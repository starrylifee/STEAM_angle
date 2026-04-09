"use strict";

const GAME1 = (() => {
    const {
        refs,
        ctx,
        quizCtx,
        certCtx,
        totalHealth,
        totalPieces,
        getFormattedTimestamp,
        setHidden
    } = window.STEAM_ANGLE;

    const playerTemplate = {
        x: 120,
        y: 350,
        w: 60,
        h: 80,
        dy: 0,
        jumpForce: -14,
        gravity: 0.8,
        groundY: 350,
        animFrame: 0,
        jumpCount: 0,
        flipAngle: 0,
        isFlipping: false,
        isInvulnerable: false
    };

    const state = {
        status: "START",
        stage: 1,
        pieces: 0,
        distance: 0,
        health: totalHealth,
        doubleJumps: 5,
        baseSpeed: 6,
        speed: 6,
        boosterTimer: 0,
        quizAngle: 0,
        lastSpawnTime: 0,
        loopStarted: false,
        player: { ...playerTemplate },
        obstacles: [],
        puzzleBoxes: [],
        powerUps: []
    };

    const angleChoices = [15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
    const obstacleKinds = [
        { icon: "🌵", y: 360, w: 34, h: 60 },
        { icon: "🪨", y: 385, w: 42, h: 34 },
        { icon: "🌋", y: 374, w: 48, h: 46 }
    ];

    function resetGame() {
        state.status = "START";
        state.stage = 1;
        state.pieces = 0;
        state.distance = 0;
        state.health = totalHealth;
        state.doubleJumps = 5;
        state.baseSpeed = 6;
        state.speed = 6;
        state.boosterTimer = 0;
        state.quizAngle = 0;
        state.lastSpawnTime = 0;
        state.player = { ...playerTemplate };
        state.obstacles = [];
        state.puzzleBoxes = [];
        state.powerUps = [];

        refs.feedback.textContent = "";
        refs.feedback.style.color = "";
        refs.feedback.style.transform = "";
        refs.distanceMeter.textContent = "0";
        refs.stageIndicator.textContent = "STAGE 1";
        refs.stageUpBanner.textContent = "";
        refs.timestampDisplay.textContent = "";
        refs.starRating.innerHTML = "";
        refs.finalPuzzleView.innerHTML = "";

        setHidden(refs.startScreen, false);
        setHidden(refs.endScreen, true);
        setHidden(refs.gameoverScreen, true);
        setHidden(refs.quizModal, true);
        setHidden(refs.stageUpBanner, true);

        updateHealthUI();
        updateDJumpUI();
        updatePuzzleUI();
        drawBackground();
        drawObjects();
        drawPlayer();
    }

    function startGame() {
        state.status = "PLAYING";
        setHidden(refs.startScreen, true);
        setHidden(refs.endScreen, true);
        setHidden(refs.gameoverScreen, true);
        updateDJumpUI();
    }

    function restartGame() {
        resetGame();
        startGame();
    }

    function updateHealthUI() {
        refs.healthTracker.innerHTML = "";
        for (let i = 0; i < totalHealth; i += 1) {
            const span = document.createElement("span");
            span.textContent = i < state.health ? "❤️" : "🖤";
            refs.healthTracker.appendChild(span);
        }
    }

    function updateDJumpUI() {
        refs.djumpTracker.textContent = String(state.doubleJumps);
    }

    function updatePuzzleUI() {
        refs.puzzleTracker.innerHTML = "";
        for (let i = 0; i < totalPieces; i += 1) {
            const dot = document.createElement("div");
            dot.className = `puzzle-dot ${i < state.pieces ? "collected" : ""}`;
            refs.puzzleTracker.appendChild(dot);
        }
    }

    function handleJump() {
        if (state.status !== "PLAYING") {
            return;
        }

        if (state.player.jumpCount === 0) {
            state.player.dy = state.player.jumpForce;
            state.player.jumpCount = 1;
            return;
        }

        if (state.player.jumpCount === 1 && state.doubleJumps > 0) {
            state.player.dy = state.player.jumpForce;
            state.player.jumpCount = 2;
            state.doubleJumps -= 1;
            state.player.flipAngle = 0;
            state.player.isFlipping = true;
            updateDJumpUI();
        }
    }

    function startLoop() {
        if (state.loopStarted) {
            return;
        }

        state.loopStarted = true;
        window.requestAnimationFrame(gameLoop);
    }

    function gameLoop(time) {
        ctx.clearRect(0, 0, refs.gameCanvas.width, refs.gameCanvas.height);
        drawBackground();

        if (state.status === "PLAYING") {
            updatePlayer();
            updateBooster();
            spawnObjects(time);
            updateObjects();
            state.distance += state.speed * 0.025;
            refs.distanceMeter.textContent = String(Math.floor(state.distance));
        }

        drawObjects();
        drawPlayer();
        window.requestAnimationFrame(gameLoop);
    }

    function updatePlayer() {
        const player = state.player;
        player.dy += player.gravity;
        player.y += player.dy;
        player.animFrame += state.boosterTimer > 0 ? 0.28 : 0.14;

        if (player.isFlipping) {
            player.flipAngle += 0.35;
            if (player.flipAngle >= Math.PI * 2) {
                player.isFlipping = false;
                player.flipAngle = 0;
            }
        }

        if (player.y >= player.groundY) {
            player.y = player.groundY;
            player.dy = 0;
            player.jumpCount = 0;
            player.isFlipping = false;
            player.flipAngle = 0;
        }
    }

    function updateBooster() {
        if (state.boosterTimer <= 0) {
            return;
        }

        state.boosterTimer -= 1;
        if (state.boosterTimer === 0) {
            state.speed = state.baseSpeed + (state.stage - 1) * 2;
        }
    }

    function spawnObjects(time) {
        const spawnInterval = 1400 - (state.stage - 1) * 220;
        if (time - state.lastSpawnTime < spawnInterval) {
            return;
        }

        const roll = Math.random();
        if (roll > 0.64 && state.puzzleBoxes.length === 0) {
            state.puzzleBoxes.push({ x: refs.gameCanvas.width, y: 320, w: 60, h: 60 });
        } else if (roll > 0.5 && state.powerUps.length === 0 && state.boosterTimer <= 0) {
            state.powerUps.push({ x: refs.gameCanvas.width, y: 250, w: 44, h: 44, icon: "🚀" });
        } else {
            const picked = obstacleKinds[Math.floor(Math.random() * obstacleKinds.length)];
            state.obstacles.push({ ...picked, x: refs.gameCanvas.width });
            if (state.stage >= 2 && Math.random() > 0.7) {
                const twin = obstacleKinds[Math.floor(Math.random() * obstacleKinds.length)];
                state.obstacles.push({ ...twin, x: refs.gameCanvas.width + 110 });
            }
        }

        state.lastSpawnTime = time;
    }

    function updateObjects() {
        state.obstacles = state.obstacles.filter((item) => {
            item.x -= state.speed;
            if (isColliding(state.player, item, 10)) {
                playerHit();
            }
            return item.x > -100;
        });

        state.powerUps = state.powerUps.filter((item) => {
            item.x -= state.speed;
            if (isColliding(state.player, item, 0)) {
                activateBooster();
                return false;
            }
            return item.x > -100;
        });

        state.puzzleBoxes = state.puzzleBoxes.filter((item) => {
            item.x -= state.speed;
            if (isColliding(state.player, item, 0)) {
                triggerQuiz();
                return false;
            }
            return item.x > -100;
        });
    }

    function activateBooster() {
        state.boosterTimer = 180;
        state.speed = state.baseSpeed + 12;
        state.player.dy = -10;
    }

    function playerHit() {
        if (state.player.isInvulnerable || state.boosterTimer > 0 || state.status !== "PLAYING") {
            return;
        }

        state.health = Math.max(0, state.health - 1);
        updateHealthUI();
        state.player.dy = -10;
        state.player.x = Math.max(60, state.player.x - 30);
        state.player.isInvulnerable = true;
        refs.gameWrapper.classList.add("shake");
        window.setTimeout(() => refs.gameWrapper.classList.remove("shake"), 450);
        window.setTimeout(() => {
            state.player.isInvulnerable = false;
        }, 1400);

        if (state.health <= 0) {
            state.status = "GAMEOVER";
            setHidden(refs.gameoverScreen, false);
        }
    }

    function drawBackground() {
        const sky = ctx.createLinearGradient(0, 0, 0, refs.gameCanvas.height);
        if (state.stage === 3) {
            sky.addColorStop(0, "#2c3e50");
            sky.addColorStop(1, "#3b82c4");
        } else if (state.stage === 2) {
            sky.addColorStop(0, "#f6a13d");
            sky.addColorStop(1, "#f6df72");
        } else {
            sky.addColorStop(0, "#7ed4ff");
            sky.addColorStop(1, "#d8f5ff");
        }

        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, refs.gameCanvas.width, refs.gameCanvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.55)";
        for (let i = 0; i < 3; i += 1) {
            const x = 220 + i * 240 - (state.distance % 720);
            ctx.beginPath();
            ctx.arc(x, 96, 30, 0, Math.PI * 2);
            ctx.arc(x + 28, 88, 36, 0, Math.PI * 2);
            ctx.arc(x + 58, 96, 28, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = state.stage === 3 ? "#3b475a" : "#2f6d3c";
        ctx.fillRect(0, 410, refs.gameCanvas.width, 90);
        ctx.fillStyle = state.stage === 3 ? "#2a3342" : "#4b9646";
        ctx.fillRect(0, 410, refs.gameCanvas.width, 14);
    }

    function drawPlayer() {
        const player = state.player;
        if (player.isInvulnerable && state.boosterTimer <= 0 && Math.floor(Date.now() / 120) % 2 === 0) {
            return;
        }

        const bounceY = player.jumpCount === 0 ? Math.sin(player.animFrame * 2) * 4 : 0;
        const drawY = player.y + bounceY;
        const centerX = player.x + player.w / 2;

        ctx.save();
        ctx.translate(centerX, drawY + 40);
        ctx.rotate(player.flipAngle);

        if (state.boosterTimer > 0) {
            ctx.fillStyle = Math.random() > 0.5 ? "#ff7043" : "#ffca28";
            ctx.beginPath();
            ctx.moveTo(-28, 6);
            ctx.lineTo(-54, 16 + Math.random() * 10);
            ctx.lineTo(-28, 26);
            ctx.fill();
        }

        ctx.strokeStyle = "#17324d";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(-4, 24);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(9, -28, 13, 0, Math.PI * 2);
        ctx.fillStyle = "#17324d";
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(13, -30, 2.3, 0, Math.PI * 2);
        ctx.fill();

        const swing = Math.sin(player.animFrame * 1.5) * 18;
        ctx.beginPath();
        if (player.isFlipping) {
            ctx.moveTo(-4, 24);
            ctx.lineTo(11, 10);
            ctx.moveTo(-4, 24);
            ctx.lineTo(-14, 14);
            ctx.moveTo(0, 2);
            ctx.lineTo(14, 8);
            ctx.moveTo(0, 2);
            ctx.lineTo(-10, 8);
        } else if (player.jumpCount > 0) {
            ctx.moveTo(-4, 24);
            ctx.lineTo(15, 46);
            ctx.moveTo(-4, 24);
            ctx.lineTo(-14, 34);
            ctx.moveTo(0, 2);
            ctx.lineTo(18, -14);
            ctx.moveTo(0, 2);
            ctx.lineTo(-10, -18);
        } else {
            ctx.moveTo(-4, 24);
            ctx.lineTo(swing - 4, 50);
            ctx.moveTo(-4, 24);
            ctx.lineTo(-swing - 4, 50);
            ctx.moveTo(0, 2);
            ctx.lineTo(swing, 20);
            ctx.moveTo(0, 2);
            ctx.lineTo(-swing, 20);
        }
        ctx.stroke();

        if (state.boosterTimer > 0) {
            ctx.beginPath();
            ctx.arc(0, 10, 58, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(82, 171, 255, 0.55)";
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawObjects() {
        state.obstacles.forEach((item) => {
            ctx.font = `${item.h}px serif`;
            ctx.fillText(item.icon, item.x, item.y + item.h - 4);
        });

        state.powerUps.forEach((item) => {
            ctx.beginPath();
            ctx.arc(item.x + 22, item.y + 20, 24, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 214, 79, 0.34)";
            ctx.fill();
            ctx.font = "40px serif";
            ctx.fillText(item.icon, item.x, item.y + 34);
        });

        state.puzzleBoxes.forEach((item) => {
            drawRoundedRect(item.x, item.y, item.w, item.h, 14, "#ff9f43");
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 34px 'Malgun Gothic', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("?", item.x + 30, item.y + 42);
            ctx.textAlign = "left";
        });
    }

    function triggerQuiz() {
        if (state.status !== "PLAYING") {
            return;
        }

        state.status = "QUIZ";
        state.quizAngle = angleChoices[Math.floor(Math.random() * angleChoices.length)];
        setHidden(refs.quizModal, false);
        refs.feedback.textContent = "";
        refs.feedback.style.color = "";
        refs.feedback.style.transform = "";
        drawQuizAngle(state.quizAngle);
        generateOptions(state.quizAngle);
    }

    function drawQuizAngle(angle) {
        quizCtx.clearRect(0, 0, refs.quizCanvas.width, refs.quizCanvas.height);
        quizCtx.beginPath();
        quizCtx.arc(120, 90, 68, Math.PI, 0);
        quizCtx.strokeStyle = "#d7e3ef";
        quizCtx.lineWidth = 4;
        quizCtx.setLineDash([6, 5]);
        quizCtx.stroke();
        quizCtx.setLineDash([]);

        quizCtx.beginPath();
        quizCtx.moveTo(120, 90);
        quizCtx.lineTo(188, 90);
        quizCtx.strokeStyle = "#17324d";
        quizCtx.lineWidth = 7;
        quizCtx.lineCap = "round";
        quizCtx.stroke();

        const radians = (angle * Math.PI) / 180;
        quizCtx.beginPath();
        quizCtx.moveTo(120, 90);
        quizCtx.lineTo(120 + 68 * Math.cos(-radians), 90 + 68 * Math.sin(-radians));
        quizCtx.strokeStyle = "#ef5350";
        quizCtx.stroke();

        quizCtx.beginPath();
        quizCtx.arc(120, 90, 7, 0, Math.PI * 2);
        quizCtx.fillStyle = "#17324d";
        quizCtx.fill();
    }

    function generateOptions(correctAngle) {
        refs.optionsGrid.innerHTML = "";
        const options = [correctAngle];

        while (options.length < 4) {
            const fake = angleChoices[Math.floor(Math.random() * angleChoices.length)];
            if (!options.includes(fake)) {
                options.push(fake);
            }
        }

        options.sort((a, b) => a - b);
        options.forEach((option) => {
            const button = document.createElement("button");
            button.className = "btn-option";
            button.textContent = `${option}°`;
            button.addEventListener("click", () => {
                if (state.status !== "QUIZ") {
                    return;
                }

                if (option === correctAngle) {
                    answerCorrect();
                } else {
                    answerWrong();
                }
            });
            refs.optionsGrid.appendChild(button);
        });
    }

    function answerCorrect() {
        refs.feedback.textContent = "정답! 퍼즐 조각 획득!";
        refs.feedback.style.color = "#1f9d55";
        refs.feedback.style.transform = "scale(1.08)";
        state.pieces += 1;
        updatePuzzleUI();

        window.setTimeout(() => {
            setHidden(refs.quizModal, true);
            refs.feedback.style.transform = "";

            if (state.pieces >= totalPieces) {
                winGame();
            } else {
                checkStageUp();
                state.status = "PLAYING";
            }
        }, 900);
    }

    function answerWrong() {
        state.health = Math.max(0, state.health - 1);
        updateHealthUI();

        if (state.health <= 0) {
            state.status = "GAMEOVER";
            setHidden(refs.quizModal, true);
            setHidden(refs.gameoverScreen, false);
            return;
        }

        refs.feedback.textContent = `틀렸어요! 남은 목숨 ${state.health}`;
        refs.feedback.style.color = "#ef476f";
        refs.quizModal.classList.add("shake");
        window.setTimeout(() => refs.quizModal.classList.remove("shake"), 420);
    }

    function checkStageUp() {
        let nextStage = 1;
        if (state.pieces >= 6) {
            nextStage = 3;
        } else if (state.pieces >= 3) {
            nextStage = 2;
        }

        if (nextStage <= state.stage) {
            return;
        }

        state.stage = nextStage;
        state.speed = state.baseSpeed + (state.stage - 1) * 2;
        refs.stageIndicator.textContent = `STAGE ${state.stage}`;
        refs.stageUpBanner.textContent = `STAGE ${state.stage} 진입!`;
        setHidden(refs.stageUpBanner, false);

        if (state.health < totalHealth) {
            state.health += 1;
            updateHealthUI();
        }

        state.doubleJumps = Math.min(state.doubleJumps + 5, 10);
        updateDJumpUI();
        window.setTimeout(() => setHidden(refs.stageUpBanner, true), 1600);
    }

    function winGame() {
        state.status = "END";
        setHidden(refs.endScreen, false);
        setHidden(refs.quizModal, true);

        let stars = "";
        for (let i = 0; i < totalHealth; i += 1) {
            stars += i < state.health ? "⭐" : "☆";
        }

        refs.starRating.textContent = stars;
        refs.timestampDisplay.textContent = `달성 시간: ${getFormattedTimestamp()}`;
        refs.finalPuzzleView.innerHTML = `
            <svg viewBox="0 0 400 300" aria-label="완성된 퍼즐">
                <defs>
                    <linearGradient id="game1PuzzleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#f6d365" />
                        <stop offset="100%" stop-color="#fda085" />
                    </linearGradient>
                </defs>
                <rect width="400" height="300" fill="url(#game1PuzzleGradient)"/>
                <path d="M200 80 L230 150 L300 150 L245 195 L265 265 L200 220 L135 265 L155 195 L100 150 L170 150 Z" fill="#fff" stroke="#d35400" stroke-width="5"/>
                <text x="200" y="52" text-anchor="middle" font-family="Malgun Gothic, sans-serif" font-size="30" fill="#d35400">최고의 각도 박사!</text>
            </svg>
        `;
    }

    function downloadJPG() {
        certCtx.clearRect(0, 0, refs.certCanvas.width, refs.certCanvas.height);
        certCtx.fillStyle = "#f6d365";
        certCtx.fillRect(0, 0, refs.certCanvas.width, refs.certCanvas.height);

        certCtx.fillStyle = "#d35400";
        certCtx.textAlign = "center";
        certCtx.font = "bold 48px 'Malgun Gothic', sans-serif";
        certCtx.fillText("각도 퍼즐 마스터 인증서", 400, 100);

        let stars = "";
        for (let i = 0; i < totalHealth; i += 1) {
            stars += i < state.health ? "★" : "☆";
        }
        certCtx.fillStyle = "#f1c40f";
        certCtx.font = "70px Arial";
        certCtx.fillText(stars, 400, 200);

        certCtx.fillStyle = "#2c3e50";
        certCtx.font = "34px 'Malgun Gothic', sans-serif";
        certCtx.fillText("위 어린이는 각도 퍼즐 9개를 모두 모아", 400, 300);
        certCtx.fillText("최고의 각도 박사가 되었음을 인증합니다.", 400, 360);

        certCtx.fillStyle = "#34495e";
        certCtx.font = "24px 'Malgun Gothic', sans-serif";
        certCtx.fillText(`최종 달린 거리: ${Math.floor(state.distance)}m`, 400, 450);
        certCtx.fillText(`인증 일시: ${getFormattedTimestamp()}`, 400, 500);

        certCtx.fillStyle = "#7f8c8d";
        certCtx.font = "20px 'Malgun Gothic', sans-serif";
        certCtx.fillText("기획 및 제작: 고양이, 송아지, 복숭아7호", 400, 550);

        certCtx.strokeStyle = "#ffffff";
        certCtx.lineWidth = 14;
        certCtx.strokeRect(20, 20, 760, 560);

        const dataURL = refs.certCanvas.toDataURL("image/jpeg", 1.0);
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `각도퍼즐마스터_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function attachEvents() {
        refs.gameStartButton.addEventListener("click", startGame);
        refs.restartFromEndButton.addEventListener("click", restartGame);
        refs.restartFromGameoverButton.addEventListener("click", restartGame);
        refs.downloadButton.addEventListener("click", downloadJPG);
        window.addEventListener("keydown", (event) => {
            if (event.code === "Space") {
                if (!refs.gameModal.classList.contains("hidden")) {
                    event.preventDefault();
                }
                handleJump();
            }
        });
        startLoop();
    }

    function isColliding(a, b, padding = 0) {
        return a.x < b.x + b.w - padding
            && a.x + a.w > b.x + padding
            && a.y < b.y + b.h - padding
            && a.y + a.h > b.y + padding;
    }

    function drawRoundedRect(x, y, width, height, radius, fillColor) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
    }

    return {
        state,
        resetGame,
        startGame,
        restartGame,
        updateDJumpUI,
        updateHealthUI,
        updatePuzzleUI,
        triggerQuiz,
        answerCorrect,
        answerWrong,
        downloadJPG,
        attachEvents,
        gameLoop
    };
})();

const resetGame = GAME1.resetGame;
const startGame = GAME1.startGame;
const restartGame = GAME1.restartGame;
const updateDJumpUI = GAME1.updateDJumpUI;
const updateHealthUI = GAME1.updateHealthUI;
const updatePuzzleUI = GAME1.updatePuzzleUI;
const triggerQuiz = GAME1.triggerQuiz;
const answerCorrect = GAME1.answerCorrect;
const answerWrong = GAME1.answerWrong;
const downloadJPG = GAME1.downloadJPG;
const gameLoop = GAME1.gameLoop;
const attachGame1Events = GAME1.attachEvents;
