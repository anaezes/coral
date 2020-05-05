import React, { Component } from "react";
import {AisJSON} from "../utils/AisUtils";
const Cesium = require('cesium');

const urlAis =  'https://ripples.lsts.pt/ais';

const dummyCredit = document.createElement("div");


class TopView extends Component {
    private container: any;
    private viewer: any;
    private ais: Array<AisJSON> = [];

    state = {
        data: [],
        isLoading: true,
        error: false
    };
    private isSystemInit: boolean = false;

    async componentDidMount() {
        fetch(urlAis)
            .then(response => response.json())
            .then(data =>
                this.setState({
                    data: data,
                    isLoading: false,
                    error: false
                })
            )
            .catch(error => this.setState({
                error: error, isLoading: false}));
    }

    public setCameraView(pos) {

        let result = Cesium.Cartographic.fromCartesian(pos, Cesium.Ellipsoid.WGS84);
        let cartesian = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(result.longitude),
            Cesium.Math.toDegrees(result.latitude), 1000);
        let longitude = Cesium.Math.toDegrees(result.longitude);
        let latitude = Cesium.Math.toDegrees(result.latitude);


        this.viewer.camera.flyTo({
            destination : new Cesium.Cartesian3.fromDegrees(longitude,  latitude, 1000.0)
        });
    }

    private getPoint(angle:number, origem_lon:number, origem_lat:number) {

        if(angle > 360)
            angle = angle % 360;

        let dist = 500;
        let teta = Cesium.Math.toRadians(angle);

        //p0
        let p0_lon = origem_lon;
        let p0_lat = origem_lat + 0.005;
        let p0 = new Cesium.Cartesian3.fromDegrees(p0_lon, p0_lat);

        //distance
        let x = dist * Math.cos(teta);
        let y = dist * Math.sin(teta);
        let offset = new Cesium.Cartesian3(x, y);

        //New point
        let result = new Cesium.Cartesian3();
        Cesium.Cartesian3.add(p0, offset, result);

        return Cesium.Cartographic.fromCartesian(result);
    }

    private addAis() {
        let ais : Array<AisJSON> = JSON.parse(JSON.stringify(this.state.data));
        this.ais = ais; //copy

        for (let i = 0; i < ais.length/4; i++) {

            let origin = new Cesium.Cartesian3.fromDegrees(ais[i].longitude, ais[i].latitude);
            origin = Cesium.Cartographic.fromCartesian(origin);
            let result = this.getPoint(ais[i].cog, ais[i].longitude, ais[i].latitude);

            let heading = ais[i].heading;
            if(heading > 360)
                heading = heading % 360;

            this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(ais[i].longitude, ais[i].latitude),
                billboard: {
                    image: "../images/navigation-arrow-white-25perc.png",
                    rotation: Cesium.Math.toRadians(heading),
                    color: Cesium.Color.RED,
                    scale: 0.2,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                        0.0,
                        200000.0
                    ),

                },
                name: ais[i].name + "-heading"
            });

            this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(ais[i].longitude, ais[i].latitude),
                name: ais[i].name + "-cog",
                polyline: {
                    positions: Cesium.Cartesian3.fromRadiansArray([
                        origin.longitude,
                        origin.latitude,
                        result.longitude,
                        result.latitude
                    ]),
                    width: 5,
                    material: new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.BLACK,
                    }),
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                        0.0,
                        2000000.0
                    ),
                },
            });
        }
    }

    render() {
        const {isLoading, data} = this.state;

        if (!isLoading && !this.isSystemInit) {

            if(this.viewer == null)
                this.initCesium();

            this.addAis();
            this.isSystemInit = true;
        }


        return <div id="TopView" ref={ref => (this.container = ref)} />;
    }


    private initCesium() {
        this.viewer = new Cesium.Viewer('TopView', {
            globe: new Cesium.Globe(),
            timeline: false,
            animation: false,
            scene3DOnly: true,
            skyBox: false,
            vrButton: false,
            skyAtmosphere: false,
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            fullscreenButton: true,
            infoBox: false,
            sceneModePicker: false,
            selectionIndicator: false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            shouldAnimate: false,
            creditContainer: dummyCredit
        });
    }

    public getAis() {
        return this.ais;
    }
}

export default TopView;