import React from 'react';
import {TileJSON} from "../utils/TilesUtils";

const Cesium = require('cesium');
const CORRECTION_FACTOR_POS = 1.32;
const CORRECTION_FACTOR_DEPTH = 20;
const HEIGHT =  5280.0;
const WIDTH = 3768.0;

const epsilon = 0.000001;

class Tile extends React.Component{
    public longitude: number;
    public latitude: number;
    public assetId: number;
    public active: boolean;
    public primitive: any;
    public coordsFixed: boolean;
    depth: number;

    constructor(tile: TileJSON) {
        super(tile)
        this.longitude = tile.longitude;
        this.latitude = tile.latitude;
        this.assetId = tile.assetId;
        this.active = false;
        this.coordsFixed = false;
        this.primitive = undefined;
        this.depth = -tile.depth + tile.height/2 - CORRECTION_FACTOR_DEPTH;

        console.log("assetid: " + this.assetId + "; depth:" + this.depth);
    }

    getOffset(mainTile: Tile){
        let lat = this.latitude;
        let lon = this.longitude;
        let offsetN = HEIGHT * CORRECTION_FACTOR_POS;
        let offsetE = WIDTH * CORRECTION_FACTOR_POS;
        let offset;

        if(Cesium.Math.equalsEpsilon(mainTile.latitude, lat, epsilon)) {// west or east
            if(mainTile.longitude > lon)
                offsetE = offsetE * -1;
            offset = new Cesium.Cartesian3(offsetE, 0);
        }
        else if(Cesium.Math.equalsEpsilon(mainTile.longitude, lon, epsilon)) {// north or south

            if(mainTile.latitude > lat)
                offsetN = offsetN * -1;
            offset = new Cesium.Cartesian3(0, offsetN);
        }
        else { // sw, se. nw or ne
            if(mainTile.latitude > lat)
                offsetN = offsetN * -1;
            if(mainTile.longitude > lon)
                offsetE = offsetE * -1;
            offset = new Cesium.Cartesian3(offsetE, offsetN);
        }

        this.coordsFixed = true;
        return offset;
    }
}

export default Tile;