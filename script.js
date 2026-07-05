const N_MIN = 11;
const N_MAX = 19;

// 반응형 구슬 크기 및 간격 변수
let MARBLE_SIZE = 40;
let gapX = 10;
let gapY = 10;

const themes = [
    { type: 'css', className: 'theme-marble-orange' },
    { type: 'css', className: 'theme-marble-blue' },
    { type: 'emoji', className: 'theme-emoji', content: '🍓' },
    { type: 'emoji', className: 'theme-emoji', content: '🍬' },
    { type: 'emoji', className: 'theme-emoji', content: '🍎' },
    { type: 'emoji', className: 'theme-emoji', content: '⭐️' },
    { type: 'css', className: 'theme-ddakji' },
    { type: 'css', className: 'theme-gonggi' }
];

let currentTheme = themes[0];
let N, L, R;
let currentState = 0;
let marbles = [];
let phases = [];

const titleEl = document.getElementById('title');
const layerEl = document.getElementById('marbles-layer');
const btnNew = document.getElementById('btn-new');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// 요소의 절대 좌표 가져오기
function getBoxRect(id) {
    return document.getElementById(id).getBoundingClientRect();
}

// 레이아웃 동적 계산 (화면 크기에 따라 구슬 크기와 간격 조정)
function calculateLayout() {
    // 왼쪽 상자는 90vw의 95%의 42% 폭을 가짐
    const leftBoxWidth = window.innerWidth * 0.9 * 0.95 * 0.42;
    const maxGridWidth = leftBoxWidth * 0.85; // 15% 여백
    
    // 5열을 배치하기 위한 계산: 5 * M + 4 * (0.25 * M) = 6 * M
    const sizeW = maxGridWidth / 6;
    
    // 상단 상자의 높이 제약 (약 화면의 60% 중 35%)
    const topRectHeight = window.innerHeight * 0.6 * 0.35;
    const maxGridHeight = topRectHeight * 0.8;
    // 2행을 배치하기 위한 계산: 2 * M + 1 * (0.25 * M) = 2.25 * M
    const sizeH = maxGridHeight / 2.25;
    
    // 15px에서 45px 사이로 크기 제한
    MARBLE_SIZE = Math.max(15, Math.min(45, sizeW, sizeH)); 
    gapX = MARBLE_SIZE * 0.25;
    gapY = MARBLE_SIZE * 0.25;
    
    document.documentElement.style.setProperty('--marble-size', `${MARBLE_SIZE}px`);
}

// 무작위로 새로운 문제 생성
function generateRandomProblem() {
    N = Math.floor(Math.random() * (N_MAX - N_MIN + 1)) + N_MIN;
    L = Math.floor(Math.random() * (N - 1)) + 1;
    currentTheme = themes[Math.floor(Math.random() * themes.length)];
    applyProblem();
}

// 현재 N, L 설정값으로 문제 적용
function applyProblem() {
    // 유효성 재검사 및 엉뚱한 입력 제한 장치
    if (isNaN(N) || N < 11) N = 11; // 너무 작거나 엉뚱한 입력이면 11
    if (N >= 20) N = 19;            // 20 이상이면 19로 강제
    
    if (isNaN(L) || L < 1) L = 1;   // 음수나 텍스트 등 엉뚱한 입력이면 1
    if (L >= N) L = N - 1;          // N 이상이면 N-1로 강제

    R = N - L;
    const looseCount = Math.max(0, N - 10);
    
    // 단계(Phases) 동적 생성
    phases = ["RANDOM", "ORGANIZED"];
    
    if (N <= 10) {
        // N이 10 이하일 경우 10묶음 로직만 사용
        phases.push("LEFT_10");
    } else {
        if (L <= looseCount) {
            // 낱개가 충분한 경우 낱개에서 빼냄
            phases.push("LEFT_LOOSE_ONLY");
        } else if (L <= 10) {
            // 낱개가 부족하고 10 이하인 경우 10묶음에서 빼냄
            phases.push("LEFT_10");
        } else {
            // 10을 초과하는 경우 10묶음 전체 이동 후 낱개에서 추가 이동
            phases.push("LEFT_10");
            phases.push("LEFT_LOOSE");
        }
    }
    
    phases.push("RIGHT_ALL");
    phases.push("SHOW_ANSWER"); // 구슬 이동 후 정답 텍스트 표시 분리
    
    currentState = 0;
    calculateLayout();
    updateTitle();
    createMarbles();
    positionMarbles();
}

// 타이틀 업데이트
function updateTitle() {
    const hasBatchim = (num) => [1, 3, 6, 7, 8, 10, 11, 13, 16, 17, 18].includes(num);
    const hasEuroBatchim = (num) => [3, 6, 10, 13, 16].includes(num);

    const nParticle = hasBatchim(N) ? "은" : "는";
    const lParticle = hasBatchim(L) ? "과" : "와";
    
    const inputN = `<input type="number" id="input-n" class="input-box" value="${N}" min="11" max="19">`;
    const inputL = `<input type="number" id="input-l" class="input-box" value="${L}" min="1" max="${N - 1}">`;
    
    if (currentState < phases.length - 1) {
        // 정답을 알 수 없게 '로'로 고정
        titleEl.innerHTML = `<span class="word-group">${inputN}<span class="particle-box-small">${nParticle}</span></span><span class="word-group">${inputL}<span class="particle-box-small">${lParticle}</span></span><span class="word-group"><span class="answer-box">?</span><span class="particle-box">로</span></span><span class="word-group">가르기 할 수 있습니다.</span>`;
    } else {
        const rParticle = hasEuroBatchim(R) ? "으로" : "로";
        titleEl.innerHTML = `<span class="word-group">${inputN}<span class="particle-box-small">${nParticle}</span></span><span class="word-group">${inputL}<span class="particle-box-small">${lParticle}</span></span><span class="word-group"><span class="answer-box highlight">${R}</span><span class="particle-box">${rParticle}</span></span><span class="word-group">가르기 할 수 있습니다.</span>`;
    }
}

// 이벤트 위임: 입력창 값 변경 처리
titleEl.addEventListener('change', (e) => {
    if (e.target.id === 'input-n' || e.target.id === 'input-l') {
        const newN = parseInt(document.getElementById('input-n').value, 10);
        const newL = parseInt(document.getElementById('input-l').value, 10);
        N = newN;
        L = newL;
        applyProblem();
    }
});

// 엔터 키 입력 시 즉시 반영
titleEl.addEventListener('keydown', (e) => {
    if ((e.target.id === 'input-n' || e.target.id === 'input-l') && e.key === 'Enter') {
        e.target.blur(); // 포커스 해제 -> change 이벤트 발생 -> applyProblem 실행
    }
});

// 구슬 DOM 요소 생성
function createMarbles() {
    layerEl.innerHTML = '';
    marbles = [];
    for(let i=0; i<N; i++) {
        const m = document.createElement('div');
        m.className = `marble ${currentTheme.className}`;
        if (currentTheme.type === 'emoji') {
            m.innerText = currentTheme.content;
        }
        layerEl.appendChild(m);
        marbles.push(m);
    }
}

// 겹치지 않는 무작위 좌표 계산 (0단계용)
function getNonOverlappingPositions(rect, count, padding, minDistanceRatio) {
    const positions = [];
    const maxAttempts = 200; // 최대 시도 횟수
    
    const minDistance = MARBLE_SIZE * minDistanceRatio;
    const minX = rect.left + window.scrollX + padding;
    const maxX = rect.left + window.scrollX + rect.width - MARBLE_SIZE - padding;
    const minY = rect.top + window.scrollY + padding;
    const maxY = rect.top + window.scrollY + rect.height - MARBLE_SIZE - padding;
    
    for (let i = 0; i < count; i++) {
        let x, y;
        let attempt = 0;
        let collision = true;
        let currentMinDist = minDistance;
        
        while (collision && attempt < maxAttempts) {
            x = minX + Math.random() * Math.max(0, maxX - minX);
            y = minY + Math.random() * Math.max(0, maxY - minY);
            collision = false;
            
            for (let j = 0; j < positions.length; j++) {
                const dx = x - positions[j].left;
                const dy = y - positions[j].top;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < currentMinDist) {
                    collision = true;
                    break;
                }
            }
            
            attempt++;
            if (attempt > 50) {
                currentMinDist *= 0.95; 
            }
        }
        positions.push({ left: x, top: y });
    }
    return positions;
}

// 상자 내 그리드 위치 계산
function getGridPositions(rect, count, cols) {
    if(count === 0) return [];
    const rows = Math.ceil(count / cols);
    
    const gridWidth = cols * MARBLE_SIZE + (cols - 1) * gapX;
    const gridHeight = rows * MARBLE_SIZE + (rows - 1) * gapY;
    
    // 상자 중앙 정렬
    const startX = rect.left + window.scrollX + (rect.width - gridWidth) / 2;
    const startY = rect.top + window.scrollY + (rect.height - gridHeight) / 2;
    
    const pos = [];
    for(let i=0; i<count; i++) {
        const c = i % cols;
        const r = Math.floor(i / cols);
        pos.push({
            left: startX + c * (MARBLE_SIZE + gapX),
            top: startY + r * (MARBLE_SIZE + gapY)
        });
    }
    return pos;
}

// 상태에 따라 구슬 위치 지정
function positionMarbles() {
    const topRect = getBoxRect('top-box');
    const leftRect = getBoxRect('bottom-left-box');
    const rightRect = getBoxRect('bottom-right-box');
    
    // 레이아웃이 렌더링되지 않았으면 재시도
    if (topRect.width === 0) {
        setTimeout(positionMarbles, 100);
        return;
    }

    const phase = phases[currentState];

    if (phase === "RANDOM") {
        // 0단계: 상단 상자 안에서 구슬끼리 겹치지 않고 거리를 유지하며 배치
        const margin = 10;
        const targetDistanceRatio = 1.3; // 아이템 크기의 1.3배 거리 유지 목표
        const randomPos = getNonOverlappingPositions(topRect, N, margin, targetDistanceRatio);
        
        for (let i = 0; i < N; i++) {
            marbles[i].style.left = `${randomPos[i].left}px`;
            marbles[i].style.top = `${randomPos[i].top}px`;
        }
        return;
    } 

    // 상단 상자를 10묶음 구역과 낱개 구역으로 논리적 분리
    const top10Rect = {
        left: topRect.left, width: topRect.width * 0.6,
        top: topRect.top, height: topRect.height
    };
    const topLooseRect = {
        left: topRect.left + topRect.width * 0.6, width: topRect.width * 0.4,
        top: topRect.top, height: topRect.height
    };
    
    const tenGroupCount = Math.min(N, 10);
    const looseGroupCount = Math.max(0, N - 10);
    
    // 각 구역별 목표 위치 계산
    const pos10 = getGridPositions(top10Rect, tenGroupCount, 5); // 5열 (5x2 배열)
    const posLoose = getGridPositions(topLooseRect, looseGroupCount, 3); // 3열
    
    const posLeft = getGridPositions(leftRect, L, 5); // 좌측 상자
    const posRight = getGridPositions(rightRect, R, 5); // 우측 상자
    
    // 각 구슬이 최종적으로 좌측으로 갈지 우측으로 갈지 사전에 결정하여 인덱싱
    const leftGroupIndices = [];
    const rightGroupIndices = [];
    
    if (N <= 10) {
        for (let i = 0; i < N; i++) {
            if (i < L) leftGroupIndices.push(i);
            else rightGroupIndices.push(i);
        }
    } else if (L <= N - 10) {
        // 낱개에서 충분히 뺄 수 있다면 낱개(10번째 이후 인덱스)를 좌측으로 할당
        for (let i = 0; i < N; i++) {
            if (i >= 10 && i < 10 + L) leftGroupIndices.push(i);
            else rightGroupIndices.push(i);
        }
    } else {
        // 10묶음을 먼저 깨야 하는 경우 앞번호(0번부터)를 좌측으로 할당
        for (let i = 0; i < N; i++) {
            if (i < L) leftGroupIndices.push(i);
            else rightGroupIndices.push(i);
        }
    }
    
    // 인덱스에 따라 구슬 이동
    for (let i = 0; i < N; i++) {
        let target;
        let is10Group = i < 10;
        let originalTarget = is10Group ? pos10[i] : posLoose[i - 10];
        
        let leftIdx = leftGroupIndices.indexOf(i);
        let rightIdx = rightGroupIndices.indexOf(i);
        
        if (phase === "ORGANIZED") {
            // 1단계: 10묶음과 낱개로 정렬
            target = originalTarget;
        } else if (phase === "LEFT_LOOSE_ONLY") {
            // 낱개에서만 빼내어 좌측으로 이동 (10묶음 보존)
            if (leftIdx !== -1) target = posLeft[leftIdx];
            else target = originalTarget;
        } else if (phase === "LEFT_10") {
            // 10묶음에서만 우선적으로 빼내어 좌측으로 이동
            if (leftIdx !== -1 && i < 10) target = posLeft[leftIdx];
            else target = originalTarget;
        } else if (phase === "LEFT_LOOSE") {
            // L이 10을 초과할 경우 낱개에서도 추가로 이동
            if (leftIdx !== -1) target = posLeft[leftIdx];
            else target = originalTarget;
        } else if (phase === "RIGHT_ALL" || phase === "SHOW_ANSWER") {
            // 나머지 구슬들이 우측 상자로 이동 (SHOW_ANSWER에서는 위치 유지)
            if (leftIdx !== -1) target = posLeft[leftIdx];
            else target = posRight[rightIdx];
        }
        
        if (target) {
            marbles[i].style.left = `${target.left}px`;
            marbles[i].style.top = `${target.top}px`;
        }
    }
}

// 다음 단계로
function nextState() {
    if (currentState < phases.length - 1) {
        currentState++;
        updateTitle();
        positionMarbles();
    } else {
        // 마지막 단계인 경우, 새로운 무작위 문제 생성
        generateRandomProblem();
    }
}

// 이전 단계로
function prevState() {
    if (currentState > 0) {
        currentState--;
        updateTitle();
        positionMarbles();
    }
}

// 이벤트 리스너: 새로운 문제
btnNew.addEventListener('click', generateRandomProblem);

// 이벤트 리스너: 이전 단계
btnPrev.addEventListener('click', prevState);

// 전자칠판 우클릭(Long Press) 메뉴 팝업 방지
document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName.toLowerCase() !== 'input') {
        e.preventDefault();
    }
});

// 이벤트 리스너: 다음 단계 (화면 클릭, 다음 단계 버튼 모두 포함)
document.addEventListener('click', (e) => {
    // 새로운 문제 버튼, 이전 버튼, 입력창을 클릭한 경우는 무시
    if (e.target.closest('#btn-new') || e.target.closest('#btn-prev') || e.target.tagName.toLowerCase() === 'input') {
        return;
    }
    // 그 외 영역이나 다음 단계 버튼을 누른 경우 다음 단계로 진행
    nextState();
});

// 이벤트 리스너: 스페이스바, 좌우 화살표, 백스페이스
document.addEventListener('keydown', (e) => {
    // 입력창에서 타이핑 중일 때는 단축키 무시
    if (e.target.tagName.toLowerCase() === 'input') return;
    
    if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        nextState();
    } else if (e.code === 'ArrowLeft' || e.code === 'Backspace') {
        e.preventDefault();
        prevState();
    }
});

// 화면 크기 변경 시 위치 재계산
window.addEventListener('resize', () => {
    calculateLayout();
    positionMarbles();
});

// 최초 로드 시 실행
window.addEventListener('load', () => {
    generateRandomProblem();
});
