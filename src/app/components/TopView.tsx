import React, { Component } from "react";
const Cesium = require('cesium');


class TopView extends Component {
    private container: any;
    private viewer: any;

    componentDidMount() {

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
            creditContainer: "Container"
        });
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

    render() {
        return <div id="TopView" ref={ref => (this.container = ref)} />;
    }
}

export default TopView;