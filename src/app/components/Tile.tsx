import React from 'react';
import {TileJSON} from "../utils/TilesUtils";

const Cesium = require('cesium');
const CORRECTION_FACTOR = 1.3;
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

    //public coords: Cesium.Cartesian3;

    constructor(tile: TileJSON) {
        super(tile)
        this.longitude = tile.longitude;
        this.latitude = tile.latitude;
        this.assetId = tile.assetId;
        this.active = false;
        this.coordsFixed = false;
        this.primitive = undefined;
    }

    getOffset(mainTile: Tile){
        let lat = this.latitude;
        let lon = this.longitude;
        let offsetN = HEIGHT * CORRECTION_FACTOR;
        let offsetE = WIDTH * CORRECTION_FACTOR;
        var offset;

        if(Cesium.Math.equalsEpsilon(mainTile.latitude, lat, epsilon)) // west or east
        {
            if(mainTile.longitude > lon) {
                offsetE = offsetE * -1;
            }
            offset = new Cesium.Cartesian3(offsetE, 0);

            console.log("W/E: " + this.assetId + " ;; " + mainTile.longitude + " ;; " + offset);
        }
        else if(Cesium.Math.equalsEpsilon(mainTile.longitude, lon, epsilon)) // north or south
        {
            if(mainTile.latitude > lat) {
                offsetN = offsetN * -1;
            }
            offset = new Cesium.Cartesian3(0, offsetN);

            console.log( "N/S: " + this.assetId + " ;; " + mainTile.latitude + " ;; " + offset);
        }
        else { // sw, se. nw or ne

            if(mainTile.latitude > lat) {
                offsetN = offsetN * -1;
            }
            if(mainTile.longitude > lon) {
                offsetE = offsetE * -1;
            }
            offset = new Cesium.Cartesian3(offsetE, offsetN);

            console.log("D: " + this.assetId + " ;; " + mainTile.assetId + " ;; " + offset);
        }

        this.coordsFixed = true;

        return offset;
    }
}

export default Tile;