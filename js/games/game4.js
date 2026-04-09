"use strict";

const GAME4 = (() => {
    const { refs, cannonAngleCtx, shuffle, drawAngle, setHidden, clearElement } = window.STEAM_ANGLE;

    const angleChoices = [30, 45, 60, 75, 90, 105, 120, 135, 150];

    const state = {
        started: false,
        round: 0,
        totalRounds: 10,
        lives: 3,
        score: 0,
        currentAngle: 0,
        currentOptions: [],
        isLocked: false,
        results: []
    };

    function resetCannonGame() {
        state.started = false;
        state.round = 0;
        state.lives = 3;
        state.score = 0;
        state.currentAngle = 0;
        state.currentOptions = [];
        state.isLocked = false;
        state.results = [];

        setHidden(refs.cannonStartScreen, false);
        setHidden(refs.cannonGameShell, true);
        setHidden(refs.cannonWinScreen, true);
        setHidden(refs.cannonLoseScreen, true);
        refs.cannonFeedback.textContent = "";
        refs.cannonWinSummary.textContent = "";
        refs.cannonLoseSummary.textContent = "";
        refs.cannonSceneArt.innerHTML = getSceneMarkup("idle");
        refs.cannonOptions.innerHTML = "";
        cannonAngleCtx.clearRect(0, 0, refs.cannonAngleCanvas.width, refs.cannonAngleCanvas.height);
        updateUI();
    }

    function startCannonGame() {
        state.started = true;
        setHidden(refs.cannonStartScreen, true);
        setHidden(refs.cannonWinScreen, true);
        setHidden(refs.cannonLoseScreen, true);
        setHidden(refs.cannonGameShell, false);
        prepareRound();
    }

    function restartCannonGame() {
        resetCannonGame();
        startCannonGame();
    }

    function updateUI() {
        refs.cannonRound.textContent = `${Math.min(state.round, state.totalRounds)} / ${state.totalRounds}`;
        refs.cannonScore.textContent = `${state.score}척`;
        renderLives();
        renderFleet();
    }

    function renderLives() {
        clearElement(refs.cannonLivesTrack);
        for (let i = 0; i < 3; i += 1) {
            const token = document.createElement("div");
            token.className = `cannon-token ${i < state.lives ? "active" : ""}`;
            token.textContent = i < state.lives ? "💣" : "◌";
            refs.cannonLivesTrack.appendChild(token);
        }
    }

    function renderFleet() {
        clearElement(refs.cannonFleetTrack);
        for (let i = 0; i < state.totalRounds; i += 1) {
            const item = document.createElement("div");
            const result = state.results[i];
            item.className = `cannon-fleet-item ${result || ""}`;
            item.textContent = result === "hit" ? "🚢" : result === "miss" ? "🌊" : "·";
            refs.cannonFleetTrack.appendChild(item);
        }
    }

    function prepareRound() {
        if (state.lives <= 0) {
            showCannonLose();
            return;
        }

        if (state.round >= state.totalRounds) {
            showCannonWin();
            return;
        }

        state.round += 1;
        state.currentAngle = angleChoices[Math.floor(Math.random() * angleChoices.length)];
        state.currentOptions = buildOptions(state.currentAngle);
        state.isLocked = false;

        refs.cannonFeedback.textContent = "대포 아래 각도를 보고 위 숫자 중 하나를 골라 보세요.";
        refs.cannonFeedback.className = "cannon-feedback info";
        refs.cannonSceneArt.innerHTML = getSceneMarkup("idle");
        renderOptions();
        drawAngle(cannonAngleCtx, refs.cannonAngleCanvas, state.currentAngle, {
            activeColor: "#e76f51",
            centerY: 132,
            radius: 94
        });
        updateUI();
    }

    function buildOptions(correct) {
        const options = [correct];
        while (options.length < 3) {
            const fake = angleChoices[Math.floor(Math.random() * angleChoices.length)];
            if (!options.includes(fake)) {
                options.push(fake);
            }
        }
        return shuffle(options);
    }

    function renderOptions() {
        refs.cannonOptions.innerHTML = "";
        state.currentOptions.forEach((angle) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "cannon-option-btn";
            button.dataset.angle = String(angle);
            button.textContent = `${angle}°`;
            refs.cannonOptions.appendChild(button);
        });
    }

    function handleCannonOptionClick(event) {
        const button = event.target.closest(".cannon-option-btn");
        if (!button || !state.started || state.isLocked) {
            return;
        }

        state.isLocked = true;
        const picked = Number(button.dataset.angle);
        const correct = picked === state.currentAngle;

        if (correct) {
            state.score += 1;
            state.results.push("hit");
            refs.cannonFeedback.textContent = "정답! 적의 배가 기울며 가라앉아요.";
            refs.cannonFeedback.className = "cannon-feedback good";
            refs.cannonSceneArt.innerHTML = getSceneMarkup("hit");
        } else {
            state.lives = Math.max(0, state.lives - 1);
            state.results.push("miss");
            refs.cannonFeedback.textContent = `아쉬워요. 정답은 ${state.currentAngle}°였어요.`;
            refs.cannonFeedback.className = "cannon-feedback bad";
            refs.cannonSceneArt.innerHTML = getSceneMarkup("miss");
        }

        updateUI();

        window.setTimeout(() => {
            if (state.lives <= 0) {
                showCannonLose();
                return;
            }

            if (state.round >= state.totalRounds) {
                showCannonWin();
                return;
            }

            prepareRound();
        }, 750);
    }

    function showCannonWin() {
        setHidden(refs.cannonGameShell, true);
        setHidden(refs.cannonWinScreen, false);
        refs.cannonWinSummary.textContent = `침몰시킨 배 ${state.score}척, 남은 대포 ${state.lives}개`;
    }

    function showCannonLose() {
        setHidden(refs.cannonGameShell, true);
        setHidden(refs.cannonLoseScreen, false);
        refs.cannonLoseSummary.textContent = `침몰시킨 배 ${state.score}척, 10문제 중 ${state.round}문제 진행`;
    }

    function getSceneMarkup(mode) {
        const shipTransform = mode === "hit" ? "rotate(-14 560 258)" : mode === "miss" ? "rotate(5 560 258)" : "";
        const splash = mode === "hit"
            ? '<circle cx="540" cy="294" r="18" fill="rgba(255,255,255,0.75)"/><circle cx="576" cy="304" r="10" fill="rgba(255,255,255,0.5)"/>'
            : "";

        return `
            <svg viewBox="0 0 700 340" role="img" aria-label="바다 전투">
                <defs>
                    <linearGradient id="cannonSky" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#ffe0b2"/>
                        <stop offset="100%" stop-color="#8bd3ff"/>
                    </linearGradient>
                </defs>
                <rect width="700" height="340" fill="url(#cannonSky)"/>
                <circle cx="604" cy="62" r="34" fill="#ffd166"/>
                <rect y="230" width="700" height="110" fill="#3d7ea6"/>
                <path d="M0 248 Q70 236 140 248 T280 248 T420 248 T560 248 T700 248 V340 H0 Z" fill="#2a607d"/>
                <rect x="138" y="214" width="54" height="52" rx="12" fill="#7b5e57"/>
                <path d="M188 224 L260 190 L270 208 L194 242 Z" fill="#2f3138"/>
                <g transform="${shipTransform}">
                    <path d="M490 250 L612 250 L586 288 L516 288 Z" fill="#825c44"/>
                    <rect x="542" y="204" width="16" height="46" fill="#f1f5f9"/>
                    <path d="M558 208 L598 226 L558 240 Z" fill="#ffffff"/>
                    <text x="552" y="274" text-anchor="middle" font-size="20" fill="#ffffff">적</text>
                </g>
                ${splash}
            </svg>
        `;
    }

    function attachEvents() {
        refs.cannonStartButton.addEventListener("click", startCannonGame);
        refs.cannonRestartButton.addEventListener("click", restartCannonGame);
        refs.cannonRetryButton.addEventListener("click", restartCannonGame);
        refs.cannonOptions.addEventListener("click", handleCannonOptionClick);
    }

    return {
        state,
        resetCannonGame,
        startCannonGame,
        restartCannonGame,
        handleCannonOptionClick,
        attachEvents
    };
})();

const resetCannonGame = GAME4.resetCannonGame;
const startCannonGame = GAME4.startCannonGame;
const restartCannonGame = GAME4.restartCannonGame;
const handleCannonOptionClick = GAME4.handleCannonOptionClick;
const attachGame4Events = GAME4.attachEvents;
