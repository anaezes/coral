    import React from 'react';
    import DatGui, {DatSelect, DatString} from "react-dat-gui";
    import {AuvJSON, WaypointJSON} from './utils/AUVUtils';
    import { coordTileJSON } from './utils/TilesUtils';
    import Auv from "./components/Auv"
    import data from './../data/coordTiles.json';

    const Cesium = require('cesium');


    const url =  'https://ripples.lsts.pt/soi';

    interface state {
        isLoading: Boolean,
        data: Array<string>,
        error: Boolean,
        options: MenuOptions
    }

    interface MenuOptions {
        auvActive: string
    }

    class App extends React.Component<{}, state> {
        private first: boolean = true;
        private options: Array<string> = [];
        private auvs: Array<AuvJSON> = [];
        //private coorTiles: coordTileJSON[] = [];
        //private coorTiles: Array<coordTileJSON> = new Array<coordTileJSON>();
        private activeTiles: Map<number, Cesium.Primitive> = new Map<number, Cesium.Primitive>();
        private CesiumContainer: any;
        private CesiumViewer: any;
        private startTime: any;
        private stopTime: any;

        private entityAUV: Cesium.Entity = new Cesium.Entity();
        private auv: any;

        state = {
            isLoading: true,
            data: [],
            error: false,
            options: {
                auvActive: ''
            }
        };

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
            this.updateRender(newData.auvActive);


        render() {
            const {isLoading, data} = this.state;

            if (!isLoading && this.first) {
                let auvs : Array<AuvJSON> = JSON.parse(JSON.stringify(data));
                this.auvs = auvs; //copy

                 for (let i = 0; i < this.auvs.length; i++) {
                     this.options.push(this.auvs[i].name);
                 }

                if(this.CesiumViewer == null)
                    this.initCesium();

                this.first = false;
            }

            return (
                <div>
                    <div id="CesiumContainer" ref={element => this.CesiumContainer = element}/>
                    <DatGui data={data} onUpdate={this.handleUpdate}>
                        <DatSelect
                            label="Available AUV's"
                            path="auvActive"
                            options={this.options}/>
                    </DatGui>
                </div>
            );
        }


        initCesium() {
            Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkOGVmYTBmMC1jMDJjLTQ5' +
                'MTQtYTQwZi1jNjVkOTcyYTQ0MjEiLCJpZCI6MjMxNTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODI4MTE0NjB9.' +
                '8bD2ihWXbQPEjqO6CN79XDZ-oTrY7h1S5o8uiT_tvuU';

            // Init scene
            let globe = new Cesium.Globe();
            globe.show = true;

            this.CesiumViewer = new Cesium.Viewer('CesiumContainer', {
                animation: true,
                scene3DOnly: true,
                globe: globe,
                skyBox: false,
                vrButton: false,
                skyAtmosphere: false,
                shadows: true,
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
            this.CesiumViewer.extend(Cesium.viewerCesiumInspectorMixin);
            this.CesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;

            //Set the random number seed for consistent results.
            Cesium.Math.setRandomNumberSeed(3);
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

            this.CesiumViewer.scene.globe.show = false;

            this.CesiumViewer.camera.setView({
                orientation: {
                    heading: 0.03295948729686427 + Cesium.Math.PI_OVER_TWO,
                    pitch: 0.0, //-Cesium.Math.PI_OVER_TWO (top view)
                    roll: 0.0
                },
                destination: Cesium.Cartesian3.fromDegrees(longitude - 0.00015, latitude, 1.5)
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
                }
            });

            let viewer = this.CesiumViewer;
            let entity = this.entityAUV;
            this.CesiumViewer.flyTo(entity).then(function () {
                viewer.trackedEntity = entity;
                viewer.camera.setView({
                    orientation: entity.orientation,
                    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.00015, 1.5)
                });
                viewer.scene.camera.lookAt(entity.position.getValue(viewer.clock.currentTime), entity.orientation.getValue(viewer.clock.currentTime));
            });
        }

        initEnvironment() {
            let newLatitude = this.auv.latitude-0.0005;
            let newLongitude = this.auv.longitude-0.0003;
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Cartesian3.fromDegrees(newLongitude, newLatitude, -40.0));
          /* let model = Cesium.Model.fromGltf({
                url : '../models/modelo-scale50.glb',
                modelMatrix : modelMatrix,
                scale : 1.0,
                orientation: {
                    heading : 0.0,
                    pitch : 0.0,
                    roll : -Cesium.Math.PI_OVER_TWO
                }
            });

            this.CesiumViewer.scene.primitives.add(model);*/

            // naufrago
            var viewer = this.CesiumViewer;
            var tileset = viewer.scene.primitives.add(
                new Cesium.Cesium3DTileset({
                    url: Cesium.IonResource.fromAssetId(90688),
                    modelMatrix : modelMatrix
                })
            );

            // Debug
            let dist = this.getDist(this.auv.longitude, this.auv.latitude, newLongitude, newLatitude);
            console.log("Distance: " + dist);
        }

        private updateRender(auvActive) {
            let i = 0;
            let found = false;
            while(i < this.auvs.length){
                if(auvActive === this.auvs[i].name) {
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
            this.state.options.auvActive = auvActive;

            this.getBoundsTime();
            this.initEnvironment();
            this.createAuvModel();

            setInterval(this.updateTiles.bind(this), 500);
        }

        private updateTiles() {
            //let auvPosition;
            let dist, assetId;
            let auvPosition = this.entityAUV.position.getValue(this.CesiumViewer.clock.currentTime);

            data.tiles.forEach(tile => {
                assetId = tile.assetId;
                dist = Cesium.Cartesian3.distance(auvPosition, new Cesium.Cartesian3.fromDegrees(tile.longitude, tile.latitude));

                if(dist <= 3500){
                    //render tile
                    this.renderTile(assetId)
                }
                else if(dist > 3500){
                    //remove tile
                    this.removeTile(assetId)
                }
            });

            this.forceUpdate();
        }

        renderTile(assetId: number){
            let primitive = this.activeTiles.get(assetId);
            if(primitive === undefined) {
                let p = new Cesium.Cesium3DTileset({
                    url: Cesium.IonResource.fromAssetId(assetId)
                })
                this.CesiumViewer.scene.primitives.add(p);
                this.activeTiles.set(assetId, p);
                console.log("Render: " + assetId);
            }
        }

        removeTile(assetId: number){
            let primitive = this.activeTiles.get(assetId);
            if(primitive !== undefined) {
                console.log("remove: " + assetId);
                this.CesiumViewer.scene.primitives.remove(primitive);
                this.activeTiles.delete(assetId);
            }
        }

        /*
        *  Haversine formula
        * */
        getDist(longitude: number, latitude: number, longitudePto: number, latitudePto: number) {
            const R = 6371e3; /* radius of the Earth in meters*/

            latitude = this.degrees_to_radians(latitude);
            latitudePto = this.degrees_to_radians(latitudePto);
            longitude = this.degrees_to_radians(longitude);
            longitudePto = this.degrees_to_radians(longitudePto);

            let dlon = longitudePto - longitude;
            let dlat = latitudePto - latitude;

            let a = Math.sin(dlat/2) * Math.sin(dlat/2) +
                Math.cos(latitude) * Math.cos(latitudePto) *
                Math.sin(dlon/2) * Math.sin(dlon/2);
            let dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

            return R * dist;
        }

        degrees_to_radians(degrees: number) {
            return degrees * (Math.PI/180);
        }

    };
    export default App;