"use strict";

const APP = (() => {
    const { games, gameCredits, refs, appState, setHidden } = window.STEAM_ANGLE;

    function getGameCredit(gameId) {
        return gameCredits[gameId] || "학생 모두";
    }

    function getHeroIllustrationMarkup() {
        return `
            <svg viewBox="0 0 180 120" class="hero-illustration">
                <defs>
                    <linearGradient id="heroSafeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#fff5d8"/>
                        <stop offset="100%" stop-color="#dff4ff"/>
                    </linearGradient>
                </defs>
                <rect x="10" y="10" width="160" height="100" rx="24" fill="url(#heroSafeGrad)"/>
                <path d="M42 86 A48 48 0 0 1 138 86" fill="none" stroke="#17324d" stroke-width="6" stroke-linecap="round"/>
                <line x1="42" y1="86" x2="138" y2="86" stroke="#17324d" stroke-width="6" stroke-linecap="round"/>
                <line x1="90" y1="38" x2="90" y2="86" stroke="#17324d" stroke-width="4" stroke-linecap="round"/>
                <line x1="56" y1="52" x2="60" y2="60" stroke="#17324d" stroke-width="3" stroke-linecap="round"/>
                <line x1="70" y1="42" x2="73" y2="52" stroke="#17324d" stroke-width="3" stroke-linecap="round"/>
                <line x1="110" y1="42" x2="107" y2="52" stroke="#17324d" stroke-width="3" stroke-linecap="round"/>
                <line x1="124" y1="52" x2="120" y2="60" stroke="#17324d" stroke-width="3" stroke-linecap="round"/>
                <path d="M90 86 L124 58" fill="none" stroke="#ff8c42" stroke-width="6" stroke-linecap="round"/>
                <circle cx="90" cy="86" r="6" fill="#17324d"/>
                <rect x="44" y="92" width="92" height="12" rx="6" fill="#2a9d8f"/>
                <line x1="58" y1="92" x2="58" y2="104" stroke="#ffffff" stroke-width="2"/>
                <line x1="74" y1="92" x2="74" y2="104" stroke="#ffffff" stroke-width="2"/>
                <line x1="90" y1="92" x2="90" y2="104" stroke="#ffffff" stroke-width="2"/>
                <line x1="106" y1="92" x2="106" y2="104" stroke="#ffffff" stroke-width="2"/>
                <line x1="122" y1="92" x2="122" y2="104" stroke="#ffffff" stroke-width="2"/>
            </svg>
        `;
    }

    function getGamePreviewMarkup(game, mode = "button") {
        const className = mode === "button" ? "preview-svg" : "preview-svg modal-svg";
        const emojiMap = {
            1: "📐",
            2: "👾",
            3: "👻",
            4: "🚢",
            5: "🏫",
            6: "🌉"
        };

        if (mode === "button") {
            return `<span class="preview-emoji">${emojiMap[game.id] || "🎮"}</span>`;
        }

        if (game.id === 1) {
            return `
                <svg viewBox="0 0 160 96" class="${className}">
                    <rect x="10" y="10" width="140" height="76" rx="22" fill="#fff7df"/>
                    <path d="M34 66 L74 66 L74 32" fill="none" stroke="#17324d" stroke-width="8" stroke-linecap="round"/>
                    <path d="M74 66 A34 34 0 0 0 108 32" fill="none" stroke="${game.accent}" stroke-width="8" stroke-linecap="round"/>
                    <circle cx="74" cy="66" r="6" fill="#17324d"/>
                </svg>
            `;
        }

        if (game.id === 2) {
            return `
                <svg viewBox="0 0 160 96" class="${className}">
                    <rect x="10" y="10" width="140" height="76" rx="22" fill="#e8fbf5"/>
                    <circle cx="54" cy="48" r="18" fill="none" stroke="${game.accent}" stroke-width="8"/>
                    <path d="M92 64 L128 28" stroke="#17324d" stroke-width="8" stroke-linecap="round"/>
                </svg>
            `;
        }

        if (game.id === 3) {
            return `
                <svg viewBox="0 0 160 96" class="${className}">
                    <rect x="10" y="10" width="140" height="76" rx="22" fill="#eef5ff"/>
                    <path d="M34 68 L128 68" stroke="#17324d" stroke-width="8" stroke-linecap="round"/>
                    <path d="M80 68 L118 30" stroke="${game.accent}" stroke-width="8" stroke-linecap="round"/>
                </svg>
            `;
        }

        if (game.id === 4) {
            return `
                <svg viewBox="0 0 160 96" class="${className}">
                    <rect x="10" y="10" width="140" height="76" rx="22" fill="#fff1eb"/>
                    <circle cx="42" cy="34" r="14" fill="#26354d"/>
                    <circle cx="80" cy="30" r="14" fill="#26354d"/>
                    <circle cx="118" cy="34" r="14" fill="#26354d"/>
                </svg>
            `;
        }

        if (game.id === 5) {
            return `
                <svg viewBox="0 0 160 96" class="${className}">
                    <rect x="10" y="10" width="140" height="76" rx="22" fill="#f2f9e9"/>
                    <rect x="88" y="18" width="40" height="48" rx="8" fill="#ffffff" stroke="#17324d" stroke-width="4"/>
                    <circle cx="50" cy="52" r="16" fill="#fff2dd" stroke="#17324d" stroke-width="4"/>
                </svg>
            `;
        }

        return `
            <svg viewBox="0 0 160 96" class="${className}">
                <rect x="10" y="10" width="140" height="76" rx="22" fill="#eef1ff"/>
                <path d="M30 70 L68 50 L100 58 L130 34" fill="none" stroke="#17324d" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="68" cy="50" r="6" fill="${game.accent}"/>
                <circle cx="100" cy="58" r="6" fill="${game.accent}"/>
                <rect x="116" y="28" width="18" height="12" rx="4" fill="#ffd166"/>
            </svg>
        `;
    }

    function renderGameCards() {
        refs.gameGrid.innerHTML = "";
        games.forEach((game) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "title-button";
            button.dataset.gameId = String(game.id);
            button.style.setProperty("--title-accent", game.accent);
            button.innerHTML = `
                <span class="title-button-copy">
                    <span class="title-button-top">
                        <span class="title-button-index">${String(game.id).padStart(2, "0")}</span>
                        <span class="title-button-title">${game.title}</span>
                    </span>
                    <span class="title-button-credit">제작: ${getGameCredit(game.id)}</span>
                </span>
                <span class="title-button-visual" aria-hidden="true">${getGamePreviewMarkup(game, "button")}</span>
            `;
            refs.gameGrid.appendChild(button);
        });
    }

    function hideAllSections() {
        setHidden(refs.placeholderPanel, true);
        setHidden(refs.gameStageSection, true);
        setHidden(refs.monsterStageSection, true);
        setHidden(refs.ghostStageSection, true);
        setHidden(refs.cannonStageSection, true);
        setHidden(refs.schoolStageSection, true);
        setHidden(refs.game6StageSection, true);
    }

    function openGameStage(gameId) {
        const game = games.find((item) => item.id === gameId);
        if (!game) {
            return;
        }

        appState.currentModalGameId = game.id;
        document.body.classList.add("modal-open");
        setHidden(refs.gameModal, false);
        refs.gameModal.style.setProperty("--modal-accent", game.accent);
        refs.stageTitle.textContent = game.title;
        refs.modalCredit.textContent = `제작: ${getGameCredit(game.id)}`;
        refs.modalIllustration.innerHTML = getGamePreviewMarkup(game, "modal");
        hideAllSections();

        if (game.id === 1) {
            refs.modalSubtitle.textContent = "Space로 점프하고 퍼즐 9개를 모아 보세요.";
            setHidden(refs.gameStageSection, false);
            resetGame();
            return;
        }

        if (game.id === 2) {
            refs.modalSubtitle.textContent = "각도를 맞히며 몬스터를 동료로 만들어 보세요.";
            setHidden(refs.monsterStageSection, false);
            resetMonsterGame();
            return;
        }

        if (game.id === 3) {
            refs.modalSubtitle.textContent = "어두운 교실에서 귀신을 찾고 열쇠를 모아 탈출해 보세요.";
            setHidden(refs.ghostStageSection, false);
            resetGhostGame();
            return;
        }

        if (game.id === 4) {
            refs.modalSubtitle.textContent = "각도를 보고 숫자를 골라 적 배를 침몰시켜 보세요.";
            setHidden(refs.cannonStageSection, false);
            resetCannonGame();
            return;
        }

        if (game.id === 5) {
            refs.modalSubtitle.textContent = "학교를 탐색하고 마지막 괴물왕과 결전해 보세요.";
            setHidden(refs.schoolStageSection, false);
            resetSchoolGame();
            return;
        }

        refs.modalSubtitle.textContent = "접힌 다리를 각도와 길이로 펴고, 장애물에 닿기 전에 구조 발판까지 연결해 보세요.";
        setHidden(refs.game6StageSection, false);
        resetGame6();
    }

    function resetAllGamesForLobby() {
        resetGame();
        resetMonsterGame();
        resetGhostGame();
        resetCannonGame();
        resetSchoolGame();
        resetGame6();
        hideAllSections();
        refs.modalIllustration.innerHTML = "";
        refs.modalCredit.textContent = "제작: 학생 모두";
    }

    function closeGameStage() {
        setHidden(refs.gameModal, true);
        document.body.classList.remove("modal-open");
        appState.currentModalGameId = null;

        window.setTimeout(() => {
            resetAllGamesForLobby();
        }, 0);
    }

    function attachEvents() {
        refs.gameGrid.addEventListener("click", (event) => {
            const button = event.target.closest(".title-button");
            if (!button) {
                return;
            }
            openGameStage(Number(button.dataset.gameId));
        });

        refs.modalHomeButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            closeGameStage();
        });
        refs.endBackButton.addEventListener("click", closeGameStage);
        refs.gameoverBackButton.addEventListener("click", closeGameStage);
        window.addEventListener("keydown", (event) => {
            if (event.code === "Escape" && !refs.gameModal.classList.contains("hidden")) {
                closeGameStage();
            }
        });
    }

    function init() {
        const heroArt = document.querySelector(".hero-art");
        if (heroArt) {
            heroArt.innerHTML = getHeroIllustrationMarkup();
        }

        const eyebrow = document.querySelector(".eyebrow");
        if (eyebrow) {
            eyebrow.textContent = "STEAM 프로젝트";
        }

        document.querySelector(".section-note")?.remove();
        renderGameCards();
        attachEvents();
        attachGame1Events();
        attachGame2Events();
        attachGame3Events();
        attachGame4Events();
        attachGame5Events();
        attachGame6Events();
        resetGame();
        resetMonsterGame();
        resetGhostGame();
        resetCannonGame();
        resetSchoolGame();
        resetGame6();
    }

    return {
        init,
        openGameStage,
        closeGameStage
    };
})();

const openGameStage = APP.openGameStage;
const closeGameStage = APP.closeGameStage;

APP.init();
