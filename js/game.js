// Game Scene
class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.ojisanFaces = ['👨‍🦳', '👨‍🦰', '👨‍🦱', '🧔‍♂️', '👴'];
    this.clearComments = [
      '濡れおじさんの出来上がり。',
      'おじさんの心の火は消えない',
      '街から歩きタバコおじが消えた日',
      'あなたが街のヒーロー',
      'いろんな意味で煙たい',
      '駆除完了'
    ];
    this.score = 0;
    this.timeLeft = 30;
    this.stage = 1;
    this.gameOver = false;
  }

  create() {
    // UI Text
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontSize: '24px',
      fill: '#fff',
      fontStyle: 'bold',
    });

    this.timeText = this.add.text(700, 20, 'Time: 30', {
      fontSize: '24px',
      fill: '#fff',
      fontStyle: 'bold',
    }).setOrigin(1, 0);

    this.stageText = this.add.text(400, 20, 'Stage: 1', {
      fontSize: '24px',
      fill: '#fff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    // Player (👩‍💼) - Fixed at bottom center
    this.player = this.add.text(400, 550, '👩‍💼', {
      fontSize: '60px',
    }).setOrigin(0.5, 0.5);

    // Ojisan (Random face)
    const randomOjisan = Phaser.Utils.Array.GetRandom(this.ojisanFaces);
    this.ojisan = this.add.text(
      Phaser.Math.Between(100, 700),
      100,
      randomOjisan,
      { fontSize: '60px' }
    ).setOrigin(0.5, 0.5);

    // Cigarette (🚬) - Near ojisan
    this.cigarette = this.add.text(this.ojisan.x + 30, this.ojisan.y - 40, '🚬', {
      fontSize: '30px',
    }).setOrigin(0.5, 0.5);

    // Water bullets group
    this.waterBullets = this.physics.add.group();
    this.physics.world.gravity.y = 0;

    // Ojisan velocity
    this.ojisanVelocityX = Phaser.Math.Between(-50, 50);
    this.ojisanVelocityY = Phaser.Math.Between(-50, 50);

    // Graphics for aiming line
    this.aimGraphics = this.make.graphics({ x: 0, y: 0, add: false });

    // Input: Touch or Mouse
    this.input.on('pointermove', (pointer) => {
      // Aim line (visual feedback)
      if (!this.gameOver) {
        this.aimX = pointer.x;
        this.aimY = pointer.y;
        this.drawAimLine();
      }
    });

    this.input.on('pointerdown', (pointer) => {
      if (!this.gameOver) {
        this.shootWater(pointer.x, pointer.y);
      }
    });

    // Timer
    this.timerEvent = this.time.delayedCall(0, () => {});
    this.timerInterval = setInterval(() => {
      if (this.gameOver) return;
      this.timeLeft--;
      this.timeText.setText(`Time: ${this.timeLeft}`);

      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.endGame(false);
      }
    }, 1000);

    // Collision: Water vs Cigarette
    this.physics.add.overlap(
      this.waterBullets,
      this.cigarette,
      () => this.cigaretteHit(),
      null,
      this
    );
  }

  update() {
    if (this.gameOver) return;

    // Update cigarette position with ojisan
    this.cigarette.x = this.ojisan.x + 30;
    this.cigarette.y = this.ojisan.y - 40;

    // Move ojisan
    this.ojisan.x += this.ojisanVelocityX * 0.016; // deltaTime
    this.ojisan.y += this.ojisanVelocityY * 0.016;

    // Bounce ojisan off walls
    if (this.ojisan.x < 50 || this.ojisan.x > 750) {
      this.ojisanVelocityX *= -1;
      this.ojisan.x = Phaser.Math.Clamp(this.ojisan.x, 50, 750);
    }

    if (this.ojisan.y < 50 || this.ojisan.y > 400) {
      this.ojisanVelocityY *= -1;
      this.ojisan.y = Phaser.Math.Clamp(this.ojisan.y, 50, 400);
    }

    // Remove off-screen water bullets
    this.waterBullets.children.entries.forEach((bullet) => {
      if (
        bullet.x < 0 ||
        bullet.x > 800 ||
        bullet.y < 0 ||
        bullet.y > 600
      ) {
        bullet.destroy();
      }
    });
  }

  drawAimLine() {
    this.aimGraphics.clear();
    this.aimGraphics.lineStyle(2, 0xffff00, 0.5);
    this.aimGraphics.lineBetween(400, 550, this.aimX, this.aimY);
    this.aimGraphics.setDepth(10);
  }

  shootWater(targetX, targetY) {
    const angle = Phaser.Math.Angle.Between(400, 550, targetX, targetY);
    const speed = 400;

    const water = this.add.text(400, 550, '💧', {
      fontSize: '20px',
    });

    this.physics.add.existing(water);
    water.body.setAllowGravity(false);
    water.body.setGravity(0, 0);
    water.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    water.body.setBounce(0, 0);
    water.body.setCollideWorldBounds(false);

    this.waterBullets.add(water);

    // SE：発射音
    this.playSFX('shoot');
  }

  cigaretteHit() {
    // Cigarette消える
    const randomComment = Phaser.Utils.Array.GetRandom(this.clearComments);
    const commentText = this.add.text(this.cigarette.x, this.cigarette.y, randomComment, {
      fontSize: '24px',
      fill: '#fff',
      backgroundColor: '#000',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5, 0.5);

    // おじさんの絵文字を追加
    const ojisanEmoji = this.add.text(this.cigarette.x, this.cigarette.y - 50, this.ojisan.text, {
      fontSize: '40px',
    }).setOrigin(0.5, 0.5);

    // SE：成功音
    this.playSFX('success');

    // Score calculation
    const bonus = Math.max(0, this.timeLeft * 10);
    const stageBonus = this.stage * 100;
    this.score += stageBonus + bonus;
    this.scoreText.setText(`Score: ${this.score}`);

    // Next stage
    this.stage++;
    this.stageText.setText(`Stage: ${this.stage}`);

    // Increase difficulty
    this.ojisanVelocityX *= 1.2;
    this.ojisanVelocityY *= 1.2;
    this.timeLeft = Math.max(10, 30 - this.stage * 2);
    this.timeText.setText(`Time: ${this.timeLeft}`);

    // Reset ojisan
    const randomOjisan = Phaser.Utils.Array.GetRandom(this.ojisanFaces);
    this.ojisan.setText(randomOjisan);
    this.ojisan.x = Phaser.Math.Between(100, 700);
    this.ojisan.y = Phaser.Math.Between(50, 200);

    // コメントを一定時間後に消す
    this.time.delayedCall(2000, () => {
      commentText.destroy();
      ojisanEmoji.destroy();
    });
  }

  playSFX(type) {
    const audioContext = this.sound.context;
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    if (type === 'shoot') {
      oscillator.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'success') {
      oscillator.frequency.value = 1200;
      gain.gain.setValueAtTime(0.15, audioContext.currentTime);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }

  endGame(won) {
    this.gameOver = true;
    clearInterval(this.timerInterval);

    const resultText = won ? 'CLEAR!' : 'TIME UP!';
    const resultColor = won ? '#00ff00' : '#ff0000';

    this.add.text(400, 200, resultText, {
      fontSize: '60px',
      fill: resultColor,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.add.text(400, 300, `Final Score: ${this.score}`, {
      fontSize: '32px',
      fill: '#fff',
    }).setOrigin(0.5, 0.5);

    const restartText = this.add.text(400, 420, 'Tap to Restart', {
      fontSize: '24px',
      fill: '#fff',
      backgroundColor: '#333',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5, 0.5).setInteractive();

    restartText.on('pointerdown', () => {
      this.scene.restart();
    });
  }
}

// Game Configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: GameScene,
};

const game = new Phaser.Game(config);
