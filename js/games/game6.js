"use strict";

const GAME6 = (() => {
    const {
        refs,
        game6SceneCtx,
        game6AngleCtx,
        setHidden,
        clearElement
    } = window.STEAM_ANGLE;

    const anchorPoint = { x: 112, y: 274 };
    const angleStep = 15;
    const lengthStep = 20;
    const minAngle = 15;
    const maxAngle = 75;
    const maxLives = 6;

    const stages = [
        {
            level: "초급",
            title: "접힌 다리 펴기",
            description: "완전히 접힌 다리를 각도와 길이로 펴서 첫 구조 발판에 닿게 하세요.",
            maxLengths: [220],
            minLengths: [80],
            defaultAngles: [75],
            defaultLengths: [80],
            solutionAngles: [45],
            solutionLengths: [180],
            toleranceX: 16,
            toleranceY: 14,
            obstacles: []
        },
        {
            level: "초급",
            title: "암초 넘기",
            description: "다리가 너무 낮게 뻗으면 암초에 부딪혀요. 각도와 길이를 함께 맞춰 보세요.",
            maxLengths: [220],
            minLengths: [80],
            defaultAngles: [75],
            defaultLengths: [80],
            solutionAngles: [30],
            solutionLengths: [200],
            toleranceX: 16,
            toleranceY: 14,
            obstacles: [
                {
                    x: 206,
                    y: 228,
                    width: 76,
                    height: 28,
                    label: "암초",
                    message: "다리가 암초에 부딪혔어요. 조금 더 세우거나 덜 늘려 보세요."
                }
            ]
        },
        {
            level: "초급",
            title: "높은 발판",
            description: "이번엔 더 높이 닿아야 해요. 낮은 각도로 길이만 늘리면 바로 장애물에 걸립니다.",
            maxLengths: [220],
            minLengths: [80],
            defaultAngles: [60],
            defaultLengths: [80],
            solutionAngles: [60],
            solutionLengths: [200],
            toleranceX: 14,
            toleranceY: 12,
            obstacles: [
                {
                    x: 194,
                    y: 156,
                    width: 72,
                    height: 40,
                    label: "바위",
                    message: "다리가 낮은 바위에 걸렸어요. 각도를 더 세워 위로 올려 보세요."
                }
            ]
        },
        {
            level: "중급",
            title: "연결 관절 1",
            description: "두 번째 관절은 첫 팔에서 얼마나 더 꺾이는지 뜻해요. 얕은 경로는 장애물에 걸립니다.",
            maxLengths: [170, 130],
            minLengths: [80, 50],
            defaultAngles: [75, 15],
            defaultLengths: [80, 50],
            solutionAngles: [30, 15],
            solutionLengths: [150, 100],
            toleranceX: 12,
            toleranceY: 10,
            obstacles: [
                {
                    x: 258,
                    y: 202,
                    width: 76,
                    height: 38,
                    label: "부표",
                    message: "접힌 다리가 부표에 걸렸어요. 첫 관절을 더 세우거나 길이를 다시 조절해 보세요."
                }
            ]
        },
        {
            level: "중급",
            title: "경보탑 피하기",
            description: "첫 관절은 전체 방향을, 두 번째 관절은 마지막 꺾임을 만듭니다. 탑을 스치면 즉시 실패예요.",
            maxLengths: [170, 130],
            minLengths: [80, 50],
            defaultAngles: [60, 15],
            defaultLengths: [80, 50],
            solutionAngles: [30, 45],
            solutionLengths: [160, 100],
            toleranceX: 12,
            toleranceY: 10,
            obstacles: [
                {
                    x: 178,
                    y: 98,
                    width: 56,
                    height: 70,
                    label: "경보탑",
                    message: "다리가 경보탑에 닿았어요. 첫 관절을 조금 눕히거나 두 번째 관절을 다르게 꺾어 보세요."
                }
            ]
        },
        {
            level: "중급",
            title: "좁은 틈 통과",
            description: "위 빔과 아래 빔 사이로 접힌 다리를 통과시켜 마지막 발판에 닿게 하세요.",
            maxLengths: [170, 140],
            minLengths: [80, 50],
            defaultAngles: [75, 15],
            defaultLengths: [80, 50],
            solutionAngles: [30, 30],
            solutionLengths: [160, 120],
            toleranceX: 10,
            toleranceY: 10,
            obstacles: [
                {
                    x: 232,
                    y: 58,
                    width: 78,
                    height: 26,
                    label: "위 빔",
                    message: "다리가 위 빔에 닿았어요. 각도나 길이를 조금 낮춰 보세요."
                },
                {
                    x: 248,
                    y: 220,
                    width: 88,
                    height: 28,
                    label: "아래 빔",
                    message: "다리가 아래 빔에 걸렸어요. 첫 관절을 더 세우거나 덜 늘려 보세요."
                }
            ]
        }
    ].map((stage, index) => ({
        ...stage,
        id: index + 1,
        target: computeTip(stage.solutionLengths, stage.solutionAngles)
    }));

    const state = {
        started: false,
        stageIndex: 0,
        lives: maxLives,
        rescued: 0,
        angles: [],
        lengths: [],
        isLocked: false,
        hint: "",
        feedback: "",
        feedbackTone: "info"
    };

    function resetGame6() {
        state.started = false;
        state.stageIndex = 0;
        state.lives = maxLives;
        state.rescued = 0;
        state.angles = [];
        state.lengths = [];
        state.isLocked = false;
        state.hint = "접힌 다리를 펴서 노란 발판까지 안전하게 연결해 보세요.";
        state.feedback = "";
        state.feedbackTone = "info";

        setHidden(refs.game6StartScreen, false);
        setHidden(refs.game6GameShell, true);
        setHidden(refs.game6WinScreen, true);
        setHidden(refs.game6LoseScreen, true);

        refs.game6WinSummary.textContent = "";
        refs.game6LoseSummary.textContent = "";
        refs.game6Hint.textContent = state.hint;
        refs.game6Feedback.textContent = "";
        refs.game6Feedback.className = "game6-feedback";
        refs.game6FireButton.textContent = "이 단계 다시 접기";
        clearElement(refs.game6Controls);
        clearSceneCanvas();
        clearAngleCanvas();
        updateUI();
    }

    function startGame6() {
        state.started = true;
        state.stageIndex = 0;
        state.lives = maxLives;
        state.rescued = 0;
        setHidden(refs.game6StartScreen, true);
        setHidden(refs.game6WinScreen, true);
        setHidden(refs.game6LoseScreen, true);
        setHidden(refs.game6GameShell, false);
        loadStage();
    }

    function restartGame6() {
        resetGame6();
        startGame6();
    }

    function loadStage() {
        const stage = getCurrentStage();
        if (!stage) {
            showGame6Win();
            return;
        }

        state.angles = [...stage.defaultAngles];
        state.lengths = [...stage.defaultLengths];
        state.isLocked = false;
        state.hint = `${stage.level} · ${stage.title}: ${stage.description}`;
        state.feedback = stage.obstacles.length > 0
            ? "각도와 길이를 바꾸는 순간 바로 판정돼요. 장애물에 닿으면 즉시 장비를 잃습니다."
            : "다리는 접힌 상태에서 시작해요. 각도와 길이를 함께 바꿔 끝점을 발판으로 보내 보세요.";
        state.feedbackTone = "info";
        refs.game6FireButton.textContent = "이 단계 다시 접기";
        renderControls();
        updateUI();
        drawScene();
        drawAnglePanel();
    }

    function updateUI() {
        const stage = getCurrentStage();
        refs.game6Round.textContent = stage
            ? `${stage.level} ${state.stageIndex + 1} / ${stages.length}`
            : `${stages.length} / ${stages.length}`;
        refs.game6Score.textContent = `${state.rescued} / ${stages.length}`;
        refs.game6Hint.textContent = state.hint;
        refs.game6Feedback.textContent = state.feedback;
        refs.game6Feedback.className = `game6-feedback ${state.feedbackTone}`;
        refs.game6FireButton.disabled = !state.started || state.isLocked || !stage;
        renderLives();
        renderProgress();
    }

    function renderLives() {
        clearElement(refs.game6LivesTrack);
        for (let index = 0; index < maxLives; index += 1) {
            const token = document.createElement("div");
            token.className = `game6-token ${index < state.lives ? "active" : "lost"}`;
            token.textContent = index < state.lives ? "🧰" : "·";
            refs.game6LivesTrack.appendChild(token);
        }
    }

    function renderProgress() {
        clearElement(refs.game6FleetTrack);
        stages.forEach((stage, index) => {
            const chip = document.createElement("div");
            chip.className = "game6-progress-chip";
            if (index < state.rescued) {
                chip.classList.add("is-cleared");
            } else if (state.started && index === state.stageIndex) {
                chip.classList.add("is-current");
            }
            chip.textContent = `${stage.level} ${index + 1}`;
            refs.game6FleetTrack.appendChild(chip);
        });
    }

    function renderControls() {
        const stage = getCurrentStage();
        clearElement(refs.game6Controls);
        if (!stage) {
            return;
        }
        refs.game6Controls.className = `game6-controls ${state.angles.length > 1 ? "is-double" : ""}`.trim();

        state.angles.forEach((angle, index) => {
            const card = document.createElement("div");
            card.className = "game6-joint-card";

            const head = document.createElement("div");
            head.className = "game6-joint-head";
            head.innerHTML = `
                <span>${index === 0 ? "첫 번째 팔" : "두 번째 팔"}</span>
                <strong>${state.lengths[index]}px</strong>
            `;

            card.appendChild(head);

            const angleLabel = document.createElement("div");
            angleLabel.className = "game6-control-label";
            angleLabel.textContent = index === 1 && stage.maxLengths.length > 1
                ? "각도: 첫 번째 팔에서 추가로 꺾기"
                : "각도";
            card.appendChild(angleLabel);
            card.appendChild(createControlRow(index, "angle", angle, minAngle, maxAngle, angleStep, "°"));

            const lengthLabel = document.createElement("div");
            lengthLabel.className = "game6-control-label";
            lengthLabel.textContent = `길이: ${stage.minLengths[index]}px ~ ${stage.maxLengths[index]}px`;
            card.appendChild(lengthLabel);
            card.appendChild(
                createControlRow(
                    index,
                    "length",
                    state.lengths[index],
                    stage.minLengths[index],
                    stage.maxLengths[index],
                    lengthStep,
                    "px"
                )
            );

            const copy = document.createElement("p");
            copy.className = "game6-joint-copy";
            copy.textContent = stage.maxLengths.length === 1
                ? "접힌 다리는 짧고 가파르게 시작합니다. 길이를 늘리고 각도를 눕혀야 멀리 닿아요."
                : index === 0
                    ? "첫 팔은 전체 방향을 크게 바꿉니다."
                    : "둘째 팔은 끝점을 미세하게 맞춥니다.";
            card.appendChild(copy);

            refs.game6Controls.appendChild(card);
        });
    }

    function createControlRow(index, kind, value, minValue, maxValue, step, unit) {
        const row = document.createElement("div");
        row.className = "game6-joint-row";

        const lowerButton = document.createElement("button");
        lowerButton.type = "button";
        lowerButton.className = "game6-adjust-btn";
        lowerButton.dataset.index = String(index);
        lowerButton.dataset.kind = kind;
        lowerButton.dataset.delta = String(-step);
        lowerButton.textContent = kind === "angle" ? `-${step}°` : `-${step}`;
        lowerButton.disabled = state.isLocked || value <= minValue;

        const valuePill = document.createElement("div");
        valuePill.className = "game6-angle-pill";
        valuePill.textContent = `${value}${unit}`;

        const raiseButton = document.createElement("button");
        raiseButton.type = "button";
        raiseButton.className = "game6-adjust-btn";
        raiseButton.dataset.index = String(index);
        raiseButton.dataset.kind = kind;
        raiseButton.dataset.delta = String(step);
        raiseButton.textContent = kind === "angle" ? `+${step}°` : `+${step}`;
        raiseButton.disabled = state.isLocked || value >= maxValue;

        row.appendChild(lowerButton);
        row.appendChild(valuePill);
        row.appendChild(raiseButton);
        return row;
    }

    function handleGame6ControlClick(event) {
        const button = event.target.closest(".game6-adjust-btn");
        if (!button || !state.started || state.isLocked) {
            return;
        }

        const stage = getCurrentStage();
        if (!stage) {
            return;
        }

        const index = Number(button.dataset.index);
        const delta = Number(button.dataset.delta);
        const kind = button.dataset.kind;

        if (kind === "angle") {
            const nextValue = clamp(state.angles[index] + delta, minAngle, maxAngle);
            if (nextValue === state.angles[index]) {
                return;
            }
            state.angles[index] = nextValue;
        } else {
            const nextValue = clamp(state.lengths[index] + delta, stage.minLengths[index], stage.maxLengths[index]);
            if (nextValue === state.lengths[index]) {
                return;
            }
            state.lengths[index] = nextValue;
        }

        renderControls();
        drawScene();
        drawAnglePanel();
        evaluateCurrentBridge(kind, index);
    }

    function evaluateCurrentBridge(kind, index) {
        const stage = getCurrentStage();
        if (!stage || state.isLocked) {
            return;
        }

        const points = computePoints(state.lengths, state.angles);
        const obstacle = getHitObstacle(stage, points);
        if (obstacle) {
            failStage(obstacle.message);
            return;
        }

        if (isTargetReached(stage, points[points.length - 1])) {
            succeedStage();
            return;
        }

        state.feedback = getAdjustmentHint(stage, points[points.length - 1], kind, index);
        state.feedbackTone = "info";
        updateUI();
    }

    function getAdjustmentHint(stage, tip, kind, index) {
        const dx = tip.x - stage.target.x;
        const dy = tip.y - stage.target.y;
        const horizontal = dx < -20
            ? "아직 발판보다 짧아요."
            : dx > 20
                ? "조금 지나쳤어요."
                : "가로 위치는 거의 맞아요.";
        const vertical = dy < -20
            ? "끝점이 너무 높아요."
            : dy > 20
                ? "끝점이 너무 낮아요."
                : "세로 위치도 비슷해졌어요.";

        if (kind === "length") {
            return `${horizontal} 길이를 ${dx < 0 ? "더 늘리거나" : "조금 줄이면서"} 각도도 함께 맞춰 보세요.`;
        }

        if (stage.maxLengths.length === 1) {
            return `${vertical} 각도를 ${dy > 0 ? "더 세우면" : "조금 눕히면"} 좋아질 거예요.`;
        }

        if (index === 0) {
            return `${horizontal} 첫 관절은 전체 방향을 바꿔요. ${dy > 0 ? "더 세우고" : "조금 눕혀서"} 경로를 다시 잡아 보세요.`;
        }

        return `${vertical} 두 번째 관절은 끝점 미세 조정이에요. ${dy > 0 ? "더 꺾어 올리거나" : "덜 꺾어 낮춰"} 보세요.`;
    }

    function handleGame6ResetStage() {
        if (!state.started || state.isLocked) {
            return;
        }

        const stage = getCurrentStage();
        if (!stage) {
            return;
        }

        state.angles = [...stage.defaultAngles];
        state.lengths = [...stage.defaultLengths];
        state.feedback = "다리를 다시 접었어요. 처음 상태에서 새 경로를 다시 만들어 보세요.";
        state.feedbackTone = "info";
        renderControls();
        updateUI();
        drawScene();
        drawAnglePanel();
    }

    function failStage(message) {
        state.isLocked = true;
        state.lives = Math.max(0, state.lives - 1);
        state.feedback = `${message} 장비 1개를 잃고 다시 접힌 상태로 돌아갑니다.`;
        state.feedbackTone = "bad";
        renderControls();
        updateUI();
        drawScene();
        drawAnglePanel();

        if (state.lives <= 0) {
            window.setTimeout(showGame6Lose, 850);
            return;
        }

        window.setTimeout(() => {
            loadStage();
        }, 900);
    }

    function succeedStage() {
        state.isLocked = true;
        state.rescued += 1;
        state.feedback = "연결 성공! 다리 끝이 발판에 닿아 구조 완료입니다.";
        state.feedbackTone = "good";
        renderControls();
        updateUI();
        drawScene();
        drawAnglePanel();

        window.setTimeout(() => {
            state.stageIndex += 1;
            if (state.stageIndex >= stages.length) {
                showGame6Win();
                return;
            }
            loadStage();
        }, 950);
    }

    function drawScene() {
        const stage = getCurrentStage();
        const canvas = refs.game6SceneCanvas;
        const ctx = game6SceneCtx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
        sky.addColorStop(0, "#e8f3ff");
        sky.addColorStop(1, "#cce8ff");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawCloud(ctx, 84, 78, 0.95);
        drawCloud(ctx, 548, 68, 0.82);

        ctx.fillStyle = "#8ed7ff";
        ctx.fillRect(0, 280, canvas.width, canvas.height - 280);
        ctx.fillStyle = "#6bbde9";
        ctx.fillRect(0, 324, canvas.width, canvas.height - 324);

        ctx.fillStyle = "#5f7b8d";
        ctx.fillRect(36, 280, 122, 72);
        ctx.fillRect(540, 300, 140, 52);

        ctx.fillStyle = "#2f4457";
        ctx.fillRect(70, 232, 88, 48);
        ctx.fillRect(92, 206, 34, 26);

        if (!stage) {
            return;
        }

        drawTargetPlatform(ctx, stage.target, state.feedbackTone === "good");
        drawStudent(ctx, stage.target, state.feedbackTone === "good");
        drawObstacles(ctx, stage.obstacles);

        const points = computePoints(state.lengths, state.angles);
        const tip = points[points.length - 1];
        const segmentColors = ["#4056c4", "#6b7cff"];

        for (let index = 0; index < points.length - 1; index += 1) {
            ctx.strokeStyle = segmentColors[index] || "#4056c4";
            ctx.lineWidth = 18;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(points[index].x, points[index].y);
            ctx.lineTo(points[index + 1].x, points[index + 1].y);
            ctx.stroke();

            ctx.fillStyle = "#17324d";
            ctx.beginPath();
            ctx.arc(points[index].x, points[index].y, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = "#17324d";
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 10, 0, Math.PI * 2);
        ctx.fill();

        if (state.feedbackTone === "good") {
            ctx.strokeStyle = "rgba(31, 157, 85, 0.9)";
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(stage.target.x, stage.target.y, 22, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = "rgba(23, 50, 77, 0.78)";
        ctx.font = "700 18px 'Malgun Gothic', sans-serif";
        ctx.fillText(`${stage.level} · ${stage.title}`, 24, 34);
        ctx.font = "600 14px 'Malgun Gothic', sans-serif";
        ctx.fillText("접힌 다리를 펴며 발판은 맞추고, 붉은 장애물은 피하세요.", 24, 60);
    }

    function drawAnglePanel() {
        const stage = getCurrentStage();
        const ctx = game6AngleCtx;
        const canvas = refs.game6AngleCanvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!stage) {
            return;
        }

        if (state.angles.length === 1) {
            drawJointAngle(ctx, {
                centerX: 160,
                centerY: 128,
                radius: 68,
                baseAngle: 0,
                angle: state.angles[0],
                label: "첫 번째 팔"
            });
            return;
        }

        drawJointAngle(ctx, {
            centerX: 94,
            centerY: 128,
            radius: 52,
            baseAngle: 0,
            angle: state.angles[0],
            label: "첫 관절"
        });
        drawJointAngle(ctx, {
            centerX: 226,
            centerY: 128,
            radius: 52,
            baseAngle: state.angles[0],
            angle: state.angles[1],
            label: "둘째 관절"
        });
    }

    function drawJointAngle(ctx, options) {
        const { centerX, centerY, radius, baseAngle, angle, label } = options;
        const baseRadians = (baseAngle * Math.PI) / 180;
        const activeRadians = ((baseAngle + angle) * Math.PI) / 180;

        fillRoundedRect(
            ctx,
            centerX - radius - 24,
            centerY - radius - 34,
            radius * 2 + 48,
            radius + 88,
            20,
            "rgba(255, 255, 255, 0.92)"
        );

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 0);
        ctx.strokeStyle = "#d7e3ef";
        ctx.lineWidth = 4;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + radius * Math.cos(-baseRadians),
            centerY + radius * Math.sin(-baseRadians)
        );
        ctx.strokeStyle = "#17324d";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + radius * Math.cos(-activeRadians),
            centerY + radius * Math.sin(-activeRadians)
        );
        ctx.strokeStyle = "#5b6cff";
        ctx.stroke();

        ctx.fillStyle = "#17324d";
        ctx.beginPath();
        ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#17324d";
        ctx.font = "700 14px 'Malgun Gothic', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(label, centerX, centerY - radius - 10);
        ctx.font = "900 18px 'Malgun Gothic', sans-serif";
        ctx.fillText(`${angle}°`, centerX, centerY + 34);
        ctx.textAlign = "left";
    }

    function drawTargetPlatform(ctx, target, isSuccess) {
        ctx.strokeStyle = "rgba(23, 50, 77, 0.16)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(target.x + 22, target.y + 8);
        ctx.lineTo(target.x + 22, 300);
        ctx.stroke();

        fillRoundedRect(
            ctx,
            target.x - 26,
            target.y - 10,
            52,
            18,
            8,
            isSuccess ? "#63c66d" : "#ffd166"
        );
    }

    function drawStudent(ctx, target, isSuccess) {
        const x = target.x + 6;
        const y = target.y - 24;
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = "#17324d";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.arc(0, -12, 8, 0, Math.PI * 2);
        ctx.fillStyle = isSuccess ? "#2a9d8f" : "#ff8c42";
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(0, 16);
        ctx.moveTo(0, 2);
        ctx.lineTo(-10, 10);
        ctx.moveTo(0, 2);
        ctx.lineTo(10, 10);
        ctx.moveTo(0, 16);
        ctx.lineTo(-8, 28);
        ctx.moveTo(0, 16);
        ctx.lineTo(8, 28);
        ctx.stroke();
        ctx.restore();
    }

    function drawObstacles(ctx, obstacles) {
        obstacles.forEach((obstacle) => {
            fillRoundedRect(
                ctx,
                obstacle.x,
                obstacle.y,
                obstacle.width,
                obstacle.height,
                12,
                "rgba(214, 69, 69, 0.18)"
            );

            ctx.strokeStyle = "rgba(214, 69, 69, 0.86)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(obstacle.x + 10, obstacle.y + 10);
            ctx.lineTo(obstacle.x + obstacle.width - 10, obstacle.y + obstacle.height - 10);
            ctx.moveTo(obstacle.x + obstacle.width - 10, obstacle.y + 10);
            ctx.lineTo(obstacle.x + 10, obstacle.y + obstacle.height - 10);
            ctx.stroke();

            ctx.fillStyle = "rgba(173, 42, 42, 0.94)";
            ctx.font = "700 12px 'Malgun Gothic', sans-serif";
            ctx.fillText(obstacle.label, obstacle.x + 4, obstacle.y - 8);
        });
    }

    function drawCloud(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.arc(26, -8, 28, 0, Math.PI * 2);
        ctx.arc(54, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function showGame6Win() {
        state.isLocked = true;
        setHidden(refs.game6GameShell, true);
        setHidden(refs.game6WinScreen, false);
        refs.game6WinSummary.textContent = `구조 성공 ${state.rescued}곳 · 남은 장비 ${state.lives}개`;
    }

    function showGame6Lose() {
        state.isLocked = true;
        setHidden(refs.game6GameShell, true);
        setHidden(refs.game6LoseScreen, false);
        const stage = getCurrentStage() || stages[stages.length - 1];
        refs.game6LoseSummary.textContent = `구조 성공 ${state.rescued}곳 · 마지막 실패 ${stage.level} ${stage.title}`;
    }

    function getCurrentStage() {
        return stages[state.stageIndex] || null;
    }

    function clearSceneCanvas() {
        game6SceneCtx.clearRect(0, 0, refs.game6SceneCanvas.width, refs.game6SceneCanvas.height);
    }

    function clearAngleCanvas() {
        game6AngleCtx.clearRect(0, 0, refs.game6AngleCanvas.width, refs.game6AngleCanvas.height);
    }

    function computePoints(lengths, angles) {
        const points = [{ x: anchorPoint.x, y: anchorPoint.y }];
        let x = anchorPoint.x;
        let y = anchorPoint.y;
        let accumulatedAngle = 0;

        lengths.forEach((length, index) => {
            accumulatedAngle += angles[index];
            const radians = (accumulatedAngle * Math.PI) / 180;
            x += length * Math.cos(radians);
            y -= length * Math.sin(radians);
            points.push({ x, y });
        });

        return points;
    }

    function computeTip(lengths, angles) {
        const points = computePoints(lengths, angles);
        return points[points.length - 1];
    }

    function isTargetReached(stage, tip) {
        return Math.abs(tip.x - stage.target.x) <= stage.toleranceX
            && Math.abs(tip.y - stage.target.y) <= stage.toleranceY;
    }

    function getHitObstacle(stage, points) {
        for (const obstacle of stage.obstacles) {
            for (let index = 0; index < points.length - 1; index += 1) {
                if (segmentHitsRect(points[index], points[index + 1], obstacle)) {
                    return obstacle;
                }
            }
        }
        return null;
    }

    function segmentHitsRect(start, end, rect) {
        const samples = 26;
        for (let index = 0; index <= samples; index += 1) {
            const ratio = index / samples;
            const point = {
                x: start.x + (end.x - start.x) * ratio,
                y: start.y + (end.y - start.y) * ratio
            };
            if (pointInRect(point, rect)) {
                return true;
            }
        }
        return false;
    }

    function pointInRect(point, rect) {
        return point.x >= rect.x
            && point.x <= rect.x + rect.width
            && point.y >= rect.y
            && point.y <= rect.y + rect.height;
    }

    function fillRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
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
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function attachEvents() {
        refs.game6StartButton.addEventListener("click", startGame6);
        refs.game6RestartButton.addEventListener("click", restartGame6);
        refs.game6RetryButton.addEventListener("click", restartGame6);
        refs.game6Controls.addEventListener("click", handleGame6ControlClick);
        refs.game6FireButton.addEventListener("click", handleGame6ResetStage);
    }

    return {
        resetGame6,
        startGame6,
        restartGame6,
        attachEvents
    };
})();

const resetGame6 = GAME6.resetGame6;
const startGame6 = GAME6.startGame6;
const restartGame6 = GAME6.restartGame6;
const attachGame6Events = GAME6.attachEvents;
