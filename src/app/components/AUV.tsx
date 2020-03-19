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
        private first: boolean = true;
        private CesiumContainer: any;
        private waypoints = Array();
        private CesiumViewer: any;
        private startTime: any;
        private stopTime: any;
        private scene: any;
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
                 .catch(error => this.setState({ error, isLoading: false }));
        }

        render () {
            const {isLoading, data, error} = this.state;
            if(!isLoading && this.first) {
                this.getWaypoints();
                this.getBoundsTime();
                this.initCesium();
                this.initScene(this.waypoints[0].latitude, this.waypoints[0].longitude);
                let path = this.generatePath();
                this.createModel('../models/auv.glb', this.waypoints[0].latitude, this.waypoints[0].longitude, path);
                this.first = false;
            }
            return (
                <div>
                   <div id="CesiumContainer" ref={ element => this.CesiumContainer = element }/>
                </div>
            );
        }

        getWaypoints() {
            this.waypoints = this.state.data[2]['plan']['waypoints'];

            console.log("waypoints:");
            console.log(this.waypoints);
        }

        getBoundsTime() {
            let t1 = this.waypoints[0]['arrivalDate'];
            let t2 = this.waypoints[4]['arrivalDate'];

            //Set bounds of our simulation time
            this.startTime = Cesium.JulianDate.fromDate(new Date(t1));
            this.stopTime = Cesium.JulianDate.fromDate(new Date(t2));
        }

       createModel(url: string, latitude: number, longitude: number, path: any) {

          // TOP view
          // pitch : ( rodar 90º -Cesium.Math.PI_OVER_TWO)

           this.CesiumViewer.camera.setView({
               orientation: {
                   heading : 0.03295948729686427+Cesium.Math.PI_OVER_TWO,
                   pitch : 0.0,
                   roll : 0.0
               },
               destination : Cesium.Cartesian3.fromDegrees(longitude-0.00015, latitude, 1.5)
           });

           var entity = this.CesiumViewer.entities.add({
               //Set the entity availability to the same interval as the simulation time.
               availability : new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                   start : this.startTime,
                   stop : this.stopTime
               })]),

               //Use our computed positions
               position : path,

               //Automatically compute orientation based on position movement.
               orientation : new Cesium.VelocityOrientationProperty(path),

               //Load the Cesium plane model to represent the entity
               model : {
                   uri : url,
                   minimumPixelSize : 64
               },
               scale: 1.0,

               //Show the path as a pink line sampled in 1 second increments.
               path : {
                   resolution : 1,
                   material : new Cesium.PolylineGlowMaterialProperty({
                       glowPower : 0.1,
                       color : Cesium.Color.YELLOW
                   }),
                   width : 3
               }
           });

           this.CesiumViewer.trackedEntity = entity;
       }


        generatePath() {
            var property = new Cesium.SampledPositionProperty();

            for (let i = 0; i < this.waypoints.length; i += 1) {

                let time = Cesium.JulianDate.fromDate(new Date(this.waypoints[i]['arrivalDate']));
                var position = Cesium.Cartesian3.fromDegrees(this.waypoints[i].longitude, this.waypoints[i].latitude, i);
                property.addSample(time, position);

                //Also create a point for each sample we generate.
                this.CesiumViewer.entities.add({
                    position : position,
                    point : {
                        pixelSize : 8,
                        color : Cesium.Color.TRANSPARENT,
                        outlineColor : Cesium.Color.YELLOW,
                        outlineWidth : 3
                    }
                });
            }
            return property;
        }

        initCesium(){
            Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkOGVmYTBmMC1jMDJjLTQ5' +
                'MTQtYTQwZi1jNjVkOTcyYTQ0MjEiLCJpZCI6MjMxNTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODI4MTE0NjB9.' +
                '8bD2ihWXbQPEjqO6CN79XDZ-oTrY7h1S5o8uiT_tvuU';

            var globe = new Cesium.Globe();
            globe.show = false;
            //globe.baseColor = Cesium.Color.WHITE;

            this.CesiumViewer = new Cesium.Viewer('CesiumContainer',{
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

            this.CesiumViewer.scene.imageryLayers.removeAll();
            this.CesiumViewer.extend(Cesium.viewerCesiumInspectorMixin);

            //Set the random number seed for consistent results.
            Cesium.Math.setRandomNumberSeed(3);
        }

        initScene(latitude: number, longitude: number) {
            //Make sure viewer is at the desired time.
            this.CesiumViewer.clock.startTime = this.startTime.clone();
            this.CesiumViewer.clock.stopTime = this.stopTime.clone();
            this.CesiumViewer.clock.currentTime = this.startTime.clone();
            this.CesiumViewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
            this.CesiumViewer.clock.multiplier = 10;

            //Set timeline to simulation bounds
            this.CesiumViewer.timeline.zoomTo(this.startTime, this.stopTime);

            var newLongitude = longitude+0.001;
            var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Cartesian3.fromDegrees(newLongitude, latitude, 0.0));
            var model = this.CesiumViewer.scene.primitives.add(Cesium.Model.fromGltf({
                url : '../models/rocks-3.glb',
                modelMatrix : modelMatrix,
                scale : 1.0,
                orientation: {
                    heading : 0.03295948729686427,
                    pitch : 0.0,
                    roll : 0.0
                }
            }));

            var dist = this.getDist(longitude, latitude, newLongitude, latitude);
            console.log("DIST: " + dist);
        }

        /*
        *  Haversine formula
        * */
        getDist(longitude: number, latitude: number, longitudePto: number, latitudePto: number)
        {
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

        degrees_to_radians(degrees: number)
        {
            return degrees * (Math.PI/180);
        }

    };

    export default AUV;