import * as logger from 'js-logger';

/**
 * Preloader Phaser scene.
 *
 * This is where we load all the assets including images, sounds and all relevant data
 * before starting the game.
 */
export default class Preloader extends Phaser.Scene {

    preload (): void
    {
        logger.info('Preloader enter');

        this.load.atlas('assets',
            require('../../assets/images/breakout.png'),
            require('../../assets/data/breakout.json')
        );
    }

    create (): void
    {
        logger.info('Preloader leave');

        this.scene.start('game');
    }

}
