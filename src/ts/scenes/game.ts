import * as logger from 'js-logger';
import _forEach from 'lodash-es/forEach';
import _includes from 'lodash-es/includes';
import _map from 'lodash-es/map';
import _pull from 'lodash-es/pull';
import Vector2 = Phaser.Math.Vector2;



/**
 * Game Phaser scene.
 *
 * This is where all the logic for your game goes.
 */
export default class Game extends Phaser.Scene {

    bricks: Phaser.Physics.Matter.Image[];
    ball: Phaser.Physics.Matter.Image;
    paddle: Phaser.Physics.Matter.Image;

    hero: Phaser.Physics.Matter.Sprite;

    highlightGraphic: Phaser.GameObjects.Graphics;

    repairData: {
        x: number;
        y: number;
        progress: 0;
        brick: Phaser.Physics.Matter.Image;
    } = {
        x: -1,
        y: -1,
        progress: 0,
        brick: null
    };

    keys: {
        left: Phaser.Input.Keyboard.Key;
        right: Phaser.Input.Keyboard.Key;
        up: Phaser.Input.Keyboard.Key;
        down: Phaser.Input.Keyboard.Key;
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
    };

    create (): void
    {
        logger.info('Game enter');

        this.keys = {
            A: this.input.keyboard.addKey('A'),
            D: this.input.keyboard.addKey('D'),
            W: this.input.keyboard.addKey('W'),
            S: this.input.keyboard.addKey('S'),
            left: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            up: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN)
        };

        //  Enable world bounds, but disable the floor

        const left = this.matter.add.image(-16, 300, 'assets', 'silver2', {
            isStatic: true,
        });
        left.displayWidth = 32;
        left.displayHeight = 600;
        left.setBounce(1);

        const right = this.matter.add.image(816, 300, 'assets', 'silver2', {
            isStatic: true,
        });
        right.displayWidth = 32;
        right.displayHeight = 600;

        const top = this.matter.add.image(400, -16, 'assets', 'silver2', {
            isStatic: true,
        });
        top.displayHeight = 32;
        top.displayWidth = 800;

        this.cameras.main.setZoom(0.8);

        // bricks

        this.bricks = [];

        _forEach([ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ],
            (frame: string, i: number) =>
            {
                for(let j=0; j<10; j++)
                {
                    // background
                    const bgBrick = this.add.image(
                        112 + j * 64,
                        100 + i * 32,
                        'assets',
                        frame
                    );
                    bgBrick.alpha = 0.3;
                    bgBrick.displayHeight = 32;
                    bgBrick.displayWidth = 64;

                    // physics

                    const physicsBrick = this.matter.add.image(
                        bgBrick.x,
                        bgBrick.y,
                        'assets',
                        frame,
                        {
                            isStatic: true
                        }
                    );
                    physicsBrick.displayHeight = 32;
                    physicsBrick.displayWidth = 64;

                    this.bricks.push(physicsBrick);
                }
            }
        );

        //  Create the bricks in a 10x6 grid
        /*this.bricks = this.physics.add.staticGroup({
            key: 'assets', frame: [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ],
            frameQuantity: 10,
            gridAlign: { width: 10, height: 6, cellWidth: 64, cellHeight: 32, x: 112, y: 100 }
        });*/

        /*this.ball = this.physics.add.image(400, 500, 'assets', 'ball1')
            .setCollideWorldBounds(true)
            .setBounce(1)
            .setCircle(11)
            .setData('onPaddle', true);*/

        this.ball = this.matter.add.image(400, 500, 'assets', 'ball1',);
        this.ball.setCircle(11, {
            inertia: Infinity
        });
        this.ball.setFriction(0, 0, 0);
        this.ball.setBounce(1);

        /*this.paddle = this.physics.add.image(400, 550, 'assets', 'paddle1')
            .setImmovable();*/

        this.paddle = this.matter.add.image(400, 550, 'assets', 'paddle1', {
            isStatic: true
        });

        this.highlightGraphic = this.add.graphics({
            lineStyle: {
                color: 0x00ff00,
                width: 2,
                alpha: 1
            },
            fillStyle: {
                color: 0x00ff00,
                alpha: 1
            }
        });

        this.hero = this.matter.add.sprite(200, 550, 'assets', 'yellow2', {
            // isStatic: true
        });
        this.hero.setFriction(0.2, 0.2, 0);
        this.hero.displayWidth = this.hero.displayHeight = 30;
        this.hero.setDepth(10);

        /*this.hero = this.physics.add.sprite(
            Phaser.Math.Between(100, 700),
            350,
            'assets', 'ball2'
        )
            .setScale(2)
            .setCollideWorldBounds(true)
            .setMass(this.ball.body.mass * 1.5)
            .setCircle(11)
            .setBounce(0.2);*/

        //  Our colliders
        /*this.physics.add.collider(this.ball, this.bricks, this.hitBrick, null, this);
        this.physics.add.collider(this.ball, this.paddle, this.hitPaddle, null, this);
        this.physics.add.collider(this.ball, this.hero, this.resetLevel, null, this);
        this.physics.add.collider(this.bricks, this.hero);*/

        this.matter.world.on('collisionstart',  (event: any) =>
        {
            const pairs = event.pairs;

            for (let i = 0; i < pairs.length; i++)
            {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;

                // handle bricks

                if((bodyA === this.ball.body && _includes(_map(this.bricks, 'body'), bodyB)) ||
                    (_includes(_map(this.bricks, 'body'), bodyA) && bodyB === this.ball.body))
                {
                    const brick = (bodyA === this.ball.body ?
                        bodyB.gameObject : bodyA.gameObject) as Phaser.Physics.Matter.Image;

                    _pull(this.bricks, brick);
                    brick.destroy();
                }

                // handle paddle

                if((bodyA === this.ball.body && bodyB === this.paddle.body) ||
                    (bodyA === this.paddle.body && bodyB === this.ball.body))
                {
                    if (this.ball.x != this.paddle.x)
                    {
                        const diff = this.ball.x - this.paddle.x;
                        this.ball.setVelocityX(0.15 * diff);
                    }
                    else
                    {
                        //  Ball is perfectly in the middle
                        //  Add a little random X to stop it bouncing straight up!
                        this.ball.setVelocityX(2 + Math.random() * 8);
                    }
                }

                // walls

                if((bodyA === this.ball.body && _includes(_map([left, top, right], 'body'), bodyB)) ||
                    (_includes(_map([left, top, right], 'body'), bodyA) && bodyB === this.ball.body))
                {
                    const wall = (bodyA === this.ball.body ?
                        bodyB.gameObject : bodyA.gameObject) as Phaser.Physics.Matter.Image;

                    console.log(this.ball);

                    if(wall === top)
                    {
                        this.ball.setVelocityY(-(<any>this.ball.body).velocity.y);
                    }
                    else
                    {
                        this.ball.setVelocityX(-(<any>this.ball.body).velocity.x);
                    }

                    pairs[i].isActive = false;
                }

                // hero

                if(this.repairData.brick && (
                    (bodyA === this.hero.body && bodyB === this.repairData.brick.body) ||
                    (bodyA === this.repairData.brick.body && bodyB === this.hero.body)
                ))
                {
                    pairs[i].isActive = false;
                }

                if((bodyA === this.ball.body && bodyB === this.hero.body) ||
                    (bodyA === this.hero.body && bodyB === this.ball.body))
                {
                    pairs[i].isActive = false;
                    this.bricks.length = 0;
                }

                // TODO game over
            }


            // pairs[i].isActive = false;
        });

        /*this.matter.world.on('collisionend',  (event: any) =>
        {
            const pairs = event.pairs;

            for (let i = 0; i < pairs.length; i++)
            {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;

                if(this.repairData.brick && (
                    (bodyA === this.hero.body && bodyB === this.repairData.brick.body) ||
                    (bodyA === this.repairData.brick.body && bodyB === this.hero.body)
                ))
                {
                    pairs[i].isActive = false;
                    this.repairData.brick = null;
                }
            }
        });*/

        const space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        space.on('down', () =>
        {
            if(this.hero.y > 650)
            {
                this.scene.restart();
                return;
            }

            this.repairData.progress += 0.11;

            console.log(this.repairData.progress);
            if(this.repairData.progress >= 1)
            {
                this.repairData.progress = 0;

                const physicsBrick = this.matter.add.image(
                    this.repairData.x * 64 + 112,
                    this.repairData.y * 32 + 100,
                    'assets',
                    [ 'blue1', 'red1', 'green1', 'yellow1', 'silver1', 'purple1' ][this.repairData.y],
                    {
                        isStatic: true
                    }
                );
                physicsBrick.displayHeight = 32;
                physicsBrick.displayWidth = 64;

                this.bricks.push(physicsBrick);

                this.repairData.brick = physicsBrick;
            }
        });

        //  Input events
        /*this.input.on('pointermove', (pointer: Phaser.Input.Pointer) =>
        {
            //  Keep the paddle within the game
            this.paddle.x = Phaser.Math.Clamp(pointer.x, 52, 748);

            if (this.ball.getData('onPaddle'))
            {
                this.ball.x = this.paddle.x;
            }

        }, this);

        this.input.on('pointerup',() =>
        {

            if (this.ball.getData('onPaddle'))
            {
                this.ball.setVelocity(-75, -300);
                this.ball.setData('onPaddle', false);
            }

        }, this);*/

        /*this.input.keyboard.addKey('W').on('down', () =>
        {
            this.hero.setVelocityY(-500);
        });
        this.input.keyboard.addKey('W').on('up', () =>
        {
            this.hero.setVelocityY(0);
        });

        this.input.keyboard.addKey('S').on('down', () =>
        {
            this.hero.setVelocityY(500);
        });
        this.input.keyboard.addKey('S').on('up', () =>
        {
            this.hero.setVelocityY(0);
        });

        this.input.keyboard.addKey('A').on('down', () =>
        {
            this.hero.setVelocityX(-500);
        });
        this.input.keyboard.addKey('A').on('up', () =>
        {
            this.hero.setVelocityX(0);
        });

        this.input.keyboard.addKey('D').on('down', () =>
        {
            this.hero.setVelocityX(500);
        });
        this.input.keyboard.addKey('D').on('up', () =>
        {
            this.hero.setVelocityX(0);
        });
*/
        this.resetBall();
    }

    /*hitBrick (
        ball: Phaser.Physics.Arcade.Image,
        brick: Phaser.Physics.Arcade.Image
    ): void
    {
        brick.disableBody(true, true);

        if (this.bricks.countActive() === 0)
        {
            this.resetLevel();
        }
    }*/

    resetBall (): void
    {
        this.ball.setVelocity(0);
        this.ball.setPosition(this.paddle.x, 500);
        this.ball.setData('onPaddle', true);

        this.time.delayedCall(1000, () =>
        {
            const xVel = 0.75 + Math.random() / 2 * (Math.random() < 0.5 ? 1 : -1);
            this.ball.setVelocity(xVel, -5);
            this.ball.setData('onPaddle', false);

        }, null, this);
    }

    /*resetLevel (): void
    {
        this.resetBall();

        this.bricks.children.each((brick: Phaser.Physics.Arcade.Image) =>
        {
            brick.enableBody(false, 0, 0, true, true);
        });
    }*/

    hitPaddle (
        ball: Phaser.Physics.Arcade.Image,
        paddle: Phaser.Physics.Arcade.Image
    ): void
    {
        let diff = 0;

        if (ball.x < paddle.x)
        {
            //  Ball is on the left-hand side of the paddle
            diff = paddle.x - ball.x;
            ball.setVelocityX(-10 * diff);
        }
        else if (ball.x > paddle.x)
        {
            //  Ball is on the right-hand side of the paddle
            diff = ball.x -paddle.x;
            ball.setVelocityX(10 * diff);
        }
        else
        {
            //  Ball is perfectly in the middle
            //  Add a little random X to stop it bouncing straight up!
            ball.setVelocityX(2 + Math.random() * 8);
        }
    }

    update (): void
    {
        if (this.ball.y > 600 || this.ball.x < 0 || this.ball.x > 800)
        {
            this.resetBall();
        }

        this.paddle.x -= (this.paddle.x - this.ball.x) / 10;

        if(this.hero)
        {
            if (this.keys.left.isDown || this.keys.A.isDown)
            {
                this.hero.setVelocityX(-4);
            }
            if (this.keys.right.isDown || this.keys.D.isDown)
            {
                this.hero.setVelocityX(4);
            }

            if (this.keys.up.isDown || this.keys.W.isDown)
            {
                this.hero.setVelocityY(-4);
            }
            if (this.keys.down.isDown || this.keys.S.isDown)
            {
                this.hero.setVelocityY(4);
            }

            this.highlightGraphic.clear();

            const startX = 112 - 32;
            const startY = 100 - 16;

            if (this.hero.x > startX &&
                this.hero.x < startX + 10 * 64
                && this.hero.y > startY
                && this.hero.y < startY + 6 * 32)
            {
                const x = Math.floor((this.hero.x - startX) / 64);
                const y = Math.floor((this.hero.y - startY) / 32);

                if (x !== this.repairData.x || y !== this.repairData.y)
                {
                    this.repairData.progress = 0;
                }

                this.repairData.x = x;
                this.repairData.y = y;

                this.highlightGraphic.strokeRect(
                    x * 64 + startX,
                    y * 32 + startY,
                    64, 32
                );

                this.highlightGraphic.fillRect(
                    x * 64 + startX,
                    y * 32 + startY,
                    64 * this.repairData.progress, 32
                );
            }
            else
            {
                this.repairData.x = -1;
                this.repairData.y = -1;
                this.repairData.progress = 0;
            }

            if (this.repairData.brick)
            {
                if (Math.abs(this.repairData.brick.x - this.hero.x) > 42 ||
                    Math.abs(this.repairData.brick.y - this.hero.y) > 24)
                {
                    this.repairData.brick = null;
                }
            }

        }

        if(this.bricks.length === 0)
        {
            this.bricks.push(null);
            this.gameOver();
        }
    }

    gameOver ()
    {
        const pos = new Vector2(this.hero.x, this.hero.y);

        this.hero.destroy();
        this.hero = null;

        const deadHero = this.add.sprite(pos.x, pos.y, 'assets', 'yellow2');
        deadHero.displayWidth = deadHero.displayHeight = 30;
        deadHero.setDepth(10);

        this.ball.setVelocity(0);

        this.tweens.add({
            targets: deadHero,
            y: { from: pos.y, to: pos.y + 1000 },
            // alpha: { start: 0, to: 1 },
            // alpha: 1,
            // alpha: '+=1',
            ease: 'Back.easeIn',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
            duration: 1500
        });
    }

    hitHero (
        ball: Phaser.Physics.Arcade.Image,
        hero: Phaser.Physics.Arcade.Sprite
    )
    {
        /*const angle = Math.atan2(ball.y - hero.y, ball.x - hero.x);
        const vel = ball.body.velocity.length() * 2;

        ball.setVelocity(
            -Math.sin(angle) * vel,
            -Math.cos(angle) * vel
        );

        hero.setVelocity(
            Math.sin(angle) * vel,
            Math.cos(angle) * vel
        );*/
        // this.ball.body.velocity.scale(2);
    }
}
