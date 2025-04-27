let selectedCharacter = 'water'; // 전역 변수로 선언

class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    init() {
        console.log('TitleScene init');
    }

    preload() {
        console.log('TitleScene preload start');
        // 로딩 텍스트 표시
        let loadingText = this.add.text(400, 300, '로딩중...', {
            fontSize: '32px',
            fill: '#fff'
        });
        loadingText.setOrigin(0.5, 0.5);

        // 타이틀 이미지 로드
        this.load.image('title', './assets/title.png');
        
        // 게임 아이템 이미지 로드
        this.load.image('obstacle', 'assets/obstacle.png');
        this.load.image('catalyst', 'assets/catalyst.png');
        this.load.image('inhibitor', 'assets/inhibitor.png');
        
        // 효과음 로드
        this.load.audio('select', 'assets/sounds/select.mp3');
        
        // 로딩 이벤트 처리
        this.load.on('progress', (value) => {
            console.log(`Loading: ${Math.round(value * 100)}%`);
        });

        this.load.on('complete', () => {
            console.log('Loading complete');
            loadingText.destroy();
        });

        this.load.on('loaderror', (file) => {
            console.error('Load error:', file.src);
        });
    }

    create() {
        console.log('TitleScene create start');
        this.cameras.main.setBackgroundColor('#000000');

        try {
            const titleImage = this.add.image(400, 300, 'title');
            titleImage.setOrigin(0.5);
            
            const scale = Math.min(
                (this.cameras.main.width * 0.8) / titleImage.width,
                (this.cameras.main.height * 0.8) / titleImage.height
            );
            titleImage.setScale(scale);

            // 하단에 안내 메시지 추가
            this.add.text(400, 550, '잠시만 기다려 주세요...', {
                fontSize: '32px',
                fill: '#fff',
                backgroundColor: '#000000',
                padding: { x: 20, y: 10 },
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5);

            // 3초 후 게임 설명 표시
            this.time.delayedCall(3000, () => {
                this.showGameInstructions();
            });

        } catch (error) {
            console.error('Error in create:', error);
            // 에러 발생 시 텍스트로 표시
            this.add.text(400, 300, 'Equilibrium Runner', {
                fontSize: '48px',
                fill: '#fff'
            }).setOrigin(0.5);
        }
    }

    showGameInstructions() {
        // 배경 이미지 제거
        this.children.removeAll();
        
        // 효과음 초기화
        this.selectSound = this.sound.add('select');
        
        // 제목
        const title = this.add.text(400, 30, '게임 설명', {
            fontSize: '32px',
            fill: '#ffff00',
            backgroundColor: '#00000080',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // 조작 방법
        const controlsTitle = this.add.text(400, 80, '조작 방법', {
            fontSize: '24px',
            fill: '#00ff00',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        const controlsText = this.add.text(400, 110, '방향 키로 캐릭터를 이동합니다', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        // 게임 아이템 설명
        const itemsTitle = this.add.text(400, 150, '게임 아이템', {
            fontSize: '24px',
            fill: '#00ff00',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // 몬스터 이미지와 설명
        const obstacleImage = this.add.image(250, 200, 'obstacle');
        obstacleImage.setDisplaySize(100, 100);
        const obstacleText = this.add.text(310, 200, '몬스터: OX 퀴즈가 출제됩니다', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5);
        
        // 정촉매 이미지와 설명
        const catalystImage = this.add.image(250, 250, 'catalyst');
        catalystImage.setDisplaySize(100, 100);
        const catalystText = this.add.text(310, 250, '정촉매: 반응 속도가 증가합니다', {
            fontSize: '20px',
            fill: '#00ff00',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5);
        
        // 부촉매 이미지와 설명
        const inhibitorImage = this.add.image(250, 300, 'inhibitor');
        inhibitorImage.setDisplaySize(100, 100);
        const inhibitorText = this.add.text(310, 300, '부촉매: 반응 속도가 감소합니다', {
            fontSize: '20px',
            fill: '#ff0000',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0, 0.5);
        
        // 게임 진행
        const goalTitle = this.add.text(400, 350, '게임 진행 시간 3분', {
            fontSize: '24px',
            fill: '#00ff00',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        const goalText = this.add.text(400, 400, 
            '반응 속도가 처음 시작할 때보다 점점 느려져\n' +
            '정반응(캐릭터의 움직임 빠르기)과\n' +
            '역반응 속도(아이템의 빠르기)가 같아질 때,\n' +
            '화학 평형에 도달하여 게임이 끝납니다', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // 승리 조건
        const winTitle = this.add.text(400, 470, '승리 조건', {
            fontSize: '24px',
            fill: '#00ff00',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        const winText = this.add.text(400, 510, 
            '점수가 높은 사람이 승리합니다', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        // 시작 버튼
        const startButton = this.add.rectangle(400, 570, 200, 50, 0x00ff00, 0.5)
            .setInteractive()
            .setStrokeStyle(2, 0xffffff);
        
        const startText = this.add.text(400, 570, '게임 시작', {
            fontSize: '24px',
            fill: '#ffff00',
            backgroundColor: '#00000080',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        startButton.on('pointerover', () => {
            startButton.setFillStyle(0x00ff00, 0.8);
            startText.setStyle({ fill: '#ffffff' });
        });
        
        startButton.on('pointerout', () => {
            startButton.setFillStyle(0x00ff00, 0.5);
            startText.setStyle({ fill: '#ffff00' });
        });
        
        startButton.on('pointerdown', () => {
            this.selectSound.play();  // 게임 시작 효과음 재생
            this.scene.start('NicknameScene');
        });
    }
}

class NicknameScene extends Phaser.Scene {
    constructor() {
        super('NicknameScene');
    }

    preload() {
        // 배경 이미지 로드
        this.load.image('bg', 'assets/background.png');
    }

    create() {
        // 배경 이미지 추가
        const bg = this.add.image(400, 300, 'bg');
        bg.setDisplaySize(800, 600);
        bg.setAlpha(0.7);

        // 제목
        const title = this.add.text(400, 30, '플레이어 이름 입력', {
            fontSize: '36px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // 입력 필드
        const input = document.createElement('input');
        input.type = 'text';
        input.style.position = 'absolute';
        input.style.top = '270px';
        input.style.left = '300px';
        input.style.width = '400px';
        input.style.height = '60px';
        input.style.fontSize = '24px';
        input.style.textAlign = 'center';
        input.style.backgroundColor = 'rgba(0,0,0,0.8)';
        input.style.color = '#ffffff';
        input.style.border = '2px solid white';
        input.style.borderRadius = '5px';
        input.maxLength = 10;
        input.placeholder = '이름을 입력하세요';
        document.body.appendChild(input);
        input.focus();

        // 확인 버튼
        const confirmButton = this.add.rectangle(400, 450, 200, 60, 0x4CAF50, 0.8);
        confirmButton.setStrokeStyle(2, 0xffffff);
        confirmButton.setInteractive();

        const confirmText = this.add.text(400, 450, '확인', {
            fontSize: '32px',
            fill: '#ffffff',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);

        // 버튼 호버 효과
        confirmButton.on('pointerover', () => {
            confirmButton.setFillStyle(0x4CAF50, 0.9);
            confirmText.setStyle({ fontSize: '36px' });
        });

        confirmButton.on('pointerout', () => {
            confirmButton.setFillStyle(0x4CAF50, 0.8);
            confirmText.setStyle({ fontSize: '32px' });
        });

        // 확인 버튼 클릭 이벤트
        confirmButton.on('pointerdown', () => {
            const nickname = input.value.trim();
            if (nickname.length > 0) {
                document.body.removeChild(input);
                this.scene.start('LevelSelectScene', { nickname });
            }
        });

        // 엔터 키 이벤트
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const nickname = input.value.trim();
                if (nickname.length > 0) {
                    document.body.removeChild(input);
                    this.scene.start('LevelSelectScene', { nickname });
                }
            }
        });
    }
}

class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super('LevelSelectScene');
        this.isMusicPlaying = false;
        this.music = null;
    }
    preload() {
        this.load.image('bg', 'assets/background.png');
        this.load.audio('bgm', 'assets/bgm.mp3');
        this.load.audio('select', 'assets/sounds/select.mp3');
    }
    init(data) {
        this.gameData = data;
        console.log('LevelSelectScene init with data:', data);
    }
    create() {
        // 배경 이미지는 한 번만 추가
        const bg = this.add.image(400, 300, 'bg');
        bg.setDisplaySize(800, 600);
        bg.setAlpha(0.7); // 배경 투명도 조정

        // 효과음 초기화
        this.selectSound = this.sound.add('select');

        // 제목 추가
        this.add.text(400, 50, '난이도를 선택하세요', { 
            fontSize: '36px', 
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // 난이도별 설정
        const levels = [
            { 
                label: "초급 (남극)", 
                key: "elementary", 
                background: "background_arctic.png", 
                speed: 250, 
                delay: 2667,
                obstacleIncreaseRate: 0.2, 
                timeLimit: 180,
                description: "천천히 움직이는 장애물과 아이템이 적게 등장합니다",
                obstacleCount: 2,
                inhibitorCount: 2,
                inhibitorDelay: 4000
            },
            { 
                label: "중급 (도시)", 
                key: "default", 
                background: "background_city.png", 
                speed: 300, 
                delay: 2000,
                obstacleIncreaseRate: 0.25,
                timeLimit: 180,
                description: "보통 속도로 움직이는 장애물과 아이템이 적당히 등장합니다",
                obstacleCount: 1,  // 2의 70% = 1.4, 반올림하여 1
                inhibitorCount: 1,  // 2의 70% = 1.4, 반올림하여 1
                inhibitorDelay: 2667
            },
            { 
                label: "고급 (사막)", 
                key: "advanced", 
                background: "background_desert.png", 
                speed: 350, 
                delay: 1333,
                obstacleIncreaseRate: 0.3,
                timeLimit: 180,
                description: "빠르게 움직이는 장애물과 아이템이 많이 등장합니다",
                obstacleCount: 2,  // 3의 70% = 2.1, 반올림하여 2
                inhibitorCount: 2,  // 3의 70% = 2.1, 반올림하여 2
                inhibitorDelay: 1333
            }
        ];
        
        levels.forEach((level, index) => {
            // 난이도 버튼 배경
            const button = this.add.rectangle(400, 180 + (index * 120), 600, 100, 0x000000, 0.7);
            button.setStrokeStyle(2, 0xffffff);
            
            // 난이도 제목
            const buttonText = this.add.text(400, 160 + (index * 120), level.label, { 
                fontSize: '32px', 
                fill: '#ffff00',
                fontFamily: 'Arial',
                backgroundColor: '#000000',
                padding: { x: 15, y: 5 }
            }).setOrigin(0.5);
            
            // 난이도 설명
            const descriptionText = this.add.text(400, 200 + (index * 120), level.description, { 
                fontSize: '20px', 
                fill: '#ffffff',
                fontFamily: 'Arial',
                align: 'left',
                backgroundColor: '#000000',
                padding: { x: 15, y: 5 }
            }).setOrigin(0.5);
            
            button.setInteractive();
            
            // 버튼 호버 효과
            button.on('pointerover', () => {
                button.setFillStyle(0x000000, 0.9);
                buttonText.setFill('#ffffff');
            });
            
            button.on('pointerout', () => {
                button.setFillStyle(0x000000, 0.7);
                buttonText.setFill('#ffff00');
            });
            
            button.on('pointerdown', () => {
                this.selectSound.play();
                console.log('Level selected:', level);
                this.scene.start('CharacterSelectScene', { ...level, nickname: this.gameData.nickname });
            });
        });

        // 음악 컨트롤 버튼
        const musicButton = this.add.text(400, 550, '🎵 배경음악 켜기/끄기', {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        
        musicButton.on('pointerdown', () => {
            if (this.isMusicPlaying) {
                this.music.stop();
                musicButton.setText('🔇 배경음악 켜기/끄기');
            } else {
                if (!this.music) {
                    this.music = this.sound.add('bgm', {
                        volume: 0.5,
                        loop: true
                    });
                }
                this.music.play();
                musicButton.setText('🎵 배경음악 켜기/끄기');
            }
            this.isMusicPlaying = !this.isMusicPlaying;
        });
    }
}

class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super('CharacterSelectScene');
    }
    init(data) {
        this.gameData = data;
        console.log('CharacterSelectScene init with data:', data);
    }
    preload() {
        // 배경 이미지 로드
        this.load.image('background', `assets/${this.gameData.background}`);
        
        // 캐릭터 이미지 로딩
        this.characters = [
            { key: 'water', name: '물' },
            { key: 'ammonia', name: '암모니아' },
            { key: 'co2', name: '이산화탄소' },
            { key: 'h2', name: '수소' },
            { key: 'n2', name: '질소' },
            { key: 'o2', name: '산소' }
        ];
        
        this.characters.forEach(char => {
            this.load.image(char.key, `assets/${char.key}.png`);
        });

        // 효과음 로드
        this.load.audio('select', 'assets/sounds/select.mp3');
    }
    create() {
        // 배경 이미지 추가 및 조정
        this.background = this.add.image(400, 300, 'background');
        this.background.setDisplaySize(800, 600);
        this.background.setAlpha(0.5);
        
        // 효과음 초기화
        this.selectSound = this.sound.add('select');
        
        // 제목
        this.add.text(400, 50, '캐릭터 선택', {
            fontSize: '48px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // 캐릭터 선택 버튼 생성
        this.characters.forEach((char, index) => {
            const x = 200 + (index % 3) * 200;
            const y = 200 + Math.floor(index / 3) * 200;
            
            // 캐릭터 이미지
            const characterImage = this.add.image(x, y, char.key);
            characterImage.setDisplaySize(200, 200);
            characterImage.setInteractive();
            
            // 캐릭터 이름
            this.add.text(x, y + 120, char.name, {
                fontSize: '24px',
                fill: '#fff',
                backgroundColor: '#00000080',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5);
            
            // 클릭 이벤트
            characterImage.on('pointerdown', () => {
                this.selectSound.play();
                console.log('Selected character:', char);
                const gameData = {
                    ...this.gameData,
                    character: char.key
                };
                console.log('Starting game with data:', gameData);
                // 씬 전환 전에 데이터가 제대로 설정되었는지 확인
                if (!gameData.background || !gameData.character) {
                    console.error('Missing required game data:', gameData);
                    return;
                }
                this.scene.start('GameScene', gameData);
            });
        });
    }
}

class ScoreScene extends Phaser.Scene {
    constructor() {
        super('ScoreScene');
        this.scores = {
            elementary: JSON.parse(localStorage.getItem('elementaryScores')) || [],
            default: JSON.parse(localStorage.getItem('defaultScores')) || [],
            advanced: JSON.parse(localStorage.getItem('advancedScores')) || []
        };
    }

    init(data) {
        console.log('ScoreScene init with data:', data);  // 디버깅용 로그 추가
        if (data && data.score !== undefined && data.nickname && data.level) {
            this.currentScore = data.score;
            this.currentNickname = data.nickname;
            this.currentLevel = data.level;
            this.addScore();
        }
    }

    addScore() {
        console.log('Adding score:', {  // 디버깅용 로그 추가
            nickname: this.currentNickname,
            score: this.currentScore,
            level: this.currentLevel
        });
        
        if (!this.scores[this.currentLevel]) {
            this.scores[this.currentLevel] = [];
        }
        
        this.scores[this.currentLevel].push({
            nickname: this.currentNickname,
            score: this.currentScore,
            date: new Date().toLocaleDateString()
        });

        // 점수 내림차순 정렬
        this.scores[this.currentLevel].sort((a, b) => b.score - a.score);
        
        // 상위 10개만 저장
        this.scores[this.currentLevel] = this.scores[this.currentLevel].slice(0, 10);
        
        // 로컬 스토리지에 저장
        localStorage.setItem(`${this.currentLevel}Scores`, JSON.stringify(this.scores[this.currentLevel]));
    }

    create() {
        // 배경 이미지 추가
        const bg = this.add.image(400, 300, 'bg');
        bg.setDisplaySize(800, 600);
        bg.setAlpha(0.7);

        // 제목 추가
        const levelNames = {
            elementary: '초급 (남극)',
            default: '중급 (도시)',
            advanced: '고급 (사막)'
        };

        this.add.text(400, 50, `${levelNames[this.currentLevel]} 점수 순위`, {
            fontSize: '36px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);

        // 순위 표시
        this.scores[this.currentLevel].forEach((score, index) => {
            const y = 120 + (index * 40);
            
            // 순위
            this.add.text(150, y, `${index + 1}위`, {
                fontSize: '24px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            // 닉네임
            this.add.text(300, y, score.nickname, {
                fontSize: '24px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            // 점수
            this.add.text(500, y, score.score, {
                fontSize: '24px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            // 날짜
            this.add.text(650, y, score.date, {
                fontSize: '24px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
        });

        // 메인 메뉴 버튼
        const menuButton = this.add.rectangle(400, 550, 200, 60, 0x00ff00, 0.7);
        menuButton.setStrokeStyle(2, 0xffffff);
        menuButton.setInteractive();

        const menuText = this.add.text(400, 550, '메인 메뉴', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 버튼 호버 효과
        menuButton.on('pointerover', () => {
            menuButton.setFillStyle(0x00ff00, 0.9);
        });

        menuButton.on('pointerout', () => {
            menuButton.setFillStyle(0x00ff00, 0.7);
        });

        // 메인 메뉴로 돌아가기
        menuButton.on('pointerdown', () => {
            this.scene.start('TitleScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.input = null;
        this.cursors = null;
        this.isQuizActive = false;
        this.quizData = null;
        this.touchControls = null;  // 터치 컨트롤 추가
    }
    init(data) {
        console.log('GameScene init with data:', data);
        if (!data || !data.character || !data.background) {
            console.error('Invalid game data:', data);
            this.scene.start('TitleScene');
            return;
        }
        this.gameData = data;
        console.log('Selected character:', this.gameData.character);
        // 게임 설정 초기화
        this.initialSpeed = this.gameData.speed || 200;
        this.currentSpeed = this.initialSpeed;
        this.speedDecay = 0.1;
        this.isGameOver = false;
        this.score = 0;
        this.gameTime = 0;
        this.hitObstacleCount = 0;  // 장애물 충돌 횟수 초기화
    }
    preload() {
        console.log('GameScene preload start');
        
        // 배경 이미지 로드
        this.load.image('background', `assets/${this.gameData.background}`);
        
        // 플레이어 이미지 로드
        this.load.image('player', `assets/${this.gameData.character}.png`);
        
        // 게임 아이템 이미지 로드
        this.load.image('obstacle', 'assets/obstacle.png');
        this.load.image('catalyst', 'assets/catalyst.png');
        this.load.image('inhibitor', 'assets/inhibitor.png');

        // 효과음 로드
        this.load.audio('select', 'assets/sounds/select.mp3');
        this.load.audio('catalyst', 'assets/sounds/catalyst.mp3');
        this.load.audio('inhibitor', 'assets/sounds/inhibitor.mp3');
        this.load.audio('obstacle', 'assets/sounds/obstacle.mp3');
        this.load.audio('quiz_correct', 'assets/sounds/quiz_correct.mp3');
        this.load.audio('quiz_wrong', 'assets/sounds/quiz_wrong.mp3');

        // 퀴즈 데이터 로드
        const quizFile = `quiz_data/${this.gameData.key}.json`;
        console.log('Loading quiz file:', quizFile);
        
        // 로드 이벤트 리스너 추가
        this.load.on('filecomplete-json-quizData', (key, type, data) => {
            console.log('Quiz data loaded successfully:', data);
            this.quizData = data;  // 로드된 데이터를 클래스 변수에 저장
        });
        
        this.load.on('loaderror', (file) => {
            console.error('Error loading file:', file);
        });
        
        // JSON 파일 로드
        this.load.json('quizData', quizFile);
    }

    create() {
        console.log('GameScene create start');
        
        // 배경 이미지 추가 및 조정
        this.background = this.add.image(400, 300, 'background');
        this.background.setDisplaySize(800, 600);
        this.background.setAlpha(0.5);
        
        // 효과음 초기화
        this.selectSound = this.sound.add('select');
        this.catalystSound = this.sound.add('catalyst');
        this.inhibitorSound = this.sound.add('inhibitor');
        this.obstacleSound = this.sound.add('obstacle');
        this.quizCorrectSound = this.sound.add('quiz_correct');
        this.quizWrongSound = this.sound.add('quiz_wrong');
        
        // 방향키 입력 설정
        this.input.keyboard.removeAllListeners();
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // 터치 컨트롤 설정
        this.setupTouchControls();
        
        // 퀴즈 데이터 초기화
        this.quizData = this.cache.json.get('quizData');
        console.log('Quiz data in create:', this.quizData);
        
        // 바로 게임 시작
        this.startGame();
    }

    setupTouchControls() {
        // 터치 컨트롤 영역 생성
        this.touchControls = this.add.graphics();
        this.touchControls.fillStyle(0x000000, 0.1);
        this.touchControls.fillRect(0, 0, 800, 600);
        
        // 터치 영역 설정
        this.input.addPointer(1);
        
        // 터치 시작 위치와 현재 위치
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchCurrentX = 0;
        this.touchCurrentY = 0;
        
        // 터치 이벤트 리스너
        this.input.on('pointerdown', (pointer) => {
            this.touchStartX = pointer.x;
            this.touchStartY = pointer.y;
            this.touchCurrentX = pointer.x;
            this.touchCurrentY = pointer.y;
        });
        
        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) return;
            
            this.touchCurrentX = pointer.x;
            this.touchCurrentY = pointer.y;
            
            // 이동 거리 계산
            const deltaX = this.touchCurrentX - this.touchStartX;
            const deltaY = this.touchCurrentY - this.touchStartY;
            
            // 이동 거리 제한 (최대 100픽셀)
            const maxDistance = 100;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > maxDistance) {
                const ratio = maxDistance / distance;
                this.touchCurrentX = this.touchStartX + deltaX * ratio;
                this.touchCurrentY = this.touchStartY + deltaY * ratio;
            }
            
            // 이동 방향 벡터 계산
            const moveX = (this.touchCurrentX - this.touchStartX) / maxDistance;
            const moveY = (this.touchCurrentY - this.touchStartY) / maxDistance;
            
            // 속도 적용 (대각선 이동 시 속도 정규화)
            const speed = this.playerSpeed;
            const normalizedSpeed = speed / Math.sqrt(moveX * moveX + moveY * moveY);
            
            this.player.setVelocityX(moveX * normalizedSpeed);
            this.player.setVelocityY(moveY * normalizedSpeed);
        });
        
        this.input.on('pointerup', () => {
            // 부드러운 정지 효과
            this.tweens.add({
                targets: this.player.body.velocity,
                x: 0,
                y: 0,
                duration: 200,
                ease: 'Power2'
            });
        });
    }

    update() {
        if (this.isGameOver) return;
        
        // 퀴즈 중이면 키보드 입력 처리하지 않음
        if (!this.input.keyboard.enabled) return;
        
        // 키보드 입력 처리
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(this.playerSpeed);
        } else if (!this.input.activePointer.isDown) {
            this.player.setVelocityX(0);
        }
        
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-this.playerSpeed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(this.playerSpeed);
        } else if (!this.input.activePointer.isDown) {
            this.player.setVelocityY(0);
        }
        
        // 플레이어 이동
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(this.playerSpeed);
        } else {
            this.player.setVelocityX(0);
        }
        
        if (this.cursors.up.isDown) {
            this.player.setVelocityY(-this.playerSpeed);
        } else if (this.cursors.down.isDown) {
            this.player.setVelocityY(this.playerSpeed);
        } else {
            this.player.setVelocityY(0);
        }
        
        // 화면 경계 제한 (더 엄격하게 적용)
        const minX = 50;
        const maxX = 750;
        const minY = 50;
        const maxY = 550;
        
        // x 좌표 제한
        if (this.player.x < minX) {
            this.player.x = minX;
            this.player.setVelocityX(0);
        } else if (this.player.x > maxX) {
            this.player.x = maxX;
            this.player.setVelocityX(0);
        }
        
        // y 좌표 제한
        if (this.player.y < minY) {
            this.player.y = minY;
            this.player.setVelocityY(0);
        } else if (this.player.y > maxY) {
            this.player.y = maxY;
            this.player.setVelocityY(0);
        }
        
        // 시간 업데이트
        this.gameTime += 1/60;
        
        // 시간 제한 확인 (모든 난이도에서 3분 제한)
        if (Math.floor(this.gameTime) >= 180) {
            console.log('게임 시간 제한 도달:', this.gameTime);  // 디버깅용 로그
            this.isGameOver = true;  // 게임 오버 상태로 설정
            this.physics.pause();  // 물리 엔진 일시 정지
            this.endGame();  // 게임 종료
            return;
        }
        
        this.timeText.setText(`시간: ${Math.floor(this.gameTime)}초`);
        
        // 반응 속도 감소
        this.currentSpeed = Math.max(50, this.currentSpeed - this.speedDecay);
        
        // 속도 표시 업데이트
        this.speedText.setText(`속도: ${this.currentSpeed.toFixed(2)}`);
        
        // 평형 상태 확인
        this.checkEquilibrium();
    }

    startGame() {
        // 게임 상태 초기화
        this.score = 0;
        this.gameTime = 0;
        this.isGameOver = false;
        this.playerSpeed = 200;  // 플레이어 이동 속도 초기화
        
        // 플레이어 생성 및 물리 엔진 설정
        this.player = this.physics.add.sprite(400, 500, 'player');
        this.player.setDisplaySize(120, 120);
        this.player.setDepth(1);
        this.player.setCollideWorldBounds(true);
        
        // 충돌 범위 설정
        this.player.body.setSize(100, 100);  // 실제 충돌 범위를 이미지보다 작게 설정
        this.player.body.setOffset(10, 10);  // 충돌 범위를 중앙에 맞춤
        
        // 점수 표시
        this.scoreText = this.add.text(16, 16, '점수: 0', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        });
        
        // 시간 표시
        this.timeText = this.add.text(16, 60, '시간: 0초', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        });
        
        // 속도 표시 추가
        this.speedText = this.add.text(16, 104, `속도: ${this.currentSpeed.toFixed(2)}`, {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        });
        
        // 메시지 표시 영역 초기화
        this.messageText = this.add.text(400, 300, '', {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setVisible(false);
        
        // 장애물 그룹 생성
        this.obstacles = this.physics.add.group();
        this.catalysts = this.physics.add.group();
        this.inhibitors = this.physics.add.group();
        
        // 충돌 설정
        this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, null, this);
        this.physics.add.collider(this.player, this.catalysts, this.hitCatalyst, null, this);
        this.physics.add.collider(this.player, this.inhibitors, this.hitInhibitor, null, this);
        
        // 게임 시작
        this.spawnObstacle();
    }

    spawnObstacle() {
        if (this.isGameOver) return;
        
        try {
            // 장애물 생성 및 물리 엔진 적용
            for (let i = 0; i < this.gameData.obstacleCount; i++) {
                const obstacle = this.physics.add.image(
                    Phaser.Math.Between(100, 700),
                    -50,
                    'obstacle'
                );
                obstacle.setDisplaySize(120, 120);
                obstacle.body.setSize(100, 100);
                obstacle.body.setOffset(10, 10);
                this.obstacles.add(obstacle);
                obstacle.setVelocityY(this.currentSpeed);
            }
            
            // 촉매제 생성 및 물리 엔진 적용 (40% 확률로 생성)
            if (Math.random() < 0.4) {
                const catalyst = this.physics.add.image(
                    Phaser.Math.Between(100, 700),
                    -50,
                    'catalyst'
                );
                catalyst.setDisplaySize(130, 130);
                catalyst.body.setSize(110, 110);
                catalyst.body.setOffset(10, 10);
                this.catalysts.add(catalyst);
                catalyst.setVelocityY(this.currentSpeed);
            }
            
            // 억제제 생성 및 물리 엔진 적용
            for (let i = 0; i < this.gameData.inhibitorCount; i++) {
                const inhibitor = this.physics.add.image(
                    Phaser.Math.Between(100, 700),
                    -50,
                    'inhibitor'
                );
                inhibitor.setDisplaySize(150, 150);
                inhibitor.body.setSize(130, 130);
                inhibitor.body.setOffset(10, 10);
                this.inhibitors.add(inhibitor);
                inhibitor.setVelocityY(this.currentSpeed);
            }
            
            // 다음 장애물 생성
            this.time.delayedCall(this.gameData.delay, () => {
                this.spawnObstacle();
            });
            
            // 다음 부촉매 생성
            this.time.delayedCall(this.gameData.inhibitorDelay, () => {
                for (let i = 0; i < this.gameData.inhibitorCount; i++) {
                    const inhibitor = this.physics.add.image(
                        Phaser.Math.Between(100, 700),
                        -50,
                        'inhibitor'
                    );
                    inhibitor.setDisplaySize(150, 150);
                    inhibitor.body.setSize(130, 130);
                    inhibitor.body.setOffset(10, 10);
                    this.inhibitors.add(inhibitor);
                    inhibitor.setVelocityY(this.currentSpeed);
                }
            });
            
            // 다음 정촉매 생성 (장애물 생성 간격의 절반)
            this.time.delayedCall(this.gameData.delay / 2, () => {
                if (Math.random() < 0.4) {
                    const catalyst = this.physics.add.image(
                        Phaser.Math.Between(100, 700),
                        -50,
                        'catalyst'
                    );
                    catalyst.setDisplaySize(130, 130);
                    catalyst.body.setSize(110, 110);
                    catalyst.body.setOffset(10, 10);
                    this.catalysts.add(catalyst);
                    catalyst.setVelocityY(this.currentSpeed);
                }
            });
            
        } catch (error) {
            console.error('Error in spawnObstacle:', error);
        }
    }

    showMessage(text, color) {
        // 기존 메시지 제거
        this.messageText.setText('');
        
        // 새 메시지 추가
        this.messageText.setText(text);
        this.messageText.setFill(color);
        
        // 2초 후 메시지 제거
        this.time.delayedCall(2000, () => {
            this.messageText.setText('');
        });
    }

    hitObstacle(player, obstacle) {
        obstacle.destroy();
        this.obstacleSound.play();
        
        // 키보드 입력 완전히 비활성화
        this.input.keyboard.enabled = false;
        this.input.keyboard.removeAllListeners();
        
        // 퀴즈 표시
        this.showQuiz();
        
        this.checkEquilibrium();
    }

    hitCatalyst(player, catalyst) {
        catalyst.destroy();
        this.catalystSound.play();  // 촉매 효과음 재생
        
        // 촉매로 인한 속도 증가 (최대 초기 속도의 1.5배까지)
        this.currentSpeed = Math.min(this.initialSpeed * 1.5, this.currentSpeed + 50);
        
        // 플레이어 이동 속도 증가
        this.playerSpeed = 300;
        
        this.showMessage('촉매로 인한 반응 속도 증가!', '#00ff00');
        this.scoreText.setText(`점수: ${this.score += 100}`);
        
        // 5초 후 플레이어 속도 원상복구
        this.time.delayedCall(5000, () => {
            this.playerSpeed = 200;
        });
        
        this.checkEquilibrium();
    }

    hitInhibitor(player, inhibitor) {
        inhibitor.destroy();
        this.inhibitorSound.play();  // 억제제 효과음 재생
        
        // 억제제로 인한 속도 감소 (최소 50까지)
        this.currentSpeed = Math.max(50, this.currentSpeed - 40);
        
        // 플레이어 이동 속도 감소
        this.playerSpeed = 100;
        
        this.showMessage('억제제로 인한 반응 속도 감소!', '#ff0000');
        this.scoreText.setText(`점수: ${this.score -= 50}`);
        
        // 5초 후 플레이어 속도 원상복구
        this.time.delayedCall(5000, () => {
            this.playerSpeed = 200;
        });
        
        this.checkEquilibrium();
    }

    checkEquilibrium() {
        // 속도가 충분히 느려졌을 때 평형으로 판정 (초기 속도의 20% 이하)
        if (this.currentSpeed <= this.initialSpeed * 0.2) {
            this.endGame();
        }
    }

    showQuiz() {
        // 키보드 이벤트 리스너 제거
        this.input.keyboard.enabled = false;
        this.input.keyboard.removeAllListeners();
        this.input.keyboard.clearCaptures();
        
        // 게임 일시 정지
        this.physics.pause();
        
        // 배경 추가 (반투명 검은색)
        const bg = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        bg.setOrigin(0.5);
        
        // 퀴즈 데이터 확인
        console.log('Quiz data in showQuiz:', this.quizData);
        
        if (!this.quizData || !Array.isArray(this.quizData) || this.quizData.length === 0) {
            console.error('Quiz data is invalid or empty');
            this.showMessage('퀴즈 데이터를 로드할 수 없습니다.', '#ff0000');
            return;
        }
        
        const quiz = this.quizData[Math.floor(Math.random() * this.quizData.length)];
        console.log('Selected quiz:', quiz);
        
        // 문제 표시
        const quizText = this.add.text(400, 200, quiz.question, {
            fontSize: '32px',
            fill: '#fff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 },
            wordWrap: { width: 600 }
        }).setOrigin(0.5);
        
        // 안내 메시지
        const instructionText = this.add.text(400, 300, '마우스로 O 또는 X를 선택하세요', {
            fontSize: '24px',
            fill: '#ffff00',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // O 버튼 생성
        const oButton = this.add.rectangle(300, 400, 120, 60, 0x00ff00, 0.8);
        oButton.setInteractive({ useHandCursor: true });
        oButton.setStrokeStyle(3, 0xffffff);
        
        const oText = this.add.text(300, 400, 'O', {
            fontSize: '40px',
            fill: '#fff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // X 버튼 생성
        const xButton = this.add.rectangle(500, 400, 120, 60, 0xff0000, 0.8);
        xButton.setInteractive({ useHandCursor: true });
        xButton.setStrokeStyle(3, 0xffffff);
        
        const xText = this.add.text(500, 400, 'X', {
            fontSize: '40px',
            fill: '#fff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        
        // 버튼 호버 효과
        oButton.on('pointerover', () => {
            oButton.setFillStyle(0x00ff00, 1);
            oText.setStyle({ fontSize: '44px' });
        });
        
        oButton.on('pointerout', () => {
            oButton.setFillStyle(0x00ff00, 0.8);
            oText.setStyle({ fontSize: '40px' });
        });
        
        xButton.on('pointerover', () => {
            xButton.setFillStyle(0xff0000, 1);
            xText.setStyle({ fontSize: '44px' });
        });
        
        xButton.on('pointerout', () => {
            xButton.setFillStyle(0xff0000, 0.8);
            xText.setStyle({ fontSize: '40px' });
        });
        
        // 정답 처리 함수
        const handleAnswer = (answer) => {
            // 모든 요소 제거
            bg.destroy();
            oButton.destroy();
            oText.destroy();
            xButton.destroy();
            xText.destroy();
            quizText.destroy();
            instructionText.destroy();
            
            if (answer === quiz.answer) {
                this.quizCorrectSound.play();
                this.currentSpeed = Math.min(this.initialSpeed * 1.5, this.currentSpeed + 40);
                this.score += 200;
                this.scoreText.setText(`점수: ${this.score}`);
                this.showMessage('정답! 속도 증가!', '#00ff00');
            } else {
                this.quizWrongSound.play();
                this.currentSpeed = Math.max(50, this.currentSpeed - 30);
                this.score -= 100;
                this.scoreText.setText(`점수: ${this.score}`);
                this.showMessage('오답! 속도 감소...', '#ff0000');
            }
            
            // 게임 재개 전에 캐릭터의 현재 위치 저장
            const currentX = this.player.x;
            const currentY = this.player.y;
            
            // 게임 재개
            this.physics.resume();
            
            // 키보드 입력 완전히 초기화
            this.input.keyboard.removeAllListeners();
            this.input.keyboard.enabled = true;
            this.cursors = this.input.keyboard.createCursorKeys();
            
            // 캐릭터의 물리 엔진 완전 초기화
            this.player.body.reset(currentX, currentY);
            this.player.body.velocity.set(0, 0);
            this.player.body.acceleration.set(0, 0);
            this.player.body.stop();
            
            // 캐릭터의 물리 속성 설정
            this.player.body.setBounce(0, 0);
            this.player.body.setFriction(1, 1);
            this.player.body.setDrag(1000, 1000);
            this.player.body.setCollideWorldBounds(true);
            this.player.body.setImmovable(true);
            this.player.body.setGravity(0, 0);
            
            // 캐릭터 위치와 속도 설정
            this.player.setPosition(currentX, currentY);
            this.player.setVelocity(0, 0);
            this.playerSpeed = 200;
            
            // 게임 상태 초기화
            this.isQuizActive = false;
            this.physics.world.resume();
            
            // 방향키 입력 상태 초기화
            this.cursors.left.reset();
            this.cursors.right.reset();
            this.cursors.up.reset();
            this.cursors.down.reset();
            
            // 3프레임 동안 캐릭터의 움직임을 지속적으로 확인
            for (let i = 1; i <= 3; i++) {
                this.time.delayedCall(16 * i, () => {
                    if (this.player.body) {
                        this.player.body.velocity.set(0, 0);
                        this.player.body.acceleration.set(0, 0);
                        this.player.setPosition(currentX, currentY);
                    }
                });
            }
        };
        
        // 버튼 클릭 이벤트
        oButton.on('pointerdown', () => {
            handleAnswer('O');
        });
        
        xButton.on('pointerdown', () => {
            handleAnswer('X');
        });
    }

    endGame() {
        this.isGameOver = true;
        
        // 모든 아이템 제거
        this.obstacles.clear(true, true);
        this.catalysts.clear(true, true);
        this.inhibitors.clear(true, true);
        
        // 게임 종료 메시지 표시
        const gameOverText = this.add.text(400, 250, '화학 평형 도달!', {
            fontSize: '36px',
            fill: '#ffff00',
            backgroundColor: '#00000080',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        const equilibriumText = this.add.text(400, 320, 
            `최종 반응 속도: ${this.currentSpeed.toFixed(2)}\n` +
            `초기 속도의 ${((this.currentSpeed / this.initialSpeed) * 100).toFixed(1)}%`, {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        const scoreText = this.add.text(400, 380, 
            `최종 점수: ${this.score}\n` +
            `게임 시간: ${Math.floor(this.gameTime)}초`, {
            fontSize: '28px',
            fill: '#fff',
            backgroundColor: '#00000080',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // 선택상자 배경 추가
        const restartBox = this.add.rectangle(400, 450, 400, 60, 0x000000, 0.8);
        restartBox.setStrokeStyle(2, 0xffffff);
        restartBox.setInteractive();
        
        const restartText = this.add.text(400, 450, '여러분의 기록을 확인해 봅시다.', {
            fontSize: '24px',
            fill: '#ffff00',
            backgroundColor: '#00000080',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        
        // 호버 효과 추가
        restartBox.on('pointerover', () => {
            restartBox.setFillStyle(0x000000, 0.9);
            restartBox.setStrokeStyle(2, 0xffff00);
            restartText.setStyle({ fill: '#ffffff' });
        });
        
        restartBox.on('pointerout', () => {
            restartBox.setFillStyle(0x000000, 0.8);
            restartBox.setStrokeStyle(2, 0xffffff);
            restartText.setStyle({ fill: '#ffff00' });
        });
        
        // 다시 시작 버튼 클릭 이벤트
        restartBox.on('pointerdown', () => {
            this.scene.start('ScoreScene', { 
                score: this.score,
                nickname: this.gameData.nickname,
                level: this.gameData.key
            });
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [TitleScene, NicknameScene, LevelSelectScene, CharacterSelectScene, ScoreScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 0 },  // 중력 제거
            debug: false 
        }
    }
};

const game = new Phaser.Game(config);
