class Card {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 70;
        this.isRed = true;
        this.cornerRadius = 10;
        this.isSelected = false;
    }

    flip() {
        this.isRed = !this.isRed;
    }

    contains(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }

    draw(ctx) {
        // 카드 배경
        ctx.fillStyle = this.isRed ? '#ff6b6b' : '#4dabf7';
        if (this.isSelected) {
            ctx.fillStyle = this.isRed ? '#ff8787' : '#74c0fc';
        }
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
        if (this.isSelected) {
            ctx.strokeStyle = '#2ecc71';
            ctx.lineWidth = 3;
        } else {
            ctx.lineWidth = 2;
        }
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
        if (this.isSelected) {
            ctx.fillStyle = '#2ecc71';
        }
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
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragEndX = 0;
        this.dragEndY = 0;
        this.dragRect = null;
        this.isGameStarted = false;
        this.lastRedCount = 49;
        this.lastBlueCount = 0;
        this.stableCount = 0;
        this.equalCount = 0;
        this.isGameEnded = false;
        this.selectedCards = [];
        this.redFlipRate = 4;
        this.blueFlipRate = 3;
        this.isUserTurn = true;
        this.lastRedCount = 49;
        this.lastBlueCount = 0;
        this.stableCount = 0;
        this.equalCount = 0;
        this.isGameEnded = false;
        this.chart = null;
        this.chartData = {
            labels: [],
            datasets: [{
                label: '빨간색 카드',
                data: [],
                borderColor: 'red',
                tension: 0.1
            }, {
                label: '파란색 카드',
                data: [],
                borderColor: 'blue',
                tension: 0.1
            }]
        };
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

        // 초기 상태에서 모든 카드를 빨간색으로 설정
        this.cards.forEach(card => {
            card.isRed = true;
            card.isSelected = false;
        });

        this.redCount = 49;
        this.blueCount = 0;
        this.turnCount = 0;
        this.stableCount = 0;
        this.equalCount = 0;
        this.isGameEnded = false;
        this.isUserTurn = true;

        // 초기 데이터를 그래프에 표시
        this.updateChart();
        this.draw();
    }

    setupEventListeners() {
        document.getElementById('startGame').addEventListener('click', () => {
            const redFlipRate = parseInt(document.getElementById('redFlipRate').value);
            const blueFlipRate = parseInt(document.getElementById('blueFlipRate').value);
            
            if (redFlipRate < 1 || blueFlipRate < 1) {
                alert('카드 뒤집기 비율은 1 이상이어야 합니다.');
                return;
            }
            
            this.redFlipRate = redFlipRate;
            this.blueFlipRate = blueFlipRate;
            
            // 초기화 후 게임 시작
            this.init();
            
            // 49/X개의 파란색 카드로 시작 (내림하여 계산)
            const initialBlueCards = Math.floor(49 / this.redFlipRate);
            const redCards = this.cards.filter(card => card.isRed);
            const randomIndices = new Set();
            while (randomIndices.size < initialBlueCards && randomIndices.size < redCards.length) {
                randomIndices.add(Math.floor(Math.random() * redCards.length));
            }
            randomIndices.forEach(index => {
                redCards[index].flip();
            });

            this.redCount = this.cards.filter(card => card.isRed).length;
            this.blueCount = this.cards.filter(card => !card.isRed).length;

            // 초기 상태 변화를 그래프에 기록
            this.updateChart();

            // UI 업데이트
            document.getElementById('redCount').textContent = this.redCount;
            document.getElementById('blueCount').textContent = this.blueCount;
            document.getElementById('turnCount').textContent = this.turnCount;
            document.getElementById('currentPlayer').textContent = '플레이어';
            document.getElementById('nextTurn').disabled = false;
            document.getElementById('leChatelierTurn').disabled = true;
            document.getElementById('stopGame').disabled = false;
            
            this.isGameStarted = true;
            this.draw();
        });

        // 카드 선택 이벤트
        this.canvas.addEventListener('click', (e) => {
            if (!this.isGameStarted || this.isGameEnded || !this.isUserTurn) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.offsetX) / this.scale;
            const y = (e.clientY - rect.top - this.offsetY) / this.scale;

            const clickedCard = this.cards.find(card => card.contains(x, y));
            if (clickedCard && clickedCard.isRed) {
                clickedCard.isSelected = !clickedCard.isSelected;
                if (clickedCard.isSelected) {
                    const redCards = this.cards.filter(card => card.isRed);
                    const maxMultiplier = Math.floor(redCards.length / this.redFlipRate);
                    const maxSelected = this.redFlipRate * maxMultiplier;
                    
                    // 선택한 카드 수가 X의 배수를 초과하는지 확인
                    const nextSelectedCount = this.selectedCards.length + 1;
                    if (nextSelectedCount > maxSelected) {
                        clickedCard.isSelected = false;
                        alert(`카드는 ${this.redFlipRate}장의 배수만큼 선택할 수 있습니다. (최대 ${maxSelected}장)`);
                        return;
                    }
                    
                    this.selectedCards.push(clickedCard);
                } else {
                    this.selectedCards = this.selectedCards.filter(card => card !== clickedCard);
                }
                this.draw();
            }
        });

        // 플레이어 순서 버튼
        document.getElementById('nextTurn').addEventListener('click', () => {
            if (!this.isGameStarted || this.isGameEnded || !this.isUserTurn) return;
            
            const redCards = this.cards.filter(card => card.isRed);
            const multiplier = Math.floor(redCards.length / this.redFlipRate);
            const requiredCards = this.redFlipRate * multiplier;
            
            // 선택한 카드 수가 X의 배수인지 확인
            if (this.selectedCards.length % this.redFlipRate !== 0) {
                alert(`카드는 ${this.redFlipRate}장의 배수만큼 선택할 수 있습니다.`);
                return;
            }

            // 선택된 카드 중 X장당 1장씩 뒤집기
            const cardsToFlip = Math.floor(this.selectedCards.length / this.redFlipRate);
            for (let i = 0; i < cardsToFlip; i++) {
                const randomIndex = Math.floor(Math.random() * this.selectedCards.length);
                this.selectedCards[randomIndex].flip();
                this.selectedCards.splice(randomIndex, 1);
            }

            // 선택 상태 초기화
            this.selectedCards.forEach(card => card.isSelected = false);
            this.selectedCards = [];

            // 카드 수 업데이트
            this.redCount = this.cards.filter(card => card.isRed).length;
            this.blueCount = this.cards.filter(card => !card.isRed).length;

            // UI 업데이트
            document.getElementById('redCount').textContent = this.redCount;
            document.getElementById('blueCount').textContent = this.blueCount;
            document.getElementById('nextTurn').disabled = true;
            document.getElementById('leChatelierTurn').disabled = false;
            document.getElementById('currentPlayer').textContent = '르샤틀리에';

            this.isUserTurn = false;
            this.checkVictoryConditions();
            this.draw();
            this.updateChart();
        });

        // 르샤틀리에 순서 버튼
        document.getElementById('leChatelierTurn').addEventListener('click', () => {
            if (!this.isGameStarted || this.isGameEnded || this.isUserTurn) return;

            const blueCards = this.cards.filter(card => !card.isRed);
            if (blueCards.length === 0) {
                alert('뒤집을 수 있는 파란색 카드가 없습니다.');
                this.isUserTurn = true;
                document.getElementById('nextTurn').disabled = false;
                document.getElementById('leChatelierTurn').disabled = true;
                document.getElementById('currentPlayer').textContent = '플레이어';
                return;
            }

            // Y의 배수만큼 카드 선택
            const selectedBlueCards = [];
            const randomIndices = new Set();
            const multiplier = Math.floor(blueCards.length / this.blueFlipRate);
            const cardsToSelect = this.blueFlipRate * multiplier;

            // Y의 배수만큼 카드 선택
            while (randomIndices.size < cardsToSelect && randomIndices.size < blueCards.length) {
                randomIndices.add(Math.floor(Math.random() * blueCards.length));
            }

            randomIndices.forEach(index => {
                selectedBlueCards.push(blueCards[index]);
            });

            // 선택된 카드 중 Y장당 1장씩 뒤집기
            const cardsToFlip = Math.floor(selectedBlueCards.length / this.blueFlipRate);
            for (let i = 0; i < cardsToFlip; i++) {
                const randomIndex = Math.floor(Math.random() * selectedBlueCards.length);
                selectedBlueCards[randomIndex].flip();
                selectedBlueCards.splice(randomIndex, 1);
            }

            // 카드 수 업데이트
            this.redCount = this.cards.filter(card => card.isRed).length;
            this.blueCount = this.cards.filter(card => !card.isRed).length;

            // UI 업데이트
            document.getElementById('redCount').textContent = this.redCount;
            document.getElementById('blueCount').textContent = this.blueCount;
            document.getElementById('leChatelierTurn').disabled = true;
            document.getElementById('nextTurn').disabled = false;
            document.getElementById('currentPlayer').textContent = '플레이어';

            this.turnCount++;
            document.getElementById('turnCount').textContent = this.turnCount;

            this.isUserTurn = true;
            this.checkVictoryConditions();
            this.draw();
            this.updateChart();
        });

        // STOP 버튼
        document.getElementById('stopGame').addEventListener('click', () => {
            this.stopGame();
        });

        // 리셋 버튼
        document.getElementById('resetGame').addEventListener('click', () => {
            this.init();
            this.isGameStarted = false;
            this.selectedCards = [];
            document.getElementById('nextTurn').disabled = true;
            document.getElementById('leChatelierTurn').disabled = true;
            document.getElementById('stopGame').disabled = true;
            document.getElementById('currentPlayer').textContent = '-';
            document.getElementById('redCount').textContent = '49';
            document.getElementById('blueCount').textContent = '0';
            document.getElementById('turnCount').textContent = '0';
            
            // 그래프 초기화
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.data.datasets[1].data = [];
            this.chart.update();
        });

        // 드래그 시작
        this.canvas.addEventListener('mousedown', (e) => {
            if (!this.isGameStarted || this.isGameEnded || !this.isUserTurn) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.offsetX) / this.scale;
            const y = (e.clientY - rect.top - this.offsetY) / this.scale;

            this.isDragging = true;
            this.dragStartX = x;
            this.dragStartY = y;
            this.dragEndX = x;
            this.dragEndY = y;
            this.dragRect = null;
        });

        // 드래그 중
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.offsetX) / this.scale;
            const y = (e.clientY - rect.top - this.offsetY) / this.scale;

            this.dragEndX = x;
            this.dragEndY = y;

            // 드래그 영역 계산
            const left = Math.min(this.dragStartX, this.dragEndX);
            const top = Math.min(this.dragStartY, this.dragEndY);
            const width = Math.abs(this.dragEndX - this.dragStartX);
            const height = Math.abs(this.dragEndY - this.dragStartY);

            this.dragRect = { left, top, width, height };
            this.draw();
        });

        // 드래그 종료
        this.canvas.addEventListener('mouseup', () => {
            if (!this.isDragging) return;

            // 드래그 영역 내의 카드 선택
            if (this.dragRect) {
                const redCards = this.cards.filter(card => card.isRed);
                const maxMultiplier = Math.floor(redCards.length / this.redFlipRate);
                const maxSelected = this.redFlipRate * maxMultiplier;

                this.cards.forEach(card => {
                    if (card.isRed && this.isCardInDragRect(card)) {
                        const nextSelectedCount = this.selectedCards.length + 1;
                        if (nextSelectedCount <= maxSelected) {
                            card.isSelected = true;
                            if (!this.selectedCards.includes(card)) {
                                this.selectedCards.push(card);
                            }
                        }
                    }
                });
            }

            this.isDragging = false;
            this.dragRect = null;
            this.draw();
        });
    }

    checkVictoryConditions() {
        // 카드 수가 변하지 않은 경우 체크
        if (this.redCount === this.lastRedCount && this.blueCount === this.lastBlueCount) {
            this.stableCount++;
        } else {
            this.stableCount = 0;
        }

        // 빨간색과 파란색 카드 수가 같은 경우 체크
        if (this.redCount === this.blueCount) {
            this.equalCount++;
        } else {
            this.equalCount = 0;
        }

        // 승리 조건 체크 (게임이 이미 종료된 경우에는 체크하지 않음)
        if (!this.isGameEnded) {
            if (this.equalCount >= 4) {
                this.isGameEnded = true;
                alert('르샤틀리에의 승리입니다! (카드 수가 4턴 동안 같음)');
                
                // 버튼 상태 업데이트
                document.getElementById('nextTurn').disabled = true;
                document.getElementById('leChatelierTurn').disabled = true;
                document.getElementById('stopGame').disabled = true;
            } else if (this.turnCount >= this.maxTurns) {
                this.isGameEnded = true;
                alert('게임이 종료되었습니다! (최대 턴 수 도달)');
                
                // 버튼 상태 업데이트
                document.getElementById('nextTurn').disabled = true;
                document.getElementById('leChatelierTurn').disabled = true;
                document.getElementById('stopGame').disabled = true;
            }
        }

        // 현재 상태 저장
        this.lastRedCount = this.redCount;
        this.lastBlueCount = this.blueCount;
    }

    stopGame() {
        if (this.isGameStarted && !this.isGameEnded) {
            this.isGameEnded = true;
            let message = '';
            
            if (this.equalCount >= 2 && this.equalCount <= 3) {
                message = '플레이어의 승리입니다! (카드 수가 ' + this.equalCount + '턴 동안 같음)';
            } else if (this.equalCount >= 4) {
                message = '르샤틀리에의 승리입니다! (카드 수가 4턴 동안 같음)';
            } else if (this.equalCount === 0) {
                message = '게임이 종료되었습니다! (승리 조건 미달)';
            } else {
                message = '르샤틀리에의 승리입니다! (승리 조건 미달)';
            }
            
            alert(message);
            
            // 버튼 상태 업데이트
            document.getElementById('nextTurn').disabled = true;
            document.getElementById('leChatelierTurn').disabled = true;
            document.getElementById('stopGame').disabled = true;
        }
    }

    resetGame() {
        this.init();
        document.getElementById('turnCount').textContent = this.turnCount;
        document.getElementById('redCount').textContent = this.redCount;
        document.getElementById('blueCount').textContent = this.blueCount;
        document.getElementById('currentPlayer').textContent = '-';
        document.getElementById('nextTurn').disabled = true;
        document.getElementById('leChatelierTurn').disabled = true;
        document.getElementById('stopGame').disabled = true;
        this.isGameStarted = false;
        this.draw();
    }

    setupChart() {
        const ctx = document.getElementById('resultChart').getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: this.chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 49
                    }
                }
            }
        });
        // 초기 데이터 추가
        this.updateChart();
    }

    updateChart() {
        this.chartData.labels.push(this.turnCount);
        this.chartData.datasets[0].data.push(this.redCount);
        this.chartData.datasets[1].data.push(this.blueCount);
        
        if (this.chartData.labels.length > 20) {
            this.chartData.labels.shift();
            this.chartData.datasets[0].data.shift();
            this.chartData.datasets[1].data.shift();
        }
        
        this.chart.update();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 변환 매트릭스 저장
        this.ctx.save();
        
        // 캔버스 중앙을 기준으로 변환
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.translate(-this.canvas.width / 2 + this.offsetX, -this.canvas.height / 2 + this.offsetY);

        // 드래그 영역 그리기
        if (this.dragRect) {
            this.ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
            this.ctx.strokeStyle = 'blue';
            this.ctx.lineWidth = 2;
            this.ctx.fillRect(this.dragRect.left, this.dragRect.top, this.dragRect.width, this.dragRect.height);
            this.ctx.strokeRect(this.dragRect.left, this.dragRect.top, this.dragRect.width, this.dragRect.height);
        }

        // 카드 그리기
        this.cards.forEach(card => {
            card.draw(this.ctx);
        });
        
        // 변환 매트릭스 복원
        this.ctx.restore();
    }

    isCardInDragRect(card) {
        if (!this.dragRect) return false;
        
        const cardRight = card.x + card.width;
        const cardBottom = card.y + card.height;
        
        return card.x < this.dragRect.left + this.dragRect.width &&
               cardRight > this.dragRect.left &&
               card.y < this.dragRect.top + this.dragRect.height &&
               cardBottom > this.dragRect.top;
    }

    nextTurn() {
        if (this.isGameEnded) return;

        if (this.isUserTurn) {
            // 플레이어의 턴
            const redCards = this.cards.filter(card => card.isRed);
            if (redCards.length === 0) {
                alert('뒤집을 수 있는 빨간색 카드가 없습니다.');
                return;
            }

            // X의 배수만큼 카드 선택
            const selectedRedCards = [];
            const randomIndices = new Set();
            const multiplier = Math.floor(redCards.length / this.redFlipRate); // X의 배수 계산
            const cardsToSelect = this.redFlipRate * multiplier;

            while (randomIndices.size < cardsToSelect && randomIndices.size < redCards.length) {
                randomIndices.add(Math.floor(Math.random() * redCards.length));
            }

            randomIndices.forEach(index => {
                selectedRedCards.push(redCards[index]);
            });

            // 선택된 카드 중 X장당 1장씩 뒤집기
            const cardsToFlip = Math.floor(selectedRedCards.length / this.redFlipRate);
            for (let i = 0; i < cardsToFlip; i++) {
                const randomIndex = Math.floor(Math.random() * selectedRedCards.length);
                selectedRedCards[randomIndex].flip();
                selectedRedCards.splice(randomIndex, 1);
            }

            // 카드 수 업데이트
            this.redCount = this.cards.filter(card => card.isRed).length;
            this.blueCount = this.cards.filter(card => !card.isRed).length;

            // UI 업데이트
            document.getElementById('redCount').textContent = this.redCount;
            document.getElementById('blueCount').textContent = this.blueCount;
            document.getElementById('nextTurn').disabled = true;
            document.getElementById('leChatelierTurn').disabled = false;
            document.getElementById('currentPlayer').textContent = '르샤틀리에';

            this.isUserTurn = false;
            this.checkVictoryConditions();
            this.draw();
            this.updateChart();
        } else {
            // 르샤틀리에의 턴
            const blueCards = this.cards.filter(card => !card.isRed);
            if (blueCards.length === 0) {
                alert('뒤집을 수 있는 파란색 카드가 없습니다.');
                this.isUserTurn = true;
                document.getElementById('nextTurn').disabled = false;
                document.getElementById('leChatelierTurn').disabled = true;
                document.getElementById('currentPlayer').textContent = '플레이어';
                return;
            }

            // Y의 배수만큼 카드 선택
            const selectedBlueCards = [];
            const randomIndices = new Set();
            const multiplier = Math.floor(blueCards.length / this.blueFlipRate);
            const cardsToSelect = this.blueFlipRate * multiplier;

            while (randomIndices.size < cardsToSelect && randomIndices.size < blueCards.length) {
                randomIndices.add(Math.floor(Math.random() * blueCards.length));
            }

            randomIndices.forEach(index => {
                selectedBlueCards.push(blueCards[index]);
            });

            // 선택된 카드 중 Y장당 1장씩 뒤집기
            const cardsToFlip = Math.floor(selectedBlueCards.length / this.blueFlipRate);
            for (let i = 0; i < cardsToFlip; i++) {
                const randomIndex = Math.floor(Math.random() * selectedBlueCards.length);
                selectedBlueCards[randomIndex].flip();
                selectedBlueCards.splice(randomIndex, 1);
            }

            // 카드 수 업데이트
            this.redCount = this.cards.filter(card => card.isRed).length;
            this.blueCount = this.cards.filter(card => !card.isRed).length;

            // UI 업데이트
            document.getElementById('redCount').textContent = this.redCount;
            document.getElementById('blueCount').textContent = this.blueCount;
            document.getElementById('leChatelierTurn').disabled = true;
            document.getElementById('nextTurn').disabled = false;
            document.getElementById('currentPlayer').textContent = '플레이어';

            this.turnCount++;
            document.getElementById('turnCount').textContent = this.turnCount;

            this.isUserTurn = true;
            this.checkVictoryConditions();
            this.draw();
            this.updateChart();
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 