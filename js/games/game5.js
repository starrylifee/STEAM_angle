"use strict";

const GAME5 = (() => {
    const {
        refs,
        schoolAngleCtx,
        shuffle,
        drawAngle,
        getAngleType,
        getAngleTypeLabel,
        setHidden,
        clearElement
    } = window.STEAM_ANGLE;

    const angleChoices = [30, 45, 60, 75, 90, 105, 120, 135, 150];
    const rooms = [
        { id: "room-1-1", label: "1-1", reward: "map", name: "학교 지도", icon: "🗺️", angle: 45 },
        { id: "room-1-2", label: "1-2", reward: "cure", name: "치료제", icon: "💊", angle: 60 },
        { id: "room-1-3", label: "1-3", reward: "sword", name: "검", icon: "🗡️", angle: 90 },
        { id: "room-1-4", label: "1-4", reward: "student", name: "학생 구조", icon: "🧑", angle: 120 },
        { id: "room-1-5", label: "1-5", reward: "gun", name: "총", icon: "🔫", angle: 135 },
        { id: "room-2-1", label: "2-1", reward: "angel", name: "수학 천사", icon: "😇", angle: 30 },
        { id: "room-2-2", label: "2-2", reward: "bomb", name: "폭탄", icon: "💣", angle: 150 }
    ];
    const bossQuestions = [45, 90, 120, 60, 135];

    const state = {
        started: false,
        hp: 3,
        maxHp: 3,
        solved: 0,
        rescued: 0,
        healItems: 0,
        attacks: 1,
        shields: 0,
        hasMap: false,
        bossUnlocked: false,
        inBossStage: false,
        bossHp: 3,
        bossTurn: 0,
        clearedRooms: [],
        currentRoomId: null,
        currentQuestion: null,
        waitingStudentRoomId: null,
        isLocked: false
    };

    function resetSchoolGame() {
        state.started = false;
        state.hp = 3;
        state.maxHp = 3;
        state.solved = 0;
        state.rescued = 0;
        state.healItems = 0;
        state.attacks = 1;
        state.shields = 0;
        state.hasMap = false;
        state.bossUnlocked = false;
        state.inBossStage = false;
        state.bossHp = 3;
        state.bossTurn = 0;
        state.clearedRooms = [];
        state.currentRoomId = null;
        state.currentQuestion = null;
        state.waitingStudentRoomId = null;
        state.isLocked = false;

        setHidden(refs.schoolStartScreen, false);
        setHidden(refs.schoolGameShell, true);
        setHidden(refs.schoolWinScreen, true);
        setHidden(refs.schoolLoseScreen, true);
        setHidden(refs.schoolBossButton, true);
        refs.schoolBossButton.textContent = "괴물왕 스테이지 입장";
        refs.schoolQuestionTitle.textContent = "교실을 눌러 탐색을 시작하세요";
        refs.schoolFeedback.textContent = "";
        refs.schoolFeedback.className = "school-feedback";
        refs.schoolWinSummary.textContent = "";
        refs.schoolLoseSummary.textContent = "";
        refs.schoolOptions.innerHTML = "";
        schoolAngleCtx.clearRect(0, 0, refs.schoolAngleCanvas.width, refs.schoolAngleCanvas.height);
        renderScene();
        updateUI();
    }

    function startSchoolGame() {
        state.started = true;
        setHidden(refs.schoolStartScreen, true);
        setHidden(refs.schoolWinScreen, true);
        setHidden(refs.schoolLoseScreen, true);
        setHidden(refs.schoolGameShell, false);
        renderScene();
        updateUI();
    }

    function restartSchoolGame() {
        resetSchoolGame();
        startSchoolGame();
    }

    function updateUI() {
        renderHp();
        renderInventory();
        renderRooms();
        renderScene();

        refs.schoolSolvedCount.textContent = `${state.solved} / ${rooms.length}`;
        refs.schoolBossHp.textContent = state.bossUnlocked ? `${state.bossHp} / 3` : "잠김";
        refs.schoolBossButton.classList.toggle("hidden", !state.bossUnlocked || state.inBossStage);
    }

    function renderHp() {
        clearElement(refs.schoolHpTrack);
        for (let i = 0; i < state.maxHp; i += 1) {
            const span = document.createElement("span");
            span.textContent = i < state.hp ? "❤️" : "🖤";
            refs.schoolHpTrack.appendChild(span);
        }
    }

    function renderInventory() {
        refs.schoolInventory.innerHTML = "";
        [
            { label: `무기 ${state.attacks}`, key: "attack" },
            { label: `치료제 ${state.healItems}`, key: "cure", button: true },
            { label: `천사 ${state.shields}`, key: "angel" },
            { label: `지도 ${state.hasMap ? "있음" : "없음"}`, key: "map" }
        ].forEach((item) => {
            const chip = document.createElement("div");
            chip.className = "school-item-chip";
            if (item.button) {
                const button = document.createElement("button");
                button.type = "button";
                button.dataset.item = item.key;
                button.textContent = item.label;
                chip.appendChild(button);
            } else {
                chip.textContent = item.label;
            }
            refs.schoolInventory.appendChild(chip);
        });
    }

    function renderRooms() {
        refs.schoolRoomGrid.innerHTML = "";
        refs.schoolRoomGrid.classList.toggle("hidden", state.inBossStage);

        rooms.forEach((room) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "school-room-btn";
            button.dataset.room = room.id;

            const top = document.createElement("strong");
            top.textContent = room.label;
            button.appendChild(top);

            const bottom = document.createElement("small");
            bottom.textContent = state.hasMap ? `${room.icon} ${room.name}` : "숨은 보상 찾기";
            button.appendChild(bottom);

            if (state.clearedRooms.includes(room.id)) {
                button.classList.add("is-cleared");
            }
            if (state.waitingStudentRoomId === room.id) {
                button.classList.add("needs-cure");
            }

            refs.schoolRoomGrid.appendChild(button);
        });
    }

    function renderScene() {
        const schoolScene = getSchoolSceneElement();
        if (schoolScene) {
            schoolScene.classList.toggle("is-boss-stage", state.inBossStage);
        }

        if (state.inBossStage) {
            refs.schoolSceneArt.innerHTML = getBossStageMarkup();
            return;
        }

        refs.schoolSceneArt.innerHTML = getSchoolSceneMarkup();
    }

    function handleSchoolRoomClick(event) {
        const button = event.target.closest(".school-room-btn");
        if (!button || !state.started || state.isLocked || state.inBossStage) {
            return;
        }

        const room = rooms.find((item) => item.id === button.dataset.room);
        if (!room || state.clearedRooms.includes(room.id)) {
            return;
        }

        prepareRoomQuestion(room);
    }

    function prepareRoomQuestion(room) {
        state.currentRoomId = room.id;
        state.currentQuestion = { mode: "room", answer: room.angle };
        state.isLocked = false;

        refs.schoolQuestionTitle.textContent = `${room.label} 교실 문제`;
        setFeedback(`${room.name}을 찾으려면 각도를 맞혀 보세요.`, "info");
        renderRoomOptions(room.angle);
        drawAngle(schoolAngleCtx, refs.schoolAngleCanvas, room.angle, {
            activeColor: "#6c9a35",
            centerY: 132,
            radius: 92
        });
    }

    function renderRoomOptions(correct) {
        refs.schoolOptions.innerHTML = "";
        const options = [correct];
        while (options.length < 4) {
            const fake = angleChoices[Math.floor(Math.random() * angleChoices.length)];
            if (!options.includes(fake)) {
                options.push(fake);
            }
        }

        shuffle(options).forEach((value) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "school-option-btn";
            button.dataset.value = String(value);
            button.textContent = `${value}°`;
            refs.schoolOptions.appendChild(button);
        });
    }

    function renderBossOptions() {
        refs.schoolOptions.innerHTML = "";
        [
            { key: "acute", label: "예각" },
            { key: "right", label: "직각" },
            { key: "obtuse", label: "둔각" }
        ].forEach((option) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "school-option-btn";
            button.dataset.choice = option.key;
            button.textContent = option.label;
            refs.schoolOptions.appendChild(button);
        });
    }

    function handleSchoolOptionClick(event) {
        const button = event.target.closest(".school-option-btn");
        if (!button || !state.started || state.isLocked || !state.currentQuestion) {
            return;
        }

        state.isLocked = true;

        if (state.currentQuestion.mode === "room") {
            const picked = Number(button.dataset.value);
            if (picked === state.currentQuestion.answer) {
                resolveRoomSuccess();
            } else {
                handleSchoolDamage(`틀렸어요. 정답은 ${state.currentQuestion.answer}°예요.`);
            }
            return;
        }

        if (button.dataset.choice === state.currentQuestion.answer) {
            resolveBossSuccess();
        } else {
            handleSchoolDamage(`실수! 이번 각도는 ${getAngleTypeLabel(state.currentQuestion.answer)}이었어요.`);
        }
    }

    function resolveRoomSuccess() {
        const room = rooms.find((item) => item.id === state.currentRoomId);
        if (!room) {
            state.isLocked = false;
            return;
        }

        state.clearedRooms.push(room.id);
        state.solved += 1;
        state.currentRoomId = null;
        state.currentQuestion = null;
        state.isLocked = false;
        applyReward(room);
        updateUI();
        maybeUnlockBoss();
    }

    function applyReward(room) {
        if (room.reward === "map") {
            state.hasMap = true;
            setFeedback("정답! 학교 지도를 찾았어요.", "good");
            return;
        }

        if (room.reward === "cure") {
            state.healItems += 1;
            setFeedback("정답! 치료제를 발견했어요.", "good");
            return;
        }

        if (room.reward === "student") {
            state.waitingStudentRoomId = room.id;
            setFeedback("정답! 괴물에게 걸린 학생을 찾았어요. 치료제로 구해주세요.", "good");
            return;
        }

        if (room.reward === "angel") {
            state.shields += 1;
            setFeedback("정답! 수학 천사가 한 번 보호해 줘요.", "good");
            return;
        }

        state.attacks += 1;
        setFeedback(`정답! ${room.icon} ${room.name}을(를) 얻었어요.`, "good");
    }

    function maybeUnlockBoss() {
        if (state.solved < rooms.length || state.bossUnlocked) {
            return;
        }

        state.bossUnlocked = true;
        refs.schoolBossButton.textContent = "괴물왕 스테이지 입장";
        setFeedback("모든 교실 탐색 완료! 이제 괴물왕 스테이지에 들어갈 수 있어요.", "info");
        updateUI();
    }

    function startSchoolBossBattle() {
        if (!state.started || !state.bossUnlocked || state.bossHp <= 0 || state.isLocked) {
            return;
        }

        state.inBossStage = true;
        state.currentRoomId = null;
        updateUI();
        prepareBossQuestion();
    }

    function prepareBossQuestion() {
        if (state.hp <= 0 || state.bossHp <= 0) {
            return;
        }

        const angle = bossQuestions[state.bossTurn % bossQuestions.length];
        state.bossTurn += 1;
        state.currentQuestion = {
            mode: "boss",
            angle,
            answer: getAngleType(angle)
        };
        state.isLocked = false;

        refs.schoolQuestionTitle.textContent = "괴물왕 결전";
        setFeedback("괴물왕의 각도를 분류해서 공격하세요.", "info");
        renderBossOptions();
        drawAngle(schoolAngleCtx, refs.schoolAngleCanvas, angle, {
            activeColor: "#c0392b",
            centerY: 132,
            radius: 92
        });
        renderScene();
    }

    function resolveBossSuccess() {
        if (state.attacks <= 0) {
            state.isLocked = false;
            setFeedback("무기가 부족해요. 모은 무기를 아껴 써 보세요.", "bad");
            return;
        }

        state.attacks = Math.max(0, state.attacks - 1);
        state.bossHp = Math.max(0, state.bossHp - 1);
        state.currentQuestion = null;
        updateUI();
        renderScene();
        setFeedback("정답! 괴물왕에게 피해를 줬어요.", "good");

        if (state.bossHp <= 0) {
            showSchoolWin();
            return;
        }

        scheduleNextBossQuestion();
    }

    function handleSchoolDamage(message) {
        const mode = state.currentQuestion?.mode;

        if (mode !== "boss" && state.shields > 0) {
            state.shields -= 1;
            state.currentQuestion = null;
            state.currentRoomId = null;
            state.isLocked = false;
            updateUI();

            setFeedback(`${message} 수학 천사가 한 번 막아 주었어요.`, "info");
            return;
        }

        state.hp = Math.max(0, state.hp - 1);
        state.currentQuestion = null;
        state.currentRoomId = null;
        state.isLocked = false;
        updateUI();

        if (state.hp <= 0) {
            setFeedback(`${message} 체력이 모두 떨어졌어요.`, "bad");
            showSchoolLose();
            return;
        }

        if (mode === "boss") {
            setFeedback(`${message} 체력 1 감소! 곧 다음 문제가 나옵니다.`, "bad");
            scheduleNextBossQuestion();
            return;
        }

        setFeedback(`${message} 체력 1 감소!`, "bad");
    }

    function scheduleNextBossQuestion() {
        window.setTimeout(() => {
            if (state.hp <= 0 || state.bossHp <= 0) {
                return;
            }
            prepareBossQuestion();
        }, 800);
    }

    function handleSchoolInventoryClick(event) {
        const button = event.target.closest("button[data-item]");
        if (!button || button.dataset.item !== "cure" || !state.started) {
            return;
        }

        if (state.healItems <= 0) {
            setFeedback("치료제가 아직 없어요.", "info");
            return;
        }

        state.healItems -= 1;

        if (state.waitingStudentRoomId) {
            state.waitingStudentRoomId = null;
            state.rescued += 1;
            setFeedback("치료제로 학생을 구했어요!", "good");
        } else if (state.hp < state.maxHp) {
            state.hp += 1;
            setFeedback("치료제로 체력 1칸 회복!", "good");
        } else {
            state.healItems += 1;
            setFeedback("지금은 치료제가 필요하지 않아요.", "info");
        }

        updateUI();
    }

    function showSchoolWin() {
        setHidden(refs.schoolGameShell, true);
        setHidden(refs.schoolWinScreen, false);
        refs.schoolWinSummary.textContent = `구한 학생 ${state.rescued}명 · 남은 체력 ${state.hp}칸`;
    }

    function showSchoolLose() {
        setHidden(refs.schoolGameShell, true);
        setHidden(refs.schoolLoseScreen, false);
        refs.schoolLoseSummary.textContent = `탐색 완료 ${state.solved}개 · 구한 학생 ${state.rescued}명`;
    }

    function setFeedback(message, tone) {
        refs.schoolFeedback.textContent = message;
        refs.schoolFeedback.className = `school-feedback ${tone}`;
    }

    function getSchoolSceneMarkup() {
        return `
            <svg viewBox="0 0 700 340" role="img" aria-label="정전된 학교">
                <rect width="700" height="340" fill="transparent"/>
                <rect x="40" y="34" width="620" height="230" rx="26" fill="#eaf6e1" stroke="#cad9b6" stroke-width="8"/>
                <rect x="84" y="74" width="132" height="156" rx="18" fill="#ffffff" stroke="#b5c79b" stroke-width="6"/>
                <rect x="258" y="74" width="132" height="156" rx="18" fill="#ffffff" stroke="#b5c79b" stroke-width="6"/>
                <rect x="432" y="74" width="132" height="156" rx="18" fill="#ffffff" stroke="#b5c79b" stroke-width="6"/>
                <rect x="0" y="268" width="700" height="72" fill="#dde8cf"/>
                <circle cx="610" cy="58" r="20" fill="#ffd166"/>
                <path d="M120 290 L144 242 L168 290 Z" fill="#8d6e63"/>
                <path d="M330 290 L354 242 L378 290 Z" fill="#8d6e63"/>
                <path d="M540 290 L564 242 L588 290 Z" fill="#8d6e63"/>
            </svg>
        `;
    }

    function getBossStageMarkup() {
        return `
            <div class="school-boss-stage">
                <div class="school-boss-badge">FINAL STAGE</div>
                <div class="school-boss-monster">👾</div>
                <div class="school-boss-name">괴물왕</div>
                <div class="school-boss-hearts">${"❤️".repeat(state.bossHp)}${"🖤".repeat(Math.max(0, 3 - state.bossHp))}</div>
                <p class="school-boss-copy">예각, 직각, 둔각을 맞혀 학교를 구하세요.</p>
            </div>
        `;
    }

    function getSchoolSceneElement() {
        return refs.schoolSceneArt?.parentElement || null;
    }

    function attachEvents() {
        refs.schoolStartButton.addEventListener("click", startSchoolGame);
        refs.schoolRestartButton.addEventListener("click", restartSchoolGame);
        refs.schoolRetryButton.addEventListener("click", restartSchoolGame);
        refs.schoolRoomGrid.addEventListener("click", handleSchoolRoomClick);
        refs.schoolOptions.addEventListener("click", handleSchoolOptionClick);
        refs.schoolInventory.addEventListener("click", handleSchoolInventoryClick);
        refs.schoolBossButton.addEventListener("click", startSchoolBossBattle);
    }

    return {
        state,
        rooms,
        resetSchoolGame,
        startSchoolGame,
        restartSchoolGame,
        handleSchoolRoomClick,
        handleSchoolOptionClick,
        handleSchoolInventoryClick,
        startSchoolBossBattle,
        attachEvents
    };
})();

const schoolRooms = GAME5.rooms;
const resetSchoolGame = GAME5.resetSchoolGame;
const startSchoolGame = GAME5.startSchoolGame;
const restartSchoolGame = GAME5.restartSchoolGame;
const handleSchoolRoomClick = GAME5.handleSchoolRoomClick;
const handleSchoolOptionClick = GAME5.handleSchoolOptionClick;
const handleSchoolInventoryClick = GAME5.handleSchoolInventoryClick;
const startSchoolBossBattle = GAME5.startSchoolBossBattle;
const attachGame5Events = GAME5.attachEvents;
