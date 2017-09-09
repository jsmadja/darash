#!/usr/bin/env node
const getPixels = require("get-pixels");
const savePixels = require("save-pixels");
const fs = require('fs');
const _ = require('lodash');

const TILE_SIZE = 16;
const RGB = 4;
const COLORS_MAX = 16;
const MASK = '255,0,255';

class Image {
    constructor(img) {
        _.assign(this, img);
    }

    get WIDTH() {
        return this.shape[0];
    }

    get HEIGHT() {
        return this.shape[1];
    }

    get pixels() {
        return this.data;
    }

    getPixelColorAt(offset) {
        return [this.pixels[offset], this.pixels[offset + 1], this.pixels[offset + 2]].join();
    }

    colorTileAt(x, y) {
        let offset = this.calcOffset(x, y);
        for (let i = 0; i < TILE_SIZE; i++) {
            for (let j = 0; j < TILE_SIZE * RGB; j += RGB) {
                this.pixels[offset + j] = 255;
                this.pixels[offset + j + 1] = 0;
                this.pixels[offset + j + 2] = 0;
                this.pixels[offset + j + 3] = 255;
            }
            offset += (this.WIDTH * RGB);
        }
    }

    isInvalidAt(x, y) {
        return this.getUniqColorCountAt(x, y) >= COLORS_MAX;
    }

    getUniqColorCountAt(x, y) {
        let offset = this.calcOffset(x, y);
        const usedColors = [];
        for (let i = 0; i < TILE_SIZE; i++) {
            for (let j = 0; j < TILE_SIZE * RGB; j += RGB) {
                const color = this.getPixelColorAt(offset + j);
                if (color !== MASK) {
                    usedColors.push(color);
                }
            }
            offset += (this.WIDTH * RGB);
        }
        return _.uniq(usedColors).length;
    }

    calcOffset(x, y) {
        return x * (TILE_SIZE * RGB) + y * (this.WIDTH * TILE_SIZE * RGB);
    }

    detectErrors() {
        for (let h = 0; h < (this.HEIGHT / TILE_SIZE); h++) {
            for (let w = 0; w < (this.WIDTH / TILE_SIZE); w++) {
                if (this.isInvalidAt(w, h)) {
                    this.colorTileAt(w, h);
                }
            }
        }
    }

}

const src = process.argv.slice(2)[0];
getPixels(src, (err, img) => {
    if (err) {
        throw new Error('Bad image path: ' + err.message);
    }
    new Image(img).detectErrors();
    savePixels(img, "png").pipe(fs.createWriteStream('analyzed_' + src));
});
