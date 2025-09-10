// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Game extends Phaser.Scene {
  constructor() {
    // key of the scene
    // the key will be used to start the scene by other scenes
    super("game");
  }

  init() {
    // this is called before the scene is created
    // init variables
    // take data passed from other scenes
    // data object param {}
  }

  preload() {
    // load assets
    this.load.image("sky", "./public/assets/sky.png");
    this.load.image("ground", "./public/assets/platform.png");
    this.load.image("star", "./public/assets/star.png");
    this.load.image("bomb", "./public/assets/bomb.png");
    this.load.spritesheet("dude", "./public/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    // create game objects
    this.add.image(400, 300, "sky");

    this.platforms = this.physics.add.staticGroup();

    this.platforms.create(400, 568, "ground").setScale(2).refreshBody();

    this.platforms.create(600, 400, "ground");
    this.platforms.create(50, 250, "ground");
    this.platforms.create(750, 220, "ground");

    this.player = this.physics.add.sprite(100, 450, "dude");

    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });

    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.stars = this.physics.add.group({
      key: "star",
      repeat: 11,
      setXY: { x: 12, y: 0, stepX: 70 },
    });

    this.stars.children.iterate(function (child) {
      child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
    });

    this.bombs = this.physics.add.group();

    this.score = 0;
    this.gameOver = false;
    this.victory = false;

    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
      fontSize: "32px",
      fill: "#000",
    });

    this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    this.gameOverText = this.add
      .text(400, 300, "GAME OVER", {
        fontSize: "64px",
        fill: "#f00",
        fontStyle: "bold",
        align: "center",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.gameOverText.setVisible(false);

    this.victoryText = this.add
      .text(400, 300, "VICTORY", {
        fontSize: "64px",
        fill: "#0a0",
        fontStyle: "bold",
        align: "center",
        stroke: "#000",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.victoryText.setVisible(false);

    this.timeLeft = 30;
    this.timerText = this.add.text(784, 16, `Time: ${this.timeLeft}`, {
      fontSize: "32px",
      fill: "#000",
      align: "right",
    }).setOrigin(1, 0);

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onSecond,
      callbackScope: this,
      loop: true,
    });

    this.physics.add.collider(this.player, this.platforms);

    this.physics.add.collider(this.stars, this.platforms);

    this.physics.add.overlap(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );

    this.physics.add.collider(
      this.player,
      this.bombs,
      this.hitBomb,
      null,
      this
    );
  }

  update() {
    if (this.gameOver) {
      this.gameOverText.setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
        this.scene.restart();
      }
      return;
    }
    if (this.victory) {
      this.victoryText.setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
        this.scene.restart();
      }
      return;
    }
    // update game objects
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);

      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);

      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);

      this.player.anims.play("turn");
    }

    if (this.cursors.up.isDown && this.player.body.touching.down) {
      this.player.setVelocityY(-330);
    }

    this.timerText.setText(`Time: ${this.timeLeft}`);
  }

  collectStar(player, star) {
    star.disableBody(true, true);

    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.score >= 200 && !this.victory) {
      this.victory = true;
      this.physics.pause();
      this.player.anims.play("turn");
      this.victoryText.setVisible(true);
      this.timerEvent.remove(false);
      return;
    }

    if (this.stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      this.stars.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true);
      });

      var x =
        this.player.x < 400
          ? Phaser.Math.Between(400, 800)
          : Phaser.Math.Between(0, 400);

      var bomb = this.bombs.create(x, 16, "bomb");
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }

  onSecond() {
    if (!this.gameOver) {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.hitBomb();
      }
    }
  }

  hitBomb(player, bomb) {
    this.physics.pause();
    this.player.setTint(0xff0000);
    this.player.anims.play("turn");
    this.gameOver = true;
    this.gameOverText.setVisible(true);
    this.timerEvent.remove(false);
  }
}
