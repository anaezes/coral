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

    private addAis() {
        let ais : Array<AisJSON> = JSON.parse(JSON.stringify(this.state.data));
        this.ais = ais; //copy

        for (let i = 0; i < ais.length; i++) {
            this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(this.ais[i].longitude, this.ais[i].latitude),
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