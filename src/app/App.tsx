    import React from 'react';
    import DatGui, {DatSelect, DatString} from "react-dat-gui";
    import {AuvJSON, WaypointJSON} from './utils/AUVUtils';
    import { TileJSON } from './utils/TilesUtils';
    import Auv from "./components/Auv"
    import tiles from './../data/coordTiles2.json';
    import {number} from "prop-types";

    const Cesium = require('cesium');
    const HEIGHT =  5280.0;
    const WIDTH = 3770.0;
    const DECIMAL_DEGREES_FACTOR = 111.29;
    const WGS_84_A = 6378137.0;
    const WGS_84_E2 = 0.00669437999013;
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
        private mainTile: any;
        private tiles: Array<TileJSON> = new Array<TileJSON>();

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
        private ENU: Cesium.Matrix4 = new Cesium.Matrix4();

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

                let t : Array<TileJSON> = JSON.parse(JSON.stringify(tiles.tiles));
                this.tiles = t;

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
            //this.CesiumViewer.extend(Cesium.viewerCesiumInspectorMixin);
            this.CesiumViewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);

            this.CesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;

            //Set the random number seed for consistent results.
            Cesium.Math.setRandomNumberSeed(3);

            this.ENU = new Cesium.Matrix4();
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



            if(!this.activeTiles.has(this.mainTile.assetId)) {
                this.renderTile(this.mainTile.latitude, this.mainTile.longitude, this.mainTile.assetId);
            }

            var position = Cesium.Cartesian3.fromDegrees(this.mainTile.longitude,this.mainTile.latitude,0);
            Cesium.Transforms.eastNorthUpToFixedFrame(position,this.CesiumViewer.scene.globe.ellipsoid, this.ENU);

            // Render neighbors
            this.tiles.forEach(tile => {
                if(tile.assetId !== this.mainTile.assetId) {
                    assetId = tile.assetId;
                    dist = Cesium.Cartesian3.distance(auvPosition, new Cesium.Cartesian3.fromDegrees(tile.longitude, tile.latitude)) / 1000;

                    if (dist <= 5.0) {
                        this.processTile(assetId, tile, position)
                    } else {
                        this.removeTile(assetId)
                    }
                }
            });

            this.forceUpdate();
        }

        renderTile(lat: number, lon: number, assetId:number) {
            let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
                Cesium.Cartesian3.fromDegrees(lon, lat, -255));

            //Cesium.Transforms.eastNorthUpToFixedFrame(Cesium.Cartesian3.fromElements(position.x, position.y, -250.0));

            //position.coords[1], coords[0], -255));

            let p = new Cesium.Cesium3DTileset({
                url: Cesium.IonResource.fromAssetId(assetId),
                modelMatrix: modelMatrix
            })
            this.CesiumViewer.scene.primitives.add(p);
            this.activeTiles.set(assetId, p);
            console.log("Render: " + assetId);
        }

        processTile(assetId: number, tile: TileJSON, position: Cesium.Cartesian3){
            let primitive = this.activeTiles.get(assetId);
            if(primitive === undefined) {



                let lat = tile.latitude;
                let lon = tile.longitude;

            /*    if(this.mainTile.latitude === lat) // left or right neighbor
                    lon = this.getLongitudeGivenDistance(lon);
                else if(this.mainTile.longitude === lon) // top or down neighbor
                    lat = this.getLatitudeGivenDistance(lat);
                else { // top or down neighbor
                    lon = this.getLongitudeGivenDistance(lon);
                    lat = this.getLatitudeGivenDistance(lat);
                }*/

                let offsetN = HEIGHT;
                let offsetE = WIDTH;
                //var position = Cesium.Cartesian3.fromDegrees(this.mainTile.longitude, this.mainTile.latitude);
                var offset;

                if(this.mainTile.latitude === lat){
                    if(this.mainTile.longitude < lon){
                        offsetE = offsetE * 1;
                    }
                    else if(this.mainTile.longitude > lon) {
                        offsetE = offsetE * -1;
                    }
                    offset = new Cesium.Cartesian3(offsetE, 0);
                }
                else if(this.mainTile.longitude === lon){
                    if(this.mainTile.latitude < lat){
                        offsetN = offsetN * 1;
                    }
                    else if(this.mainTile.latitude > lat) {
                        offsetN = offsetN * -1;
                    }
                    offset = new Cesium.Cartesian3(0, offsetN);
                }
                else {
                    if(this.mainTile.latitude < lat){
                        offsetN = offsetN * 1;
                    }
                    else if(this.mainTile.latitude > lat) {
                        offsetN = offsetN * -1;
                    }
                    if(this.mainTile.longitude < lon){
                        offsetE = offsetE * 1;
                    }
                    else if(this.mainTile.longitude > lon) {
                        offsetE = offsetE * -1;
                    }
                    offset = new Cesium.Cartesian3(offsetE, offsetN);
                }

                console.log("offset: " + offset);

                var finalPos = Cesium.Matrix4.multiplyByPoint(this.ENU, offset, new Cesium.Cartesian3());
                console.log(finalPos);

                console.log("position 1 : " + position);
                console.log("position 2 : " + finalPos);

                let result = new Cesium.Cartographic();
                Cesium.Cartographic.fromCartesian(finalPos, Cesium.Ellipsoid.WGS84, result);
                lon = Cesium.Math.toDegrees(result.longitude);
                lat = Cesium.Math.toDegrees(result.latitude);

                console.log("lon : " + lon);
                console.log("lat : " + lat);

                this.renderTile(lat, lon, assetId);
            }
        }

        removeTile(assetId: number){
            let primitive = this.activeTiles.get(assetId);
            if(primitive !== undefined) {
               // console.log("remove: " + assetId);
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


        getLongitudeGivenDistance(lon: number) {
            let c = 40075.0 * Math.cos(this.mainTile.latitude) / 3600.0;
            //0.13
            if(this.mainTile.longitude < lon)
                lon = this.mainTile.longitude - ( WIDTH / c) * 0.13;
            else if(this.mainTile.longitude > lon)
                lon = this.mainTile.longitude + ( WIDTH / c) * 0.13 ;

            return lon;
        }

        getLatitudeGivenDistance(lat: number) {
            //1.33
            if(this.mainTile.latitude < lat)
                lat = this.mainTile.latitude + (HEIGHT / DECIMAL_DEGREES_FACTOR)*1.33;
            else if(this.mainTile.latitude > lat) {
                lat = this.mainTile.latitude - (HEIGHT / DECIMAL_DEGREES_FACTOR)*1.33;
            }
            return lat;
        }

       toECEF(latDegrees:number, lonDegrees:number, depth:number) {

           let lld: number[] = [latDegrees, lonDegrees, depth];
           lld[0] = this.degrees_to_radians(lld[0]);
           lld[1] = this.degrees_to_radians(lld[1]);

           let  cos_lat = Math.cos(lld[0]);
           let  sin_lat = Math.sin(lld[0]);
           let  cos_lon = Math.cos(lld[1]);
           let  sin_lon = Math.sin(lld[1]);
           let  rn = WGS_84_A / Math.sqrt(1.0 - WGS_84_E2 * sin_lat * sin_lat);

           let n = (rn - lld[2]) * cos_lat * cos_lon;
           let e = (rn - lld[2]) * cos_lat * sin_lon;
           let d = (((1.0 - WGS_84_E2) * rn) - lld[2]) * sin_lat;

           //let ned: number[] = ;
           let ned: number[] = [n, e, d];

           return ned;
        }

        toGeodetic(x : number, y:number, z:number) {

            console.log("toGeodetic");
            let lat, lon, d;

            let p = Math.sqrt(x * x + y * y);
            lon = Math.atan2(y, x);
            lat = Math.atan2(z / p, 0.01);
            let n = this.n_rad(lat);
            d = p / Math.cos(lat) - n;
            let old_hae = -1e-9;
            let num = z / p;

            while (Math.abs(d - old_hae) > 1e-4) {
                old_hae = d;
                let den = 1 - WGS_84_E2 * n / (n + d);
                lat = Math.atan2(num, den);
                n = this.n_rad(lat);
                d = p / Math.cos(lat) - n;
            }

            console.log("toGeodetic");

            let lld: number[] = [lat, lon, d];
            console.log(lld.toString());

            lld[0] = this.degrees_to_radians(lld[0]);
            lld[1] = this.degrees_to_radians(lld[1]);

            console.log(lld);

            return lld;
        }

        n_rad(lat:number) {
            let lat_sin = Math.sin(lat);
            return WGS_84_A / Math.sqrt(1 - WGS_84_E2 * (lat_sin * lat_sin));
        }


        WGS84displace(latDegrees:number, lonDegrees:number, depth:number, n:number, e:number, d:number) {

            console.log("WGS84displace: " );
            //console.log(latDegrees, lonDegrees, depth);

            // Convert reference to ECEF coordinates
            let xyz = this.toECEF(latDegrees, lonDegrees, depth);

            //console.log("WGS84displace xyz: " );
            //console.log(xyz);

            let lld = [latDegrees, lonDegrees, depth];

            // Compute Geocentric latitude
            let phi = Math.atan2(xyz[2], Math.sqrt(xyz[0] * xyz[0] + xyz[1] * xyz[1]));

            console.log("phi: " + phi);

            // Compute all needed sine and cosine terms for conversion.
            let slon = Math.sin(this.degrees_to_radians(lld[1]));
            let clon = Math.cos(this.degrees_to_radians(lld[1]));
            let sphi = Math.sin(phi);
            let cphi = Math.cos(phi);

            console.log("slon: " + slon);
            console.log("clon: " + clon);
            console.log("sphi: " + sphi);
            console.log("cphi: " + cphi);

            console.log("antes xyz: " + xyz.toString());

            // Obtain ECEF coordinates of displaced point
            // Note: some signs from standard ENU formula
            // are inverted - we are working with NED (= END) coordinates
            xyz[0] += -slon * e - clon * sphi * n - clon * cphi * d;
            xyz[1] += clon * e - slon * sphi * n - slon * cphi * d;
            xyz[2] += cphi * n - sphi * d;

            console.log("depois xyz: " + xyz.toString());

            return xyz;

            // Convert back to WGS-84 coordinates
           // let lld2 = this.toGeodetic(xyz[0], xyz[1], xyz[2]);

         /*   console.log("WGS84displace lld2: " );
            console.log(lld2);

            if (d != 0.0)
                lld2[2] = depth + d;
            else
                lld2[2] = depth;

            return lld2;*/
    }



    };
    export default App;