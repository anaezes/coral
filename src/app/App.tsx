import React from 'react';
import DatGui, {DatSelect, DatNumber, DatBoolean} from "react-dat-gui";
import {AuvJSON} from './utils/AUVUtils';
import { TileJSON } from './utils/TilesUtils';
import Auv from "./components/Auv";
import Tile from "./components/Tile";
import WaterEffect from "./components/WaterEffect";
import WaterParticles from "./components/WaterParticles";
import TopView from "./views/TopView";

// Data
import tiles from './../data/coordTiles2.json';
import {AisJSON} from "./utils/AisUtils";


const Cesium = require('cesium');

const DEPTH = 0.0;
const HEIGHT = 10.0;
const urlAuvs =  'https://ripples.lsts.pt/soi';
const dummyCredit = document.createElement("div");


interface state {
    data: Array<string>,
    options: MenuOptions,
    isLoading: Boolean,
    error: Boolean
}

interface MenuOptions {
    auvActive: string,
    terrainExaggeration: number,
    waterEffects: boolean,
    ais: boolean
}


class App extends React.Component<{}, state> {
    private entityAUV: Cesium.Entity = new Cesium.Entity();
    private ENU: Cesium.Matrix4 = new Cesium.Matrix4();
    private tiles: Array<Tile> = new Array<Tile>();
    private isSystemInit: boolean = false;
    private options: Array<string> = [];
    private auvs: Array<AuvJSON> = [];
    private isReady: boolean = false;
    private CesiumViewer: any;
    private mainTile: any;
    private container: any;
    private startTime: any;
    private stopTime: any;
    private topView: any;
    private auv: any;


    state = {
        data: [],
        isLoading: true,
        options: {
            auvActive: '',
            terrainExaggeration: 4,
            waterEffects: false,
            ais: false
        },
        error: false,
    };




    async componentDidMount() {
        fetch(urlAuvs)
            .then(response => response.json())
            .then(data =>
                this.setState({
                    data: data,
                    isLoading: false,
                    error: false
                })
            )
            .catch(error => this.setState({error: error, isLoading: false}));
    }

    // Update current state with changes from controls
    handleUpdate = newData =>
        this.updateRender(newData);


    render() {
        const {isLoading, data, options} = this.state;

        if (!isLoading && !this.isSystemInit) {
            this.topView = new TopView(this.props);

            if(this.CesiumViewer == null)
                this.initCesium();

            this.getAuvs();
            this.getTiles();
            this.createPins();

            this.isSystemInit = true;
        }


        return (
            <div>
                <div id="Container" ref={element => this.container = element}/>
                {this.isReady && options.waterEffects? <div> <WaterEffect/> <WaterParticles/> </div> : <div/>}
                <DatGui data={options} onUpdate={this.handleUpdate}>
                    <DatNumber path='terrainExaggeration' label='Terrain exageration' min={1} max={10} step={1} />
                    <DatSelect
                        label="Available AUV's"
                        path="auvActive"
                        options={this.options}/>
                    <DatBoolean path='waterEffects' label='Water effects' />
                    <DatBoolean path='ais' label='AIS' />
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
            infoBox: true,
            sceneModePicker: false,
            selectionIndicator: false,
            timeline: true,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            shouldAnimate: false, // Enable animations
            requestRenderMode: true,
            creditContainer: dummyCredit
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

        if(data.ais !== this.state.options.ais) {
            this.state.options.ais = data.ais;
            this.renderAis(this.topView.getAis(), data.ais);
        }

        // todo: dont't work -> why?
        this.setState(prevState => ({
            data: { ...prevState.data, ...data }
        }));

        this.forceUpdate();
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
     * Icon: Designed by Freepik from www.flaticon.com
     */
    createPins() {

        var pinBuilder = new Cesium.PinBuilder();
        let viewer = this.CesiumViewer;
        let scene = this.CesiumViewer.scene;

        this.auvs.forEach(auv => {
            Cesium.when(pinBuilder.fromUrl("../images/propeller.png", Cesium.Color.RED, 30), function(canvas) {
                return viewer.entities.add({
                    id: auv.name,
                    name : auv.name.toString(),
                    position : Cesium.Cartesian3.fromDegrees(auv.lastState.longitude, auv.lastState.latitude, 10),
                    billboard : {
                        image : canvas.toDataURL(),
                        verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    },
                    label: {
                        text: auv.name,
                        font: "12px sans-serif",
                        showBackground: true,
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                            0.0,
                            20000000.0
                        )

                    }
                });
            });
        });

        var selectedEntity = new Cesium.Entity();
        var p = this;
        viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(
            movement
                ) {
                var pickedLabel = viewer.scene.pick(movement.position);
                if (Cesium.defined(pickedLabel)) {
                    let d: MenuOptions = {
                        auvActive : pickedLabel.id.id,
                        terrainExaggeration : p.state.options.terrainExaggeration,
                        waterEffects : p.state.options.waterEffects,
                        ais : p.state.options.ais
                    };
                    p.updateRender(d);
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    private getAuvs() {
        let auvs : Array<AuvJSON> = JSON.parse(JSON.stringify(this.state.data));
        this.auvs = auvs; //copy

        for (let i = 0; i < this.auvs.length; i++) {
            this.options.push(this.auvs[i].name);
        }
    }

    private getTiles() {
        let t : Array<TileJSON> = JSON.parse(JSON.stringify(tiles.tiles));
        for (let i = 0; i < t.length; i++) {
            this.tiles.push( new Tile(t[i]));
        }
    }

    /**
     * Icon: Designed by Pixel perfect from www.flaticon.com
     */
    private renderAis(ais: Array<AisJSON>, show: boolean) {
        if(show) {
            for (let i = 0; i < ais.length/4; i++) {
                this.CesiumViewer.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(ais[i].longitude, ais[i].latitude),
                    billboard: {
                        image: "../images/navigation-arrow-white-25perc.png",
                        rotation: Cesium.Math.toRadians(ais[i].heading),
                        color: Cesium.Color.RED,
                        scale: 0.1,
                    },
                    name: ais[i].name,

                });
            }
        }
        else {
            for (let i = 0; i < ais.length/4; i++) {
                this.CesiumViewer.entities.removeById(ais[i].name);
            }
        }

    }
};
export default App;