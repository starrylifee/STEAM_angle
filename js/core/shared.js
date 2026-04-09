"use strict";

const STEAM_ANGLE = (() => {
    const games = [
        {
            id: 1,
            title: "각도 퍼즐을 찾아라",
            description: "달리기 + 각도 퀴즈",
            meta: "학생 스케치 기반 구현",
            accent: "#ff8c42",
            status: "플레이 가능",
            ready: true,
            buttonLabel: "1번 게임 시작",
            tags: ["달리기", "퀴즈"]
        },
        {
            id: 2,
            title: "각도를 어림해서 몬스터를 동료로 만들어라",
            description: "각도 맞히기 + 몬스터 동료",
            meta: "학생 스케치 기반 구현",
            accent: "#2a9d8f",
            status: "플레이 가능",
            ready: true,
            buttonLabel: "2번 게임 시작",
            tags: ["어림", "몬스터", "랜덤박스"]
        },
        {
            id: 3,
            title: "새벽 3시 귀신 스쿨",
            description: "숨은 귀신 찾기 + 각도 분류",
            meta: "학생 스케치 기반 구현",
            accent: "#457b9d",
            status: "플레이 가능",
            ready: true,
            buttonLabel: "3번 게임 시작",
            tags: ["탐색", "직각", "탈출"]
        },
        {
            id: 4,
            title: "각도 맞추기 게임",
            description: "대포 + 세 숫자 고르기",
            meta: "학생 스케치 기반 구현",
            accent: "#e76f51",
            status: "플레이 가능",
            ready: true,
            buttonLabel: "4번 게임 시작",
            tags: ["대포", "어림", "침몰"]
        },
        {
            id: 5,
            title: "각도를 이용한 괴물 퇴치",
            description: "정전 학교 탐색 + 아이템",
            meta: "학생 스케치 기반 구현",
            accent: "#6c9a35",
            status: "플레이 가능",
            ready: true,
            buttonLabel: "5번 게임 시작",
            tags: ["학교", "아이템", "보스"]
        }
    ];

    const gameCredits = {
        1: "고양이 · 송아지 · 복숭아7호",
        2: "카르르우유 · 반짝이 · 녹둥이",
        3: "파랑",
        4: "진창쿠키",
        5: "천재 · 수호천사 외"
    };

    const refs = {
        gameGrid: document.getElementById("game-grid"),
        gameModal: document.getElementById("game-modal"),
        gameModalBackdrop: document.getElementById("game-modal-backdrop"),
        modalHomeButton: document.getElementById("modal-home-button"),
        stageTitle: document.getElementById("stage-title"),
        modalSubtitle: document.getElementById("modal-subtitle"),
        modalCredit: document.getElementById("modal-credit"),
        modalIllustration: document.getElementById("modal-illustration"),
        placeholderPanel: document.getElementById("placeholder-panel"),
        placeholderTitle: document.getElementById("placeholder-title"),
        placeholderText: document.getElementById("placeholder-text"),
        gameStageSection: document.getElementById("game-stage-section"),
        monsterStageSection: document.getElementById("monster-stage-section"),
        ghostStageSection: document.getElementById("ghost-stage-section"),
        cannonStageSection: document.getElementById("cannon-stage-section"),
        schoolStageSection: document.getElementById("school-stage-section"),

        gameWrapper: document.getElementById("game-wrapper"),
        gameCanvas: document.getElementById("gameCanvas"),
        quizCanvas: document.getElementById("quizCanvas"),
        certCanvas: document.getElementById("certCanvas"),
        startScreen: document.getElementById("start-screen"),
        endScreen: document.getElementById("end-screen"),
        gameoverScreen: document.getElementById("gameover-screen"),
        quizModal: document.getElementById("quiz-modal"),
        feedback: document.getElementById("feedback"),
        optionsGrid: document.getElementById("options-grid"),
        healthTracker: document.getElementById("health-tracker"),
        djumpTracker: document.getElementById("djump-tracker"),
        puzzleTracker: document.getElementById("puzzle-tracker"),
        stageIndicator: document.getElementById("stage-indicator"),
        distanceMeter: document.getElementById("distance-meter"),
        stageUpBanner: document.getElementById("stage-up-banner"),
        starRating: document.getElementById("star-rating"),
        timestampDisplay: document.getElementById("timestamp-display"),
        finalPuzzleView: document.getElementById("final-puzzle-view"),
        gameStartButton: document.getElementById("game-start-button"),
        downloadButton: document.getElementById("download-button"),
        restartFromEndButton: document.getElementById("restart-from-end-button"),
        restartFromGameoverButton: document.getElementById("restart-from-gameover-button"),
        endBackButton: document.getElementById("end-back-button"),
        gameoverBackButton: document.getElementById("gameover-back-button"),

        monsterStartScreen: document.getElementById("monster-start-screen"),
        monsterGameShell: document.getElementById("monster-game-shell"),
        monsterWinScreen: document.getElementById("monster-win-screen"),
        monsterLoseScreen: document.getElementById("monster-lose-screen"),
        monsterStartButton: document.getElementById("monster-start-button"),
        monsterRestartButton: document.getElementById("monster-restart-button"),
        monsterRetryButton: document.getElementById("monster-retry-button"),
        monsterPlayerHp: document.getElementById("monster-player-hp"),
        monsterPoints: document.getElementById("monster-points"),
        monsterRound: document.getElementById("monster-round"),
        monsterInventory: document.getElementById("monster-inventory"),
        monsterAllies: document.getElementById("monster-allies"),
        monsterBoxFeedback: document.getElementById("monster-box-feedback"),
        monsterScene: document.getElementById("monster-scene"),
        monsterSceneArt: document.getElementById("monster-scene-art"),
        monsterHeroFigure: document.getElementById("monster-hero-figure"),
        monsterFoeFigure: document.getElementById("monster-foe-figure"),
        monsterFoeName: document.getElementById("monster-foe-name"),
        monsterFoeHp: document.getElementById("monster-foe-hp"),
        monsterFoeHpFill: document.getElementById("monster-foe-hp-fill"),
        monsterAngleCanvas: document.getElementById("monster-angle-canvas"),
        monsterOptions: document.getElementById("monster-options"),
        monsterFeedback: document.getElementById("monster-feedback"),
        monsterBuyButton: document.getElementById("monster-buy-button"),
        monsterWinAllies: document.getElementById("monster-win-allies"),

        ghostStartScreen: document.getElementById("ghost-start-screen"),
        ghostGameShell: document.getElementById("ghost-game-shell"),
        ghostWinScreen: document.getElementById("ghost-win-screen"),
        ghostStartButton: document.getElementById("ghost-start-button"),
        ghostRestartButton: document.getElementById("ghost-restart-button"),
        ghostKeysCount: document.getElementById("ghost-keys-count"),
        ghostFoundCount: document.getElementById("ghost-found-count"),
        ghostFoundList: document.getElementById("ghost-found-list"),
        ghostScene: document.getElementById("ghost-scene"),
        ghostSceneArt: document.getElementById("ghost-scene-art"),
        ghostDoorButton: document.getElementById("ghost-door-button"),
        ghostQuizPanel: document.getElementById("ghost-quiz-panel"),
        ghostQuizTitle: document.getElementById("ghost-quiz-title"),
        ghostAngleCanvas: document.getElementById("ghost-angle-canvas"),
        ghostOptions: document.getElementById("ghost-options"),
        ghostFeedback: document.getElementById("ghost-feedback"),
        ghostHotspots: document.getElementById("ghost-hotspots"),

        cannonStartScreen: document.getElementById("cannon-start-screen"),
        cannonGameShell: document.getElementById("cannon-game-shell"),
        cannonWinScreen: document.getElementById("cannon-win-screen"),
        cannonLoseScreen: document.getElementById("cannon-lose-screen"),
        cannonStartButton: document.getElementById("cannon-start-button"),
        cannonRestartButton: document.getElementById("cannon-restart-button"),
        cannonRetryButton: document.getElementById("cannon-retry-button"),
        cannonRound: document.getElementById("cannon-round"),
        cannonScore: document.getElementById("cannon-score"),
        cannonLivesTrack: document.getElementById("cannon-lives-track"),
        cannonFleetTrack: document.getElementById("cannon-fleet-track"),
        cannonScene: document.getElementById("cannon-scene"),
        cannonSceneArt: document.getElementById("cannon-scene-art"),
        cannonOptions: document.getElementById("cannon-options"),
        cannonAngleCanvas: document.getElementById("cannon-angle-canvas"),
        cannonFeedback: document.getElementById("cannon-feedback"),
        cannonWinSummary: document.getElementById("cannon-win-summary"),
        cannonLoseSummary: document.getElementById("cannon-lose-summary"),

        schoolStartScreen: document.getElementById("school-start-screen"),
        schoolGameShell: document.getElementById("school-game-shell"),
        schoolWinScreen: document.getElementById("school-win-screen"),
        schoolLoseScreen: document.getElementById("school-lose-screen"),
        schoolStartButton: document.getElementById("school-start-button"),
        schoolRestartButton: document.getElementById("school-restart-button"),
        schoolRetryButton: document.getElementById("school-retry-button"),
        schoolHpTrack: document.getElementById("school-hp-track"),
        schoolSolvedCount: document.getElementById("school-solved-count"),
        schoolBossHp: document.getElementById("school-boss-hp"),
        schoolInventory: document.getElementById("school-inventory"),
        schoolSceneArt: document.getElementById("school-scene-art"),
        schoolRoomGrid: document.getElementById("school-room-grid"),
        schoolBossButton: document.getElementById("school-boss-button"),
        schoolQuestionTitle: document.getElementById("school-question-title"),
        schoolAngleCanvas: document.getElementById("school-angle-canvas"),
        schoolOptions: document.getElementById("school-options"),
        schoolFeedback: document.getElementById("school-feedback"),
        schoolWinSummary: document.getElementById("school-win-summary"),
        schoolLoseSummary: document.getElementById("school-lose-summary")
    };

    const ctx = refs.gameCanvas.getContext("2d");
    const quizCtx = refs.quizCanvas.getContext("2d");
    const certCtx = refs.certCanvas.getContext("2d");
    const monsterAngleCtx = refs.monsterAngleCanvas.getContext("2d");
    const ghostAngleCtx = refs.ghostAngleCanvas.getContext("2d");
    const cannonAngleCtx = refs.cannonAngleCanvas.getContext("2d");
    const schoolAngleCtx = refs.schoolAngleCanvas.getContext("2d");

    const appState = {
        currentModalGameId: null
    };

    function shuffle(list) {
        const copied = [...list];
        for (let i = copied.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [copied[i], copied[j]] = [copied[j], copied[i]];
        }
        return copied;
    }

    function setHidden(element, hidden) {
        if (!element) {
            return;
        }

        element.classList.toggle("hidden", hidden);
    }

    function clearElement(element) {
        if (element) {
            element.innerHTML = "";
        }
    }

    function drawAngle(targetCtx, canvas, angle, options = {}) {
        const {
            arcColor = "#d7e3ef",
            baseColor = "#17324d",
            activeColor = "#ff8c42",
            centerX = canvas.width / 2,
            centerY = canvas.height - 48,
            radius = Math.min(canvas.width, canvas.height) * 0.36
        } = options;

        targetCtx.clearRect(0, 0, canvas.width, canvas.height);

        targetCtx.beginPath();
        targetCtx.arc(centerX, centerY, radius, Math.PI, 0);
        targetCtx.strokeStyle = arcColor;
        targetCtx.lineWidth = 4;
        targetCtx.setLineDash([8, 6]);
        targetCtx.stroke();
        targetCtx.setLineDash([]);

        targetCtx.beginPath();
        targetCtx.moveTo(centerX, centerY);
        targetCtx.lineTo(centerX + radius, centerY);
        targetCtx.strokeStyle = baseColor;
        targetCtx.lineWidth = 8;
        targetCtx.lineCap = "round";
        targetCtx.stroke();

        const radians = (angle * Math.PI) / 180;
        targetCtx.beginPath();
        targetCtx.moveTo(centerX, centerY);
        targetCtx.lineTo(
            centerX + radius * Math.cos(-radians),
            centerY + radius * Math.sin(-radians)
        );
        targetCtx.strokeStyle = activeColor;
        targetCtx.stroke();

        targetCtx.beginPath();
        targetCtx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        targetCtx.fillStyle = baseColor;
        targetCtx.fill();
    }

    function getAngleType(angle) {
        if (angle < 90) {
            return "acute";
        }

        if (angle === 90) {
            return "right";
        }

        return "obtuse";
    }

    function getAngleTypeLabel(type) {
        if (type === "acute") {
            return "예각";
        }

        if (type === "right") {
            return "직각";
        }

        return "둔각";
    }

    function getFormattedTimestamp() {
        const now = new Date();
        return `${now.getFullYear()}년 ${String(now.getMonth() + 1).padStart(2, "0")}월 ${String(now.getDate()).padStart(2, "0")}일 `
            + `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    }

    return {
        games,
        gameCredits,
        refs,
        ctx,
        quizCtx,
        certCtx,
        monsterAngleCtx,
        ghostAngleCtx,
        cannonAngleCtx,
        schoolAngleCtx,
        appState,
        totalHealth: 3,
        totalPieces: 9,
        shuffle,
        setHidden,
        clearElement,
        drawAngle,
        getAngleType,
        getAngleTypeLabel,
        getFormattedTimestamp
    };
})();

window.STEAM_ANGLE = STEAM_ANGLE;
