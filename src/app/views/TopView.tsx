import React, { Component } from "react";
import Utils from "../utils/Utils";
import Auv from "../components/Auv";
import MenuView from "../utils/MenuTopView";
import AisComponent from "../components/AisComponent";

const Cesium = require('cesium');
const dummyCredit = document.createElement("div");
//const topView = document.createElement("TopView");

class TopView extends Component {
    private viewer: any;
    private aisComponent: AisComponent = new AisComponent(0.1, 1.5,
        new Cesium.NearFarScalar(
            1.5e2,
            0.5,
            8.0e6,
            0.0
        ));

    state = {
        data: [],
        isLoading: true,
        error: false
    };
    private first: boolean = true;
    public showTopView: Boolean = false;

    async componentDidMount() {
        if(this.viewer == null)
            this.initCesium();
    }

    public setCameraView(pos) {
        let result = Cesium.Cartographic.fromCartesian(pos, Cesium.Ellipsoid.WGS84);
        let longitude = Cesium.Math.toDegrees(result.longitude);
        let latitude = Cesium.Math.toDegrees(result.latitude);

        this.viewer.camera.flyTo({
            destination : new Cesium.Cartesian3.fromDegrees(longitude,  latitude, 5000.0)
        });
    }

    render() {
        if (this.state.error) {
            return <h1>Something went wrong.</h1>;
        }

        return (
            <div>
                <MenuView/>
                <div id="TopView"/>
            </div>);
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

    public setTopView(auv) {
        this.aisComponent.update(this.viewer, true, auv);
        this.setAuvPosition(auv);
        this.setCameraView(auv.getPosition());
    }

    public setAuvPosition(auv: Auv) {
        let result = Cesium.Cartographic.fromCartesian(auv.getPosition(), Cesium.Ellipsoid.WGS84);
        let longitude = Cesium.Math.toDegrees(result.longitude);
        let latitude = Cesium.Math.toDegrees(result.latitude);

        let e = this.viewer.entities.getById(auv.name);
        if(e !== undefined){
            e.position = Cesium.Cartesian3.fromDegrees(longitude, latitude);
            return;
        }

        this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
            billboard: {
                //Icons made by photo3idea_studiofrom  www.flaticon.com<
                image: "../images/auv.png",
                rotation: Cesium.Math.toRadians(auv.heading % 360),
                color: Cesium.Color.ORANGERED,
                scale: 0.075,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                    0.0,
                    20000.0
                )
            },
            name: auv.name,
            id: auv.name
        });
    }

    reset(){
        this.viewer.entities.removeAll();
    }
}

export default TopView;