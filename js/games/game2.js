"use strict";

const GAME2 = (() => {
    const { refs, monsterAngleCtx, shuffle, drawAngle, setHidden, clearElement } = window.STEAM_ANGLE;

    const angleChoices = [30, 45, 60, 75, 90, 105, 120, 135, 150];
    const shopPool = [
        { id: "staff", name: "덩굴 지팡이", type: "damage", value: 30, icon: "🪄" },
        { id: "sword", name: "수정 검", type: "damage", value: 120, icon: "🗡️" },
        { id: "bomb", name: "폭탄", type: "damage", value: 250, icon: "💣" },
        { id: "potion", name: "포션", type: "heal", value: 20, icon: "🧪" },
        { id: "heart", name: "하트", type: "heal", value: 40, icon: "💖" }
    ];
    const encounters = [
        { id: "horn", name: "뿔몬", hp: 90, reward: 120, scene: "day", art: "horn" },
        { id: "ghost", name: "유령몬", hp: 130, reward: 180, scene: "volcano", art: "ghost" },
        { id: "robot", name: "네모몬", hp: 220, reward: 250, scene: "day", art: "robot" },
        { id: "boss", name: "보스 고양몬", hp: 320, reward: 500, scene: "volcano", art: "boss", boss: true }
    ];

    const state = {
        started: false,
        playerHp: 120,
        maxHp: 120,
        points: 150,
        inventory: [],
        allies: [],
        encounterIndex: 0,
        currentEnemy: null,
        currentAngle: 0,
        isLocked: false
    };

    function resetMonsterGame() {
        state.started = false;
        state.playerHp = 120;
        state.maxHp = 120;
        state.points = 150;
        state.inventory = [];
        state.allies = [];
        state.encounterIndex = 0;
        state.currentEnemy = null;
        state.currentAngle = 0;
        state.isLocked = false;

        setHidden(refs.monsterStartScreen, false);
        setHidden(refs.monsterGameShell, true);
        setHidden(refs.monsterWinScreen, true);
        setHidden(refs.monsterLoseScreen, true);
        refs.monsterFeedback.textContent = "";
        refs.monsterBoxFeedback.textContent = "무기나 회복 아이템이 랜덤으로 나와요.";
        refs.monsterWinAllies.innerHTML = "";
        refs.monsterScene.classList.add("scene-day");
        refs.monsterScene.classList.remove("scene-volcano");
        refs.monsterSceneArt.innerHTML = getSceneMarkup("day");
        refs.monsterHeroFigure.innerHTML = getHeroMarkup();
        monsterAngleCtx.clearRect(0, 0, refs.monsterAngleCanvas.width, refs.monsterAngleCanvas.height);
        updateUI();
    }

    function startMonsterGame() {
        state.started = true;
        setHidden(refs.monsterStartScreen, true);
        setHidden(refs.monsterWinScreen, true);
        setHidden(refs.monsterLoseScreen, true);
        setHidden(refs.monsterGameShell, false);
        prepareEncounter();
    }

    function restartMonsterGame() {
        resetMonsterGame();
        startMonsterGame();
    }

    function updateUI() {
        refs.monsterPlayerHp.textContent = String(state.playerHp);
        refs.monsterPoints.textContent = String(state.points);
        refs.monsterRound.textContent = `${Math.min(state.encounterIndex + 1, encounters.length)} / ${encounters.length}`;

        clearElement(refs.monsterInventory);
        state.inventory.forEach((item, index) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "monster-chip";
            button.dataset.index = String(index);
            button.innerHTML = `${item.icon} ${item.name}`;
            refs.monsterInventory.appendChild(button);
        });

        clearElement(refs.monsterAllies);
        state.allies.forEach((ally) => {
            const chip = document.createElement("div");
            chip.className = "monster-chip";
            chip.innerHTML = `${ally.icon} ${ally.name}`;
            refs.monsterAllies.appendChild(chip);
        });

        if (state.currentEnemy) {
            refs.monsterFoeName.textContent = state.currentEnemy.name;
            refs.monsterFoeHp.textContent = `${state.currentEnemy.hp} / ${state.currentEnemy.maxHp}`;
            refs.monsterFoeHpFill.style.width = `${(state.currentEnemy.hp / state.currentEnemy.maxHp) * 100}%`;
        } else {
            refs.monsterFoeName.textContent = "몬스터";
            refs.monsterFoeHp.textContent = "0 / 0";
            refs.monsterFoeHpFill.style.width = "0%";
        }
    }

    function prepareEncounter() {
        const template = encounters[state.encounterIndex];
        state.currentEnemy = { ...template, maxHp: template.hp };
        state.currentAngle = pickAngle();
        state.isLocked = false;

        refs.monsterScene.classList.toggle("scene-volcano", template.scene === "volcano");
        refs.monsterScene.classList.toggle("scene-day", template.scene !== "volcano");
        refs.monsterSceneArt.innerHTML = getSceneMarkup(template.scene);
        refs.monsterFoeFigure.innerHTML = getMonsterMarkup(template.art);
        refs.monsterFeedback.textContent = "각도를 보고 정답을 골라 보세요.";
        refs.monsterFeedback.className = "monster-feedback info";
        renderOptions();
        drawAngle(monsterAngleCtx, refs.monsterAngleCanvas, state.currentAngle, {
            activeColor: "#2a9d8f",
            centerY: 132,
            radius: 96
        });
        updateUI();
    }

    function renderOptions() {
        refs.monsterOptions.innerHTML = "";
        const options = [state.currentAngle];
        while (options.length < 5) {
            const candidate = pickAngle();
            if (!options.includes(candidate)) {
                options.push(candidate);
            }
        }

        shuffle(options).forEach((value) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "monster-option-btn";
            button.dataset.angle = String(value);
            button.textContent = `${value}°`;
            refs.monsterOptions.appendChild(button);
        });
    }

    function pickAngle() {
        return angleChoices[Math.floor(Math.random() * angleChoices.length)];
    }

    function handleMonsterOptionClick(event) {
        const button = event.target.closest(".monster-option-btn");
        if (!button || !state.started || state.isLocked || !state.currentEnemy) {
            return;
        }

        state.isLocked = true;
        const value = Number(button.dataset.angle);
        if (value === state.currentAngle) {
            applyMonsterDamage(45, `정답! ${state.currentEnemy.name}에게 45 데미지!`, "good");
            return;
        }

        state.playerHp = Math.max(0, state.playerHp - 12);
        refs.monsterFeedback.textContent = "아쉬워요! 내 체력 -12";
        refs.monsterFeedback.className = "monster-feedback bad";
        updateUI();

        if (state.playerHp <= 0) {
            showMonsterLose();
            return;
        }

        window.setTimeout(() => {
            state.currentAngle = pickAngle();
            renderOptions();
            drawAngle(monsterAngleCtx, refs.monsterAngleCanvas, state.currentAngle, {
                activeColor: "#2a9d8f",
                centerY: 132,
                radius: 96
            });
            state.isLocked = false;
        }, 700);
    }

    function buyMonsterBox() {
        if (!state.started) {
            refs.monsterBoxFeedback.textContent = "먼저 게임을 시작해 주세요.";
            return;
        }

        if (state.points < 100) {
            refs.monsterBoxFeedback.textContent = "포인트가 부족해요.";
            return;
        }

        state.points -= 100;
        const reward = { ...shopPool[Math.floor(Math.random() * shopPool.length)] };
        reward.uid = `${reward.id}-${Date.now()}-${Math.random()}`;
        state.inventory.push(reward);
        refs.monsterBoxFeedback.textContent = `${reward.icon} ${reward.name} 획득!`;
        updateUI();
    }

    function handleMonsterInventoryClick(event) {
        const button = event.target.closest("button[data-index]");
        if (!button || !state.started || state.isLocked) {
            return;
        }

        const item = state.inventory[Number(button.dataset.index)];
        if (!item) {
            return;
        }

        state.inventory = state.inventory.filter((candidate) => candidate.uid !== item.uid);
        if (item.type === "heal") {
            state.playerHp = Math.min(state.maxHp, state.playerHp + item.value);
            refs.monsterFeedback.textContent = `${item.icon} ${item.name} 사용! 체력 +${item.value}`;
            refs.monsterFeedback.className = "monster-feedback info";
            updateUI();
            return;
        }

        state.isLocked = true;
        applyMonsterDamage(item.value, `${item.icon} ${item.name} 사용! ${item.value} 데미지!`, "info");
    }

    function applyMonsterDamage(amount, message, tone) {
        state.currentEnemy.hp = Math.max(0, state.currentEnemy.hp - amount);
        refs.monsterFeedback.textContent = message;
        refs.monsterFeedback.className = `monster-feedback ${tone}`;
        updateUI();

        if (state.currentEnemy.hp <= 0) {
            recruitMonster();
            return;
        }

        window.setTimeout(() => {
            state.currentAngle = pickAngle();
            renderOptions();
            drawAngle(monsterAngleCtx, refs.monsterAngleCanvas, state.currentAngle, {
                activeColor: "#2a9d8f",
                centerY: 132,
                radius: 96
            });
            state.isLocked = false;
        }, 750);
    }

    function recruitMonster() {
        const defeated = state.currentEnemy;
        state.points += defeated.reward;
        state.allies.push({
            name: defeated.name,
            icon: defeated.boss ? "👑" : "⭐"
        });
        updateUI();

        if (defeated.boss || state.encounterIndex >= encounters.length - 1) {
            showMonsterWin();
            return;
        }

        refs.monsterFeedback.textContent = `${defeated.name}이(가) 동료가 되었어요!`;
        refs.monsterFeedback.className = "monster-feedback good";
        window.setTimeout(() => {
            state.encounterIndex += 1;
            prepareEncounter();
        }, 800);
    }

    function showMonsterWin() {
        setHidden(refs.monsterGameShell, true);
        setHidden(refs.monsterWinScreen, false);
        refs.monsterWinAllies.innerHTML = "";
        state.allies.forEach((ally) => {
            const chip = document.createElement("div");
            chip.className = "monster-chip";
            chip.innerHTML = `${ally.icon} ${ally.name}`;
            refs.monsterWinAllies.appendChild(chip);
        });
    }

    function showMonsterLose() {
        setHidden(refs.monsterGameShell, true);
        setHidden(refs.monsterLoseScreen, false);
    }

    function attachEvents() {
        refs.monsterStartButton.addEventListener("click", startMonsterGame);
        refs.monsterRestartButton.addEventListener("click", restartMonsterGame);
        refs.monsterRetryButton.addEventListener("click", restartMonsterGame);
        refs.monsterBuyButton.addEventListener("click", buyMonsterBox);
        refs.monsterInventory.addEventListener("click", handleMonsterInventoryClick);
        refs.monsterOptions.addEventListener("click", handleMonsterOptionClick);
    }

    function getHeroMarkup() {
        return `
            <div class="monster-emoji-figure">
                <span>🧙</span>
            </div>
        `;
    }

    function getMonsterMarkup(kind) {
        const map = {
            horn: "😈",
            ghost: "👻",
            robot: "🤖",
            boss: "😼"
        };
        return `<div class="monster-emoji-figure"><span>${map[kind] || "👾"}</span></div>`;
    }

    function getSceneMarkup(scene) {
        if (scene === "volcano") {
            return `
                <svg viewBox="0 0 600 220" role="img" aria-label="화산 배경">
                    <rect width="600" height="220" fill="transparent"/>
                    <circle cx="520" cy="42" r="28" fill="rgba(255,255,255,0.18)"/>
                    <path d="M60 176 L140 82 L220 176 Z" fill="#7a5346"/>
                    <path d="M86 144 L140 82 L194 144 Z" fill="#ff7b54"/>
                    <path d="M352 176 L452 96 L552 176 Z" fill="#6b4f59"/>
                    <rect y="176" width="600" height="44" fill="#d9b489"/>
                </svg>
            `;
        }

        return `
            <svg viewBox="0 0 600 220" role="img" aria-label="평지 배경">
                <rect width="600" height="220" fill="transparent"/>
                <circle cx="520" cy="44" r="28" fill="#ffd56a"/>
                <path d="M44 174 L152 92 L252 174 Z" fill="#7ac7ff"/>
                <path d="M234 174 L344 76 L460 174 Z" fill="#5ea2ff"/>
                <path d="M458 174 L542 114 L620 174 Z" fill="#83d9b8"/>
                <rect y="174" width="600" height="46" fill="#f5d39c"/>
            </svg>
        `;
    }

    return {
        state,
        resetMonsterGame,
        startMonsterGame,
        restartMonsterGame,
        handleMonsterOptionClick,
        handleMonsterInventoryClick,
        buyMonsterBox,
        applyMonsterDamage,
        attachEvents
    };
})();

const resetMonsterGame = GAME2.resetMonsterGame;
const startMonsterGame = GAME2.startMonsterGame;
const restartMonsterGame = GAME2.restartMonsterGame;
const handleMonsterOptionClick = GAME2.handleMonsterOptionClick;
const handleMonsterInventoryClick = GAME2.handleMonsterInventoryClick;
const buyMonsterBox = GAME2.buyMonsterBox;
const applyMonsterDamage = GAME2.applyMonsterDamage;
const attachGame2Events = GAME2.attachEvents;
