    import React, { Component } from 'react';
    const Cesium = require('cesium');

    const url =  'https://ripples.lsts.pt/soi';

    interface AuvJSON {
        name:    string;
        imcid:     number;
        lastState: string;
        plan: string;
    }

    interface Auv {
        name:    string;
        imcid:     number;
        lastState: LastStateJSON;
        plan: PlanJSON;
    }

    interface PlanJSON {
        id:    string;
        waypoints:  WaypointJSON[];
        description: string;
        type: string;
    }

    interface LastStateJSON {
        latitude:    number;
        longitude:     number;
        heading: number;
        fuel: number;
        timestamp: number;
    }

    interface WaypointJSON {
        latitude:    number;
        longitude:     number;
        heading: number;
        fuel: number;
        timestamp: number;
    }

    class AUV extends React.Component {
        private CesiumContainer: any;
        private CesiumViewer: any;
        private scene: any;
        private waypoints = Array();

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
                    .catch(error => this.setState({ error, isLoading: false }));

        }

        render () {
            const {isLoading, data, error} = this.state;
            if(!isLoading) {
                this.getWaypoints();
                this.createModel('../models/WaterBottle.glb', this.waypoints[0].latitude, this.waypoints[0].longitude);
            }
            return (
                <div>
                   <div id="CesiumContainer" ref={ element => this.CesiumContainer = element }/>
                </div>
            );
        }

        getWaypoints()
        {
            let response = this.state.data;

            // @ts-ignore
            this.waypoints = response[2].plan.waypoints;

            console.log("waypoints:");
            console.log(this.waypoints);
        }

       createModel(url: string, latitude: number, longitude: number) {

            if(!this.CesiumViewer)
                this.initCesium();

           var scene = this.CesiumViewer.scene;

           // TOP view
           // pitch : -Cesium.Math.PI_OVER_TWO

           this.CesiumViewer.camera.setView({
               destination : Cesium.Cartesian3.fromDegrees(longitude, latitude-0.0025, 20.0),
               orientation: {
                   heading : 0.03295948729686427,
                   pitch : 0.0,
                   roll : 0.0
               }
           });

           var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
               Cesium.Cartesian3.fromDegrees(longitude, latitude, 0.0));
           var model = scene.primitives.add(Cesium.Model.fromGltf({
               url : url,
               modelMatrix : modelMatrix,
               scale : 200.0,
               orientation: {
                   heading : 0.03295948729686427,
                   pitch : 0.0,
                   roll : 0.0
               }
           }));
       }

        initCesium(){
            Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkOGVmYTBmMC1jMDJjLTQ5' +
                'MTQtYTQwZi1jNjVkOTcyYTQ0MjEiLCJpZCI6MjMxNTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODI4MTE0NjB9.' +
                '8bD2ihWXbQPEjqO6CN79XDZ-oTrY7h1S5o8uiT_tvuU';

            var globe = new Cesium.Globe();
            globe.show = false;
            //globe.baseColor = Cesium.Color.WHITE;

            this.CesiumViewer = new Cesium.Viewer('CesiumContainer',{
                animation: false,
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
                timeline: false,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false
            });
            //this.CesiumViewer.scene.backgroundColor = Cesium.Color.WHITE;
            this.CesiumViewer.scene.imageryLayers.removeAll();
            this.CesiumViewer.extend(Cesium.viewerCesiumInspectorMixin);
        }
    };

    export default AUV;