class Card {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 70;
        this.isRed = true;
        this.cornerRadius = 10;
    }

    flip() {
        this.isRed = !this.isRed;
    }

    draw(ctx) {
        // 카드 배경
        ctx.fillStyle = this.isRed ? '#ff6b6b' : '#4dabf7';
        ctx.beginPath();
        ctx.moveTo(this.x + this.cornerRadius, this.y);
        ctx.lineTo(this.x + this.width - this.cornerRadius, this.y);
        ctx.quadraticCurveTo(this.x + this.width, this.y, this.x + this.width, this.y + this.cornerRadius);
        ctx.lineTo(this.x + this.width, this.y + this.height - this.cornerRadius);
        ctx.quadraticCurveTo(this.x + this.width, this.y + this.height, this.x + this.width - this.cornerRadius, this.y + this.height);
        ctx.lineTo(this.x + this.cornerRadius, this.y + this.height);
        ctx.quadraticCurveTo(this.x, this.y + this.height, this.x, this.y + this.height - this.cornerRadius);
        ctx.lineTo(this.x, this.y + this.cornerRadius);
        ctx.quadraticCurveTo(this.x, this.y, this.x + this.cornerRadius, this.y);
        ctx.closePath();
        ctx.fill();

        // 카드 테두리
        ctx.strokeStyle = this.isRed ? '#e03131' : '#1971c2';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 카드 내부 패턴
        ctx.fillStyle = this.isRed ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 4; j++) {
                ctx.beginPath();
                ctx.arc(
                    this.x + 10 + j * 10,
                    this.y + 10 + i * 15,
                    2,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }

        // 카드 중앙 심볼
        ctx.fillStyle = this.isRed ? '#ff8787' : '#74c0fc';
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2,
            this.y + this.height / 2,
            15,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cards = [];
        this.turnCount = 0;
        this.maxTurns = 20;
        this.redCount = 49;
        this.blueCount = 0;
        this.redHistory = [];
        this.blueHistory = [];
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.isGameStarted = false;

        // 캔버스 크기 설정
        this.canvas.width = 800;
        this.canvas.height = 600;

        this.setupEventListeners();
        this.setupChart();
        this.init();
    }

    init() {
        // 7x7 그리드로 카드 배치
        const gridSize = 7;
        const cardWidth = 50;
        const cardHeight = 70;
        const spacing = 10;
        const totalWidth = (cardWidth + spacing) * gridSize - spacing;
        const totalHeight = (cardHeight + spacing) * gridSize - spacing;
        
        // 캔버스 중앙에 그리드 배치
        const startX = (this.canvas.width - totalWidth) / 2;
        const startY = (this.canvas.height - totalHeight) / 2;

        this.cards = [];
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const x = startX + j * (cardWidth + spacing);
                const y = startY + i * (cardHeight + spacing);
                this.cards.push(new Card(x, y));
            }
        }

        this.draw();
    }

    setupEventListeners() {
        // 게임 시작 버튼
        document.getElementById('startGame').addEventListener('click', () => {
            if (!this.isGameStarted) {
                this.isGameStarted = true;
                
                // 초기 상태에서 빨간색 카드 12장 뒤집기
                const redCards = this.cards.filter(card => card.isRed);
                const randomIndices = new Set();
                while (randomIndices.size < 12) {
                    randomIndices.add(Math.floor(Math.random() * redCards.length));
                }
                randomIndices.forEach(index => {
                    redCards[index].flip();
                });
                
                // 카드 수 업데이트
                this.redCount = this.cards.filter(card => card.isRed).length;
                this.blueCount = this.cards.filter(card => !card.isRed).length;
                
                // UI 업데이트
                document.getElementById('redCount').textContent = this.redCount;
                document.getElementById('blueCount').textContent = this.blueCount;
                
                // 다음 턴 버튼 활성화
                document.getElementById('nextTurn').disabled = false;
                
                this.draw();
            }
        });
        
        // 다음 턴 버튼
        document.getElementById('nextTurn').addEventListener('click', () => {
            if (this.isGameStarted) {
                this.nextTurn();
            }
        });
        
        // 리셋 버튼
        document.getElementById('resetGame').addEventListener('click', () => {
            this.resetGame();
            this.isGameStarted = false;
            document.getElementById('nextTurn').disabled = true;
        });

        // 키보드 이벤트
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isGameStarted) {
                e.preventDefault();
                this.nextTurn();
            } else if (e.code === 'KeyR') {
                this.resetGame();
                this.isGameStarted = false;
                document.getElementById('nextTurn').disabled = true;
            }
        });

        // 마우스 휠 이벤트 (확대/축소)
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.scale *= delta;
            this.draw();
        });

        // 마우스 드래그 이벤트
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastX;
                const dy = e.clientY - this.lastY;
                this.offsetX += dx;
                this.offsetY += dy;
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                this.draw();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
        });
    }

    setupChart() {
        const ctx = document.getElementById('resultChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: this.maxTurns + 1}, (_, i) => i),
                datasets: [
                    {
                        label: '빨간색 카드',
                        data: [49],
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: '파란색 카드',
                        data: [0],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: '카드 수 변화 그래프',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 49
                    }
                }
            }
        });
    }

    nextTurn() {
        if (this.turnCount >= this.maxTurns) {
            alert('게임이 종료되었습니다!');
            return;
        }

        this.turnCount++;
        document.getElementById('turnCount').textContent = this.turnCount;

        // 현재 상태의 카드 수를 기준으로 뒤집을 카드 수 계산
        const currentRedCards = this.cards.filter(card => card.isRed);
        const currentBlueCards = this.cards.filter(card => !card.isRed);
        
        // 빨간색 카드: 4장당 1장 뒤집기
        const redToFlip = Math.floor(currentRedCards.length / 4);
        // 파란색 카드: 3장당 1장 뒤집기
        const blueToFlip = Math.floor(currentBlueCards.length / 3);

        // 뒤집을 카드들의 인덱스를 미리 저장
        const redIndicesToFlip = new Set();
        const blueIndicesToFlip = new Set();

        // 빨간색 카드 뒤집을 인덱스 선택
        while (redIndicesToFlip.size < redToFlip && redIndicesToFlip.size < currentRedCards.length) {
            const randomIndex = Math.floor(Math.random() * currentRedCards.length);
            redIndicesToFlip.add(randomIndex);
        }

        // 파란색 카드 뒤집을 인덱스 선택
        while (blueIndicesToFlip.size < blueToFlip && blueIndicesToFlip.size < currentBlueCards.length) {
            const randomIndex = Math.floor(Math.random() * currentBlueCards.length);
            blueIndicesToFlip.add(randomIndex);
        }

        // 선택된 인덱스의 카드들 뒤집기
        redIndicesToFlip.forEach(index => {
            currentRedCards[index].flip();
        });

        blueIndicesToFlip.forEach(index => {
            currentBlueCards[index].flip();
        });

        // 카드 수 업데이트
        this.redCount = this.cards.filter(card => card.isRed).length;
        this.blueCount = this.cards.filter(card => !card.isRed).length;
        document.getElementById('redCount').textContent = this.redCount;
        document.getElementById('blueCount').textContent = this.blueCount;

        // 차트 업데이트
        this.redHistory.push(this.redCount);
        this.blueHistory.push(this.blueCount);
        this.chart.data.datasets[0].data = [49, ...this.redHistory];
        this.chart.data.datasets[1].data = [0, ...this.blueHistory];
        this.chart.update();

        this.draw();
    }

    resetGame() {
        this.cards.forEach(card => {
            card.isRed = true;
        });
        this.turnCount = 0;
        this.redCount = 49;
        this.blueCount = 0;
        this.redHistory = [];
        this.blueHistory = [];
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;

        // UI 업데이트
        document.getElementById('turnCount').textContent = this.turnCount;
        document.getElementById('redCount').textContent = this.redCount;
        document.getElementById('blueCount').textContent = this.blueCount;

        // 차트 리셋
        this.chart.data.datasets[0].data = [49];
        this.chart.data.datasets[1].data = [0];
        this.chart.update();

        this.draw();
    }

    draw() {
        // 캔버스 초기화
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 변환 매트릭스 저장
        this.ctx.save();
        
        // 캔버스 중앙을 기준으로 변환
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(-this.canvas.width / 2 + this.offsetX, -this.canvas.height / 2 + this.offsetY);

        // 카드 그리기
        this.cards.forEach(card => {
            card.draw(this.ctx);
        });
        
        // 변환 매트릭스 복원
        this.ctx.restore();
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 