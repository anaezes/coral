import Tile from "./Tile";
import {TileJSON} from "../utils/TilesUtils";

// Data
import tiles from '../../data/coordTiles.json';

const Cesium = require('cesium');
const DEPTH = 0.0;


class BathymetryComponent {
    public tiles: Array<Tile> = new Array<Tile>();
    private mainTile: any;
    private ENU = new Cesium.Matrix4();

    constructor() {
        let t : Array<TileJSON> = JSON.parse(JSON.stringify(tiles.tiles));
        for (let i = 0; i < t.length; i++) {
            this.tiles.push( new Tile(t[i]));
        }
    }

    update(auvPosition, viewer, terrainExaggeration){
        this.findMainTile(auvPosition, viewer);

        //let auvPosition;
        let dist, assetId;
        //let auvPosition = this.entityAUV.position.getValue(this.CesiumViewer.clock.currentTime);

        // Render neighbors
        this.tiles.forEach(tile => {
            assetId = tile.assetId;
            dist = Cesium.Cartesian3.distance(auvPosition, new Cesium.Cartesian3.fromDegrees(tile.longitude, tile.latitude)) / 1000;

            if (dist <= 5.0) {
                if(tile.primitive === undefined) {
                    this.renderTile(tile, viewer, terrainExaggeration);
                }
            } else {
                if(tile.active)
                    this.removeTile(tile, viewer)
            }
        });
    }

    private findMainTile(auvPosition, viewer){
        let dist, assetId;
        //let auvPosition = this.entityAUV.position.getValue(this.CesiumViewer.clock.currentTime);

        let minDist = Number.MAX_VALUE;

        // Find main tile
        this.tiles.forEach(tile => {
            assetId = tile.assetId;
            dist = Cesium.Cartesian3.distance(auvPosition, new Cesium.Cartesian3.fromDegrees(tile.longitude, tile.latitude))/1000;

            if(dist < minDist) {
                minDist = dist;
                this.mainTile = tile;
            }
        });

        var position = Cesium.Cartesian3.fromDegrees(this.mainTile.longitude,this.mainTile.latitude, DEPTH);
        Cesium.Transforms.eastNorthUpToFixedFrame(position, viewer.scene.globe.ellipsoid, this.ENU);
    }

    renderTile(tile: Tile, viewer, terrainExaggeration){
        let cartesian;
        let offset;

        if(tile.coordsFixed || tile.assetId === this.mainTile.assetId){
            cartesian = Cesium.Cartesian3.fromDegrees(tile.longitude, tile.latitude, DEPTH);
        }
        else {
            offset = tile.getOffset(this.mainTile);
            let finalPos = Cesium.Matrix4.multiplyByPoint(this.ENU, offset, new Cesium.Cartesian3());
            let result = Cesium.Cartographic.fromCartesian(finalPos, Cesium.Ellipsoid.WGS84);
            cartesian = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(result.longitude),
                Cesium.Math.toDegrees(result.latitude), DEPTH);
            tile.longitude = Cesium.Math.toDegrees(result.longitude);
            tile.latitude = Cesium.Math.toDegrees(result.latitude);
        }

        var transform = new Cesium.Matrix4();
        var translation = Cesium.Transforms.eastNorthUpToFixedFrame(cartesian);
        var scale = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(1,1, terrainExaggeration), undefined);
        Cesium.Matrix4.multiply(translation, scale, transform);
        var rotation = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.IDENTITY, undefined, undefined);
        Cesium.Matrix4.multiply(transform, rotation, transform);

        var tileset = new Cesium.Cesium3DTileset({
            url: Cesium.IonResource.fromAssetId(tile.assetId),
            dynamicScreenSpaceError : true,
            dynamicScreenSpaceErrorDensity : 0.00278,
            dynamicScreenSpaceErrorFactor : 4.0,
            dynamicScreenSpaceErrorHeightFalloff : 0.25,

        });

        viewer.scene.primitives.add(tileset);

        tileset.readyPromise.then(function(){
            tileset._root.transform = Cesium.Matrix4.IDENTITY;
            tileset.modelMatrix = transform;
            tileset.style = new Cesium.Cesium3DTileStyle({
                color : "color('#3e3e3e', 1)"
            });
        });

        tile.active = true;
        tile.primitive = tileset;

        console.log("Render: " + tile.assetId);
    }

    removeTile(tile: Tile, viewer){
        console.log("remove: " + tile.assetId);
        if(viewer.scene.primitives.contains(tile.primitive))
            viewer.scene.primitives.remove(tile.primitive);
        tile.active = false;
        tile.primitive = undefined;
    }

    onTerrainExaggeration(viewer, terrainExaggeration) {
        this.tiles.forEach(tile => {
            if(tile.active) {
                this.removeTile(tile, viewer);
                this.renderTile(tile, viewer, terrainExaggeration);
            }
        });
    }
}

export default  BathymetryComponent