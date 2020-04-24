import React from 'react';
import {TileJSON} from "../utils/TilesUtils";


const Cesium = require('cesium');
const HEIGHT =  5280.0;
const WIDTH = 3768.0;

class Tile extends React.Component{
    public longitude: number;
    public latitude: number;
    public assetId: number;
    public active: boolean;
    public primitive: any;

    constructor(tile: TileJSON) {
        super(tile)
        this.longitude = tile.longitude;
        this.latitude = tile.latitude;
        this.assetId = tile.assetId;
        this.active = false;
        this.primitive = undefined;
    }

    getOffset(mainTile: Tile){
        if(this.assetId == mainTile.assetId)
            return new Cesium.Cartesian3(0, 0);

        let lat = this.latitude;
        let lon = this.longitude;

        let offsetN = HEIGHT;
        let offsetE = WIDTH;

        var offset;
        if(mainTile.latitude === lat) // west or east
        {
            if(mainTile.longitude < lon) {
                offsetE = offsetE * 1;
            }
            else if(mainTile.longitude > lon) {
                offsetE = offsetE * -1;
            }
            offset = new Cesium.Cartesian3(offsetE, 0);
        }
        else if(mainTile.longitude === lon) // north or south
        {
            if(mainTile.latitude < lat) {
                offsetN = offsetN * 1;
            }
            else if(mainTile.latitude > lat) {
                offsetN = offsetN * -1;
            }
            offset = new Cesium.Cartesian3(0, offsetN);
        }
        else { // sw, se. nw or ne
            if(mainTile.latitude > lat) {
                offsetN = offsetN * -1;
            }
            if(mainTile.longitude > lon) {
                offsetE = offsetE * -1;
            }
            offset = new Cesium.Cartesian3(offsetE, offsetN);
        }

        if(this.assetId == 92603){
            console.log(offset);
        }


        return offset;
    }
}

export default Tile;