import React from 'react';
import DatGui, {DatSelect, DatNumber, DatBoolean} from "react-dat-gui";
import {AuvJSON} from './utils/AUVUtils';
import { TileJSON } from './utils/TilesUtils';
import Auv from "./components/Auv";
import Tile from "./components/Tile";
import tiles from './../data/coordTiles2.json';
import WaterEffect1 from "./components/WaterEffect1";
import WaterEffect2 from "./components/WaterEffect2";
import TopView from "./components/TopView";

const Cesium = require('cesium');

const DEPTH = 0.0;
const HEIGHT = 10.0;
const url =  'https://ripples.lsts.pt/soi';


interface state {
    isLoading: Boolean,
    data: Array<string>,
    error: Boolean,
    options: MenuOptions
}

interface MenuOptions {
    auvActive: string,
    terrainExaggeration: number,
    waterEffects: boolean
}


class App extends React.Component<{}, state> {
    private first: boolean = true;
    private options: Array<string> = [];
    private auvs: Array<AuvJSON> = [];
    private mainTile: any;
    private tiles: Array<Tile> = new Array<Tile>();
    private container: any;
    private CesiumViewer: any;
    private startTime: any;
    private stopTime: any;
    private ENU: Cesium.Matrix4 = new Cesium.Matrix4();
    private entityAUV: Cesium.Entity = new Cesium.Entity();
    private auv: any;
    private isReady: boolean = false;

    state = {
        isLoading: true,
        data: [],
        error: false,
        options: {
            auvActive: '',
            terrainExaggeration: 4,
            waterEffects: false
        }
    };
    private topView: any;


    async componentDidMount() {
        fetch(url)
            .then(response => response.json())
            .then(data =>
                this.setState({
                    data: data,
                    isLoading: false,
                    error: false
                })
            )
            .catch(error => this.setState({error, isLoading: false}));
    }

    // Update current state with changes from controls
    handleUpdate = newData =>
        this.updateRender(newData);


    render() {
        const {isLoading, data, options} = this.state;

        if (!isLoading && this.first) {
            let auvs : Array<AuvJSON> = JSON.parse(JSON.stringify(data));
            this.auvs = auvs; //copy

            for (let i = 0; i < this.auvs.length; i++) {
                this.options.push(this.auvs[i].name);
            }

            if(this.CesiumViewer == null)
                this.initCesium();

            let t : Array<TileJSON> = JSON.parse(JSON.stringify(tiles.tiles));
            for (let i = 0; i < t.length; i++) {
                this.tiles.push( new Tile(t[i]));
            }

            this.createPins();
            this.first = false;
            this.topView = new TopView(this.props);
        }


        return (
            <div>
                <div id="Container" ref={element => this.container = element}/>
                {this.isReady && options.waterEffects? <div> <WaterEffect1/> <WaterEffect2/> </div> : <div/>}
                <DatGui data={options} onUpdate={this.handleUpdate}>
                    <DatNumber path='terrainExaggeration' label='Terrain exageration' min={1} max={10} step={1} />
                    <DatSelect
                        label="Available AUV's"
                        path="auvActive"
                        options={this.options}/>
                    <DatBoolean path='waterEffects' label='Water effects' />
                </DatGui>
                <TopView ref={element => this.topView = element}/>/>
            </div>
        );
    }

    //<!--div id="ThreeContainer" ref={element => this.water = element}/-->


    initCesium() {
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkOGVmYTBmMC1jMDJjLTQ5' +
            'MTQtYTQwZi1jNjVkOTcyYTQ0MjEiLCJpZCI6MjMxNTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODI4MTE0NjB9.' +
            '8bD2ihWXbQPEjqO6CN79XDZ-oTrY7h1S5o8uiT_tvuU';

        // Init scene
        let globe = new Cesium.Globe();
        globe.show = true;

        let skyAtmosphere = new Cesium.SkyAtmosphere();
        skyAtmosphere.show = true;
        skyAtmosphere.brightnessShift = -1;

        this.CesiumViewer = new Cesium.Viewer('Container', {
            animation: true,
            scene3DOnly: true,
            globe: globe,
            skyBox: false,
            vrButton: false,
            shadows: true,
            skyAtmosphere: false,
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            fullscreenButton: true,
            infoBox: false,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: true,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            shouldAnimate: false, // Enable animations
            requestRenderMode: true
        });

        this.CesiumViewer.scene.globe.enableLighting = true;
        //this.CesiumViewer.extend(Cesium.viewerCesiumInspectorMixin);
        //this.CesiumViewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);

        this.CesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;
        //this.CesiumViewer.scene.backgroundColor = Cesium.Color.AQUAMARINE;

        //Set the random number seed for consistent results.
        Cesium.Math.setRandomNumberSeed(3);
        this.ENU = new Cesium.Matrix4();

        //this.CesiumViewer.scene.fog.enabled = true;
        //this.CesiumViewer.scene.fog.density = 2.0e-4;

        this.CesiumViewer.animation.viewModel.setShuttleRingTicks([0, 1500]);
    }

    getBoundsTime() {
        //Set bounds of our simulation time
        this.startTime = Cesium.JulianDate.fromDate(new Date(this.auv.startTime));
        this.stopTime = Cesium.JulianDate.fromDate(new Date(this.auv.stopTime));

        //Make sure viewer is at the desired time.
        this.CesiumViewer.clock.startTime = this.startTime.clone();
        this.CesiumViewer.clock.stopTime = this.stopTime.clone();
        this.CesiumViewer.clock.currentTime = this.startTime.clone();
        this.CesiumViewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
        this.CesiumViewer.clock.multiplier = 10;

        //Set timeline to simulation bounds
        this.CesiumViewer.timeline.zoomTo(this.startTime, this.stopTime);
    }

    createAuvModel() {
        let longitude = this.auv.longitude;
        let latitude = this.auv.latitude;

        this.CesiumViewer.scene.globe = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
        this.CesiumViewer.scene.globe.baseColor =  new Cesium.Color(0.24,0.24,0.24,1);
        this.CesiumViewer.scene.globe.fillHighlightColor =  new Cesium.Color(0.24,0.24,0.24,1);
        this.CesiumViewer.scene.backgroundColor = new Cesium.Color(0.043,0.18,0.24,1);

        this.CesiumViewer.camera.setView({
            orientation: {
                heading: 0.03295948729686427 + Cesium.Math.PI_OVER_TWO,
                pitch: 0.0, //-Cesium.Math.PI_OVER_TWO (top view)
                roll: 0.0
            },
            destination: Cesium.Cartesian3.fromDegrees(longitude - 0.00015, latitude, HEIGHT + 1.5)
        });

        this.entityAUV = this.CesiumViewer.entities.add({
            //Set the entity availability to the same interval as the simulation time.
            availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                start: this.startTime,
                stop: this.stopTime
            })]),

            //Use our computed positions
            position: this.auv.path,

            //Automatically compute orientation based on position movement.
            orientation: new Cesium.VelocityOrientationProperty(this.auv.path),

            //Load the Cesium plane model to represent the entity
            model: {
                uri: '../models/lauv-80.glb',
                minimumPixelSize: 64
            },
            scale: 1.0,

            //Show the path as a pink line sampled in 1 second increments.
            path: {
                resolution: 1,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.1,
                    color: Cesium.Color.YELLOW
                }),
                width: 1
            },

            // Color the model slightly blue when the eyepoint is underwater.
            color : new Cesium.Color(0.0, 0.0, 1.0, 1.0),
            colorBlendMode : Cesium.ColorBlendMode.MIX,
            colorBlendAmount : new Cesium.CallbackProperty(function(time, result) {
                var underwater = viewer.camera.positionCartographic.height < 0;

                console.log("underwater!!!");
                return !underwater ? 1.0 : 0.0;
            }, false)
        });

        let viewer = this.CesiumViewer;
        let entity = this.entityAUV;
        this.CesiumViewer.flyTo(entity).then(function () {
            viewer.trackedEntity = entity;
            viewer.camera.setView({
                orientation: entity.orientation,
                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.00015, HEIGHT+ 1.5)
            });
            viewer.scene.camera.lookAt(entity.position.getValue(viewer.clock.currentTime), entity.orientation.getValue(viewer.clock.currentTime));
        });
    }

    initEnvironment() {
        let newLatitude = this.auv.latitude-0.0005;
        let newLongitude = this.auv.longitude-0.0003;
        let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(newLongitude, newLatitude, DEPTH+47.5));

        // naufrago
        var viewer = this.CesiumViewer;
        var tileset = viewer.scene.primitives.add(
            new Cesium.Cesium3DTileset({
                url: Cesium.IonResource.fromAssetId(90688),
                modelMatrix : modelMatrix
            })
        );

        // Debug
        let dist = Cesium.Cartesian3.distance(new Cesium.Cartesian3.fromDegrees(this.auv.longitude, this.auv.latitude),
            new Cesium.Cartesian3.fromDegrees(newLongitude, newLatitude));
        console.log("Distance: " + dist);
    }

    private updateRender(data) {

        if(data.auvActive !== this.state.options.auvActive){
            this.CesiumViewer.entities.removeAll();

            let i = 0;
            let found = false;
            while(i < this.auvs.length){
                if(data.auvActive === this.auvs[i].name) {
                    this.auv = new Auv(this.auvs[i]);
                    found = true;
                    break;
                }
                i++;
            }

            if(!found || this.auv.waypoints.length === 0) {
                console.log("Option not available: waypoints not defined.");
                return;
            }

            this.state.options.auvActive = data.auvActive;

            this.getBoundsTime();
            this.createAuvModel();
            this.findMainTile();

            this.initEnvironment();
            setInterval(this.updateTiles.bind(this), 500);

            this.isReady = true;
        }

        if(data.terrainExaggeration !== this.state.options.terrainExaggeration) {
            this.state.options.terrainExaggeration = data.terrainExaggeration;
            if(this.isReady){
                this.tiles.forEach(tile => {
                    if(tile.active) {
                        this.removeTile(tile);
                        this.renderTile(tile);
                    }
                });
            }
        }

        if(data.waterEffects !== this.state.options.waterEffects)
            this.state.options.waterEffects = data.waterEffects;


        // todo: dont't work -> why?
        this.setState(prevState => ({
            data: { ...prevState.data, ...data }
        }));
    }

    private findMainTile(){

        let dist, assetId;
        let auvPosition = this.entityAUV.position.getValue(this.CesiumViewer.clock.currentTime);

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
        Cesium.Transforms.eastNorthUpToFixedFrame(position,this.CesiumViewer.scene.globe.ellipsoid, this.ENU);
    }

    private updateTiles() {
        this.findMainTile();

        //let auvPosition;
        let dist, assetId;
        let auvPosition = this.entityAUV.position.getValue(this.CesiumViewer.clock.currentTime);
        this.topView.setCameraView(auvPosition);

        // Render neighbors
        this.tiles.forEach(tile => {
            assetId = tile.assetId;
            dist = Cesium.Cartesian3.distance(auvPosition, new Cesium.Cartesian3.fromDegrees(tile.longitude, tile.latitude)) / 1000;

            if (dist <= 5.0) {
                if(tile.primitive === undefined) {
                    this.renderTile(tile);
                }
            } else {
                if(tile.active)
                    this.removeTile(tile)
            }
        });



        this.forceUpdate();
    }


    renderTile(tile: Tile){
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
        var scale = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(1,1, this.state.options.terrainExaggeration), undefined);
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

        this.CesiumViewer.scene.primitives.add(tileset);

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

    removeTile(tile: Tile){
        console.log("remove: " + tile.assetId);
        if(this.CesiumViewer.scene.primitives.contains(tile.primitive))
            this.CesiumViewer.scene.primitives.remove(tile.primitive);
        tile.active = false;
        tile.primitive = undefined;
    }

    /**
     * TODO obter localização de cada àrea a colocar um pin
     * (lista de localizaçeõs possiveis)
     */
    createPins() {
        var pinBuilder = new Cesium.PinBuilder();
        var bluePin = this.CesiumViewer.entities.add({
            name : 'Blank blue pin',
            position : Cesium.Cartesian3.fromDegrees(this.tiles[0].longitude, this.tiles[0].latitude, 1000),
            billboard : {
                image : pinBuilder.fromColor(Cesium.Color.ROYALBLUE, 20).toDataURL(),
                verticalOrigin : Cesium.VerticalOrigin.BOTTOM
            }
        });

     /* console.log("create pin!");
        var t = this.CesiumViewer;

        //Since some of the pins are created asynchronously, wait for them all to load before zooming/
        Cesium.when.all([bluePin], function(pins){
            t.zoomTo(pins);
        });*/
    }
};
export default App;