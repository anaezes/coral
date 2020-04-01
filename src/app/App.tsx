    import React from 'react';
    import { AuvJSON } from './utils/AUVUtils';
    import Auv from "./components/Auv"

    const Cesium = require('cesium');

    const url =  'https://ripples.lsts.pt/soi';

    class App extends React.Component {
        private first: boolean = true;
        private CesiumContainer: any;
        private CesiumViewer: any;
        private startTime: any;
        private stopTime: any;
        private auvs: any;
        private auv: any;

        state = {
            isLoading: true,
            data: [],
            error: null
        }

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

        render() {
            const {isLoading, data} = this.state;
            if (!isLoading && this.first) {
                let auvs: Array<AuvJSON> = JSON.parse(JSON.stringify(data));
                this.auvs = auvs; //copy

                //choose auv

                this.auv = new Auv(this.auvs[2]);
                this.getBoundsTime();
                this.initCesium();
                this.initEnvironment();
                this.createAuvModel();

                this.first = false;
            }
            return (
                <div>
                    <div id="CesiumContainer" ref={element => this.CesiumContainer = element}/>
                </div>
            );
        }

        initCesium() {
            Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkOGVmYTBmMC1jMDJjLTQ5' +
                'MTQtYTQwZi1jNjVkOTcyYTQ0MjEiLCJpZCI6MjMxNTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODI4MTE0NjB9.' +
                '8bD2ihWXbQPEjqO6CN79XDZ-oTrY7h1S5o8uiT_tvuU';

            let globe = new Cesium.Globe();
            globe.show = false;

            this.CesiumViewer = new Cesium.Viewer('CesiumContainer', {
                animation: true,
                scene3DOnly: true,
                globe: globe,
                skyBox: false,
                vrButton: false,
                skyAtmosphere: false,
                shadows: false,
                baseLayerPicker: false,
                geocoder: true,
                homeButton: true,
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

            //Set the random number seed for consistent results.
            Cesium.Math.setRandomNumberSeed(3);

            /* viewer.scene.backgroundColor = Cesium.Color.BLACK;
             viewer.scene.globe.baseColor = Cesium.Color.BLACK;
             viewer.scene.fxaa = false;

             viewer.scene.globe.depthTestAgainstTerrain = false;
             viewer.scene.globe.enableLighting = false;
             viewer.scene.globe.showWaterEffect = false;*/

            //Make sure viewer is at the desired time.
            this.CesiumViewer.clock.startTime = this.startTime.clone();
            this.CesiumViewer.clock.stopTime = this.stopTime.clone();
            this.CesiumViewer.clock.currentTime = this.startTime.clone();
            this.CesiumViewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
            this.CesiumViewer.clock.multiplier = 10;

            //Set timeline to simulation bounds
            this.CesiumViewer.timeline.zoomTo(this.startTime, this.stopTime);
        }

        getBoundsTime() {
            //Set bounds of our simulation time
            this.startTime = Cesium.JulianDate.fromDate(new Date(this.auv.startTime));
            this.stopTime = Cesium.JulianDate.fromDate(new Date(this.auv.stopTime));
        }

        createAuvModel() {
            let longitude = this.auv.longitude;
            let latitude = this.auv.latitude;

            this.CesiumViewer.camera.setView({
                orientation: {
                    heading: 0.03295948729686427 + Cesium.Math.PI_OVER_TWO,
                    pitch: 0.0, //-Cesium.Math.PI_OVER_TWO (top view)
                    roll: 0.0
                },
                destination: Cesium.Cartesian3.fromDegrees(longitude - 0.00015, latitude, 1.5)
            });

            let entity = this.CesiumViewer.entities.add({
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
                    uri: '../models/auv.glb',
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
            let newLatitude = this.auv.latitude-0.003;
            let newLongitude = this.auv.longitude-0.002;
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Cartesian3.fromDegrees(newLongitude, newLatitude, 0.0));
            let model = Cesium.Model.fromGltf({
                url : '../models/rocks-3.glb',
                modelMatrix : modelMatrix,
                scale : 1.0,
                orientation: {
                    heading : 0.03295948729686427,
                    pitch : 0.0,
                    roll : 0.0
                }
            });

            this.CesiumViewer.scene.primitives.add(model);

            // Debug
            let dist = this.auv.getDist(this.auv.longitude, this.auv.latitude, newLongitude, newLatitude);
            console.log("Distance: " + dist);
        }
    };
    export default App;