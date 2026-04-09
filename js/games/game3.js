"use strict";

const GAME3 = (() => {
    const {
        refs,
        ghostAngleCtx,
        drawAngle,
        setHidden,
        clearElement,
        getAngleTypeLabel
    } = window.STEAM_ANGLE;

    const spots = [
        { id: "locker", name: "사물함", angle: 120, type: "obtuse" },
        { id: "desk", name: "책상 아래", angle: 90, type: "right" },
        { id: "bag", name: "가방 옆", angle: 45, type: "acute" }
    ];

    const traps = [
        {
            id: "window",
            name: "창가 그림자",
            title: "함정 귀신 등장!",
            message: "창문 쪽에서 귀신이 불쑥 나타났어요. 놀랐지만 다시 교실을 살펴보세요."
        },
        {
            id: "shadow",
            name: "칠판 그림자",
            title: "으스스한 함정!",
            message: "칠판 뒤 그림자에서 귀신이 튀어나왔어요. 침착하게 다른 곳을 찾아봐요."
        }
    ];

    const state = {
        started: false,
        keys: 0,
        found: [],
        triggeredTraps: [],
        activeSpotId: null,
        modalMode: null,
        isLocked: false
    };

    function resetGhostGame() {
        ensureGhostModalBits();
        ensureTrapHotspots();

        state.started = false;
        state.keys = 0;
        state.found = [];
        state.triggeredTraps = [];
        state.activeSpotId = null;
        state.modalMode = null;
        state.isLocked = false;

        setHidden(refs.ghostStartScreen, false);
        setHidden(refs.ghostGameShell, true);
        setHidden(refs.ghostWinScreen, true);
        closeGhostModal();
        refs.ghostSceneArt.innerHTML = getSceneMarkup();
        refs.ghostScene.style.setProperty("--flash-x", "50%");
        refs.ghostScene.style.setProperty("--flash-y", "50%");
        ghostAngleCtx.clearRect(0, 0, refs.ghostAngleCanvas.width, refs.ghostAngleCanvas.height);
        updateUI();
    }

    function startGhostGame() {
        ensureGhostModalBits();
        ensureTrapHotspots();

        state.started = true;
        setHidden(refs.ghostStartScreen, true);
        setHidden(refs.ghostWinScreen, true);
        setHidden(refs.ghostGameShell, false);
        closeGhostModal();
        updateUI();
    }

    function restartGhostGame() {
        resetGhostGame();
        startGhostGame();
    }

    function updateUI() {
        refs.ghostKeysCount.textContent = `${state.keys} / ${spots.length}`;
        refs.ghostFoundCount.textContent = `${state.found.length} / ${spots.length}`;
        refs.ghostDoorButton.textContent = state.keys >= spots.length ? "문 열고 탈출!" : `문 열기 (${state.keys}/3)`;

        clearElement(refs.ghostFoundList);
        if (state.found.length === 0) {
            const emptyChip = document.createElement("div");
            emptyChip.className = "monster-chip empty";
            emptyChip.textContent = "아직 찾은 귀신이 없어요";
            refs.ghostFoundList.appendChild(emptyChip);
        } else {
            state.found.forEach((spotId) => {
                const spot = getSpot(spotId);
                if (!spot) {
                    return;
                }
                const item = document.createElement("div");
                item.className = "monster-chip";
                item.textContent = `🔑 ${spot.name}`;
                refs.ghostFoundList.appendChild(item);
            });
        }

        [...refs.ghostHotspots.querySelectorAll(".ghost-hotspot")].forEach((button) => {
            const spotId = button.dataset.spot;
            const isTrap = button.dataset.kind === "trap";
            const isFound = state.found.includes(spotId);
            const isTriggeredTrap = state.triggeredTraps.includes(spotId);

            button.disabled = !state.started || state.isLocked || isFound || isTriggeredTrap;
            button.classList.toggle("is-cleared", isFound);
            button.classList.toggle("is-triggered", isTriggeredTrap);
            button.classList.toggle("is-active", state.activeSpotId === spotId);
            button.classList.toggle("ghost-trap", isTrap);
        });
    }

    function handleGhostHotspotClick(event) {
        const button = event.target.closest(".ghost-hotspot");
        if (!button || !state.started || state.isLocked) {
            return;
        }

        const spotId = button.dataset.spot;
        if (button.dataset.kind === "trap") {
            openTrapModal(spotId);
            return;
        }

        openGhostQuiz(spotId);
    }

    function openGhostQuiz(spotId) {
        const spot = getSpot(spotId);
        if (!spot || state.found.includes(spotId)) {
            return;
        }

        state.activeSpotId = spotId;
        state.modalMode = "quiz";
        state.isLocked = false;

        const angleWrap = getGhostAngleWrap();
        const modalArt = getGhostModalArt();

        refs.ghostQuizTitle.textContent = `${spot.name}에서 각도 문제 발견!`;
        refs.ghostFeedback.textContent = "이 각도는 예각, 직각, 둔각 중 무엇일까요?";
        refs.ghostFeedback.className = "ghost-feedback info";
        setHidden(modalArt, true);
        setHidden(angleWrap, false);
        renderGhostChoiceButtons([
            { id: "acute", label: "예각" },
            { id: "right", label: "직각" },
            { id: "obtuse", label: "둔각" }
        ]);
        setHidden(refs.ghostQuizPanel, false);
        drawAngle(ghostAngleCtx, refs.ghostAngleCanvas, spot.angle, {
            activeColor: "#457b9d",
            centerY: 132,
            radius: 96
        });
        updateUI();
    }

    function openTrapModal(trapId) {
        const trap = getTrap(trapId);
        if (!trap) {
            return;
        }

        if (!state.triggeredTraps.includes(trapId)) {
            state.triggeredTraps.push(trapId);
        }

        state.activeSpotId = trapId;
        state.modalMode = "trap";
        state.isLocked = false;

        const angleWrap = getGhostAngleWrap();
        const modalArt = getGhostModalArt();

        refs.ghostQuizTitle.textContent = trap.title;
        refs.ghostFeedback.textContent = trap.message;
        refs.ghostFeedback.className = "ghost-feedback bad";
        modalArt.innerHTML = `
            <div class="ghost-jumpscare">
                <div class="ghost-jumpscare-emoji">👻</div>
                <strong>함정 귀신!</strong>
                <p>${trap.name}에서 귀신이 튀어나왔어요.</p>
            </div>
        `;
        setHidden(modalArt, false);
        setHidden(angleWrap, true);
        renderGhostChoiceButtons([{ id: "dismiss", label: "다시 교실 보기" }]);
        setHidden(refs.ghostQuizPanel, false);
        updateUI();
    }

    function openGhostInfoModal(title, message, emoji = "🚪") {
        state.activeSpotId = null;
        state.modalMode = "info";
        state.isLocked = false;

        const angleWrap = getGhostAngleWrap();
        const modalArt = getGhostModalArt();

        refs.ghostQuizTitle.textContent = title;
        refs.ghostFeedback.textContent = message;
        refs.ghostFeedback.className = "ghost-feedback info";
        modalArt.innerHTML = `
            <div class="ghost-jumpscare ghost-info-card">
                <div class="ghost-jumpscare-emoji">${emoji}</div>
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
        `;
        setHidden(modalArt, false);
        setHidden(angleWrap, true);
        renderGhostChoiceButtons([{ id: "dismiss", label: "계속 살펴보기" }]);
        setHidden(refs.ghostQuizPanel, false);
        updateUI();
    }

    function closeGhostModal() {
        const angleWrap = getGhostAngleWrap();
        const modalArt = getGhostModalArt();

        setHidden(refs.ghostQuizPanel, true);
        setHidden(modalArt, true);
        setHidden(angleWrap, false);
        modalArt.innerHTML = "";
        refs.ghostQuizTitle.textContent = "숨은 귀신을 찾아보세요";
        refs.ghostFeedback.textContent = "";
        refs.ghostFeedback.className = "ghost-feedback";
        clearElement(refs.ghostOptions);
        ghostAngleCtx.clearRect(0, 0, refs.ghostAngleCanvas.width, refs.ghostAngleCanvas.height);
        state.activeSpotId = null;
        state.modalMode = null;
        state.isLocked = false;
        updateUI();
    }

    function handleGhostOptionClick(event) {
        const button = event.target.closest(".ghost-choice-btn");
        if (!button || !state.started) {
            return;
        }

        if (state.modalMode === "trap" || state.modalMode === "info") {
            closeGhostModal();
            return;
        }

        if (state.modalMode !== "quiz" || !state.activeSpotId || state.isLocked) {
            return;
        }

        const spot = getSpot(state.activeSpotId);
        const choice = button.dataset.choice;
        if (!spot) {
            return;
        }

        if (choice !== spot.type) {
            refs.ghostFeedback.textContent = `틀렸어요. 이 각도는 ${getAngleTypeLabel(spot.type)}이에요.`;
            refs.ghostFeedback.className = "ghost-feedback bad";
            return;
        }

        state.isLocked = true;
        state.found.push(spot.id);
        state.keys += 1;
        refs.ghostFeedback.textContent = `정답! ${spot.name}에서 열쇠를 찾았어요.`;
        refs.ghostFeedback.className = "ghost-feedback good";
        updateUI();

        window.setTimeout(() => {
            closeGhostModal();
        }, 700);
    }

    function handleGhostDoorClick() {
        if (!state.started) {
            return;
        }

        if (state.keys < spots.length) {
            openGhostInfoModal(
                "문이 잠겨 있어요",
                `열쇠가 ${spots.length - state.keys}개 더 필요해요.`,
                "🔒"
            );
            return;
        }

        showGhostWin();
    }

    function showGhostWin() {
        closeGhostModal();
        setHidden(refs.ghostGameShell, true);
        setHidden(refs.ghostWinScreen, false);
    }

    function handleGhostSceneMove(event) {
        const rect = refs.ghostScene.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        refs.ghostScene.style.setProperty("--flash-x", `${Math.max(0, Math.min(100, x))}%`);
        refs.ghostScene.style.setProperty("--flash-y", `${Math.max(0, Math.min(100, y))}%`);
    }

    function renderGhostChoiceButtons(buttons) {
        clearElement(refs.ghostOptions);
        buttons.forEach((item) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "ghost-choice-btn";
            button.dataset.choice = item.id;
            button.textContent = item.label;
            refs.ghostOptions.appendChild(button);
        });
    }

    function ensureTrapHotspots() {
        if (refs.ghostHotspots.querySelector('[data-kind="trap"][data-spot="window"]')) {
            return;
        }

        traps.forEach((trap) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `ghost-hotspot ghost-trap hotspot-${trap.id}`;
            button.dataset.kind = "trap";
            button.dataset.spot = trap.id;
            button.setAttribute("aria-label", trap.name);
            refs.ghostHotspots.appendChild(button);
        });
    }

    function ensureGhostModalBits() {
        if (!getGhostModalArt()) {
            return;
        }

        const angleWrap = getGhostAngleWrap();
        if (angleWrap && !angleWrap.id) {
            angleWrap.id = "ghost-angle-wrap";
        }
    }

    function getGhostAngleWrap() {
        return document.getElementById("ghost-angle-wrap") || refs.ghostQuizPanel.querySelector(".ghost-angle-wrap");
    }

    function getGhostModalArt() {
        let modalArt = document.getElementById("ghost-modal-art");
        if (modalArt) {
            return modalArt;
        }

        const angleWrap = getGhostAngleWrap();
        if (!angleWrap) {
            return null;
        }

        modalArt = document.createElement("div");
        modalArt.id = "ghost-modal-art";
        modalArt.className = "ghost-modal-art hidden";
        refs.ghostQuizPanel.insertBefore(modalArt, angleWrap);
        return modalArt;
    }

    function getSpot(id) {
        return spots.find((spot) => spot.id === id) || null;
    }

    function getTrap(id) {
        return traps.find((trap) => trap.id === id) || null;
    }

    function getSceneMarkup() {
        return `
            <svg viewBox="0 0 900 560" role="img" aria-label="어두운 교실">
                <rect width="900" height="560" fill="transparent"/>
                <rect x="0" y="0" width="900" height="380" fill="rgba(255,255,255,0.02)"/>
                <rect x="70" y="88" width="190" height="260" rx="14" fill="#33415c" stroke="#cad2df" stroke-width="8"/>
                <circle cx="220" cy="210" r="6" fill="#f2eadf"/>
                <rect x="566" y="86" width="186" height="276" rx="16" fill="#53657f"/>
                <rect x="604" y="136" width="108" height="150" rx="14" fill="#edf1f6"/>
                <circle cx="694" cy="214" r="6" fill="#53657f"/>
                <rect x="310" y="300" width="276" height="28" rx="12" fill="#7f5539"/>
                <rect x="332" y="208" width="232" height="92" rx="16" fill="#d9b08c"/>
                <path d="M96 450 Q132 394 208 408 Q264 420 276 484 L88 484 Z" fill="#915f7a" stroke="#efcfdf" stroke-width="8"/>
                <rect x="0" y="484" width="900" height="76" fill="#202c39"/>
                <rect x="282" y="84" width="222" height="72" rx="10" fill="#243447" stroke="#90a4c3" stroke-width="6"/>
                <rect x="288" y="90" width="210" height="60" rx="8" fill="#1a2535"/>
                <rect x="766" y="110" width="86" height="144" rx="10" fill="#42506a"/>
                <line x1="808" y1="110" x2="808" y2="254" stroke="#7b8fa8" stroke-width="4"/>
                <line x1="766" y1="180" x2="852" y2="180" stroke="#7b8fa8" stroke-width="4"/>
            </svg>
        `;
    }

    function attachEvents() {
        refs.ghostStartButton.addEventListener("click", startGhostGame);
        refs.ghostRestartButton.addEventListener("click", restartGhostGame);
        refs.ghostDoorButton.addEventListener("click", handleGhostDoorClick);
        refs.ghostOptions.addEventListener("click", handleGhostOptionClick);
        refs.ghostHotspots.addEventListener("click", handleGhostHotspotClick);
        refs.ghostScene.addEventListener("pointermove", handleGhostSceneMove);
    }

    return {
        state,
        spots,
        resetGhostGame,
        startGhostGame,
        restartGhostGame,
        handleGhostHotspotClick,
        handleGhostOptionClick,
        handleGhostDoorClick,
        handleGhostSceneMove,
        attachEvents
    };
})();

const ghostSpots = GAME3.spots;
const resetGhostGame = GAME3.resetGhostGame;
const startGhostGame = GAME3.startGhostGame;
const restartGhostGame = GAME3.restartGhostGame;
const handleGhostHotspotClick = GAME3.handleGhostHotspotClick;
const handleGhostOptionClick = GAME3.handleGhostOptionClick;
const handleGhostDoorClick = GAME3.handleGhostDoorClick;
const handleGhostSceneMove = GAME3.handleGhostSceneMove;
const attachGame3Events = GAME3.attachEvents;
