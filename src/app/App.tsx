import React from 'react';
import DatGui, {DatSelect, DatNumber} from "react-dat-gui";
import {AuvJSON, WaypointJSON} from './utils/AUVUtils';
import { TileJSON } from './utils/TilesUtils';
import Auv from "./components/Auv";
import Tile from "./components/Tile";
import Water from "./components/Water"
import * as THREE from "three";
import tiles from './../data/coordTiles2.json';

const Cesium = require('cesium');
const DEPTH = 0.0;
const HEIGHT = 10.0;
const url =  'https://ripples.lsts.pt/soi';

interface three {
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene
};

interface state {
    isLoading: Boolean,
    data: Array<string>,
    error: Boolean,
    options: MenuOptions
}

interface MenuOptions {
    auvActive: string,
    terrainExaggeration: number
}

class _3DObject {
    threeMesh: any;
    minWGS84:any;
    maxWGS84:any;
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

    state = {
        isLoading: true,
        data: [],
        error: false,
        options: {
            auvActive: '',
            terrainExaggeration: 4
        }
    };
    private isReady: boolean = false;
    private water: any;


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

            this.first = false;

            this.water = new Water(this);

            //this.initThree();
            //this.initObject()
            //this.renderThreeObj();

            //this.CesiumViewer.render();
        }




        return (
            <div>
                <div id="Container" ref={element => this.container = element}/>
                <DatGui data={options} onUpdate={this.handleUpdate}>
                    <DatNumber path='terrainExaggeration' label='Terrain exageration' min={1} max={10} step={1} />
                    <DatSelect
                        label="Available AUV's"
                        path="auvActive"
                        options={this.options}/>
                </DatGui>

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
        this.CesiumViewer.scene.globe.baseColor = Cesium.Color.GRAY;
        this.CesiumViewer.scene.globe.fillHighlightColor = Cesium.Color.GRAY;
        this.CesiumViewer.scene.backgroundColor = Cesium.Color.CADETBLUE;

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
            //this.CesiumViewer.scene.primitives.removeAll();

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

            // todo change to "this.setStat"
            this.state.options.auvActive = data.auvActive;

            this.getBoundsTime();
            this.createAuvModel();
            this.findMainTile();
            this.initEnvironment();
            setInterval(this.updateTiles.bind(this), 500);

            this.isReady = true;
        }

        // todo change to "this.setStat"
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

        this.setState(prevState => ({
            data: { ...prevState.data, ...data }
        }));


        var geometry = new THREE.BoxGeometry( 1, 1, 1 );
        var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        var cube = new THREE.Mesh( geometry, material );
        this.three.scene.add( cube );
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
            dynamicScreenSpaceErrorHeightFalloff : 0.25
        });

        this.CesiumViewer.scene.primitives.add(tileset);

        tileset.readyPromise.then(function(){
            tileset._root.transform = Cesium.Matrix4.IDENTITY;
            tileset.modelMatrix = transform;
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


    /*
    * Threejs
    *
    * **/


    //threeContainer: any = document.getElementById("root");
    objects = []; //Could be any Three.js object mesh

    // boundaries in WGS84 around the object
    maxWGS84 = [41.5872135, -8.7991357];
    minWGS84 = [41.4923581, -8.8444746];

    three = {
        renderer: new THREE.WebGLRenderer(),
        camera: new THREE.PerspectiveCamera(),
        scene: new THREE.Scene()
    };



    initThree(){
        var fov = 45;
        var width = window.innerWidth;
        var height = window.innerHeight;
        var aspect = width / height;
        var near = 1;
        var far = 10*1000*1000;

        this.three.scene = new THREE.Scene();
        this.three.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.three.renderer = new THREE.WebGLRenderer({alpha: true});
        this.container.appendChild(this.three.renderer.domElement);
    }

    renderThreeObj(){
        // register Three.js scene with Cesium
        //let fov = this.CesiumViewer.camera.frustum.fov;
        this.three.camera.fov = Cesium.Math.toDegrees(this.CesiumViewer.camera.frustum.fovy) // ThreeJS FOV is vertical
        this.three.camera.updateProjectionMatrix();

     /*   var cartToVec = function(cart){
            return new THREE.Vector3(cart.x, cart.y, cart.z);
        };

        // Configure Three.js meshes to stand against globe center position up direction
       for(var id in this.objects){
            this.minWGS84 = this.objects[id].minWGS84;
            this.maxWGS84 = this.objects[id].maxWGS84;
            // convert lat/long center position to Cartesian3
            var center = Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2);

            // get forward direction for orienting model
            var centerHigh = Cesium.Cartesian3.fromDegrees((minWGS84[0] + maxWGS84[0]) / 2, (minWGS84[1] + maxWGS84[1]) / 2,1);

            // use direction from bottom left to top left as up-vector
            var bottomLeft  = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], minWGS84[1]));
            var topLeft = cartToVec(Cesium.Cartesian3.fromDegrees(minWGS84[0], maxWGS84[1]));
            var latDir  = new THREE.Vector3().subVectors(bottomLeft,topLeft ).normalize();

            // configure entity position and orientation
            this.objects[id].threeMesh.position.copy(center);
            this.objects[id].threeMesh.lookAt(centerHigh);
            this.objects[id].threeMesh.up.copy(latDir);
        }*/

        // Clone Cesium Camera projection position so the
        // Three.js Object will appear to be at the same place as above the Cesium Globe
        this.three.camera.matrixAutoUpdate = false;
        var cvm = this.CesiumViewer.camera.viewMatrix;
        var civm = this.CesiumViewer.camera.inverseViewMatrix;
        this.three.camera.matrixWorld.set(
            civm[0], civm[4], civm[8 ], civm[12],
            civm[1], civm[5], civm[9 ], civm[13],
            civm[2], civm[6], civm[10], civm[14],
            civm[3], civm[7], civm[11], civm[15]
        );
        this.three.camera.matrixWorldInverse.set(
            cvm[0], cvm[4], cvm[8 ], cvm[12],
            cvm[1], cvm[5], cvm[9 ], cvm[13],
            cvm[2], cvm[6], cvm[10], cvm[14],
            cvm[3], cvm[7], cvm[11], cvm[15]
        );
        this.three.camera.lookAt(new THREE.Vector3(0,0,0));

        var width = this.container.clientWidth;
        var height = this.container.clientHeight;
        var aspect = width / height;
        this.three.camera.aspect = aspect;
        this.three.camera.updateProjectionMatrix();

        this.three.renderer.setSize(width, height);
        this.three.renderer.render(this.three.scene, this.three.camera);
    }

    initObject(){
        //Cesium entity
       /* var entity = {
            name : 'Polygon',
            polygon : {
                hierarchy : Cesium.Cartesian3.fromDegreesArray([
                    minWGS84[0], minWGS84[1],
                    maxWGS84[0], minWGS84[1],
                    maxWGS84[0], maxWGS84[1],
                    minWGS84[0], maxWGS84[1],
                ]),
                material : CesiumColor.RED.withAlpha(0.2)
            }
        };
        var Polygon = this.CesiumViewer.entities.add(entity);*/

        //Three.js Objects
  /*      // Lathe geometry
        var doubleSideMaterial = new THREE.MeshNormalMaterial({
            side: THREE.DoubleSide
        });
        var segments = 10;
        var points;
        for ( var i = 0; i < segments; i ++ ) {
            points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * segments + 5, ( i - 5 ) * 2 ) );
        }
        var geometry = new THREE.LatheGeometry( points );
        var latheMesh = new THREE.Mesh( geometry, doubleSideMaterial ) ;
        latheMesh.scale.set(1500,1500,1500); //scale object to be visible at planet scale
        latheMesh.position.z += 15000.0; // translate "up" in Three.js space so the "bottom" of the mesh is the handle
        latheMesh.rotation.x = Math.PI / 2; // rotate mesh for Cesium's Y-up system
        var latheMeshYup = new THREE.Group();
        latheMeshYup.add(latheMesh)
        this.three.scene.add(latheMeshYup); // don’t forget to add it to the Three.js scene manually

        //Assign Three.js object mesh to our object array
        var _3DOB = new _3DObject();
        _3DOB.threeMesh = latheMeshYup;
        _3DOB.minWGS84 = this.minWGS84;
        _3DOB.maxWGS84 = this.maxWGS84;
        this.objects.push(_3DOB);

        // dodecahedron
        geometry = new THREE.DodecahedronGeometry();
        var dodecahedronMesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial()) ;
        dodecahedronMesh.scale.set(5000,5000,5000); //scale object to be visible at planet scale
        dodecahedronMesh.position.z += 15000.0; // translate "up" in Three.js space so the "bottom" of the mesh is the handle
        dodecahedronMesh.rotation.x = Math.PI / 2; // rotate mesh for Cesium's Y-up system
        var dodecahedronMeshYup = new THREE.Group();
        dodecahedronMeshYup.add(dodecahedronMesh)*/



        console.log("render threejs");
    }
};
export default App;