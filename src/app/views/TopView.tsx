import React, { Component } from "react";
import DatGui, {DatSelect} from "react-dat-gui";
import Auv from "../components/Auv";
import AisComponent from "../components/AisComponent";
import EnvironmentComponent from "../components/EnvironmentComponent";
import Utils from "../utils/Utils";

const Cesium = require('cesium');
const dummyCredit = document.createElement("div");
const options = ["None", "AIS Density", "Waves Height", "Waves Velocity","Water temperature", "Salinity", "Bathymetry", "Wrecks" ];

class TopView extends Component {
    private viewer: any;
    private date: any;
    private environment = new EnvironmentComponent();
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
        error: false,
        layerActive: ''
    };
    private showMenu: boolean = false;
    private auvEntity: any;
    private points: any;
    
    async componentDidMount() {
        if (this.viewer == null) {
            this.initCesium();
            this.points = this.viewer.scene.primitives.add(new Cesium.PointPrimitiveCollection());
        }
    }

    public setCameraView(pos) {
        let result = Cesium.Cartographic.fromCartesian(pos, Cesium.Ellipsoid.WGS84);
        let longitude = Cesium.Math.toDegrees(result.longitude);
        let latitude = Cesium.Math.toDegrees(result.latitude);

        this.viewer.camera.flyTo({
            destination: new Cesium.Cartesian3.fromDegrees(longitude, latitude, 550.0)
        });

        this.showMenu = true;
    }

    handleUpdate = newData =>
        this.updateRender(newData);

    render() {
        if (this.state.error) {
            return <h1>Something went wrong.</h1>;
        }

        return (
            <div>
                <div id="TopView"/>
                { this.showMenu ? <DatGui id='my-gui-container' class='my-gui-container topView' data={this.state} onUpdate={this.handleUpdate}
                        labelWidth="0" style={{position: "absolute", top: "2px", left: "2px", width: "10%"}}>
                    <DatSelect
                        label="Views"
                        path="layerActive"
                        options={options}/>
                </DatGui> : <div/> }
            </div>
        );
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
            fullscreenButton: false,
            infoBox: false,
            sceneModePicker: false,
            selectionIndicator: false,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            shouldAnimate: false,
            creditContainer: dummyCredit
        });

        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(-6.5, 40.0, 2000000),
            duration: 0
        });
    }

    public setTopView(auv, hpr, time) {
        this.aisComponent.update(this.viewer, true, auv);
        this.setAuvPosition(auv, hpr);
        //this.setCameraView(auv.getPosition());
        this.viewer.clock.currentTime = time.clone();
    }

    public setAuvPosition(auv: Auv, hpr) {
        let result = Cesium.Cartographic.fromCartesian(auv.getPosition(), Cesium.Ellipsoid.WGS84);
        let longitude = Cesium.Math.toDegrees(result.longitude);
        let latitude = Cesium.Math.toDegrees(result.latitude);
        let heading = Utils.normalRelativeAngle(180 - Cesium.Math.toDegrees(hpr.heading));

        if (this.auvEntity !== undefined) {
            this.auvEntity.position = Cesium.Cartesian3.fromDegrees(longitude, latitude);
            this.auvEntity.billboard.rotation = Cesium.Math.toRadians(heading);

            this.points.add({
                position : Cesium.Cartesian3.fromDegrees(longitude, latitude),
                color : Cesium.Color.YELLOW,
                pixelSize: 2
            });

            return;
        }

        this.date = new Date(auv.getStartTime());
        this.auvEntity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
            billboard: {
                //Icons made by photo3idea_studiofrom  www.flaticon.com<
                image: "../images/auv.png",
                rotation: Cesium.Math.toRadians(heading),
                color: Cesium.Color.ORANGERED,
                scale: 0.06,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                    0.0,
                    12000.0
                ),
                eyeOffset: new Cesium.Cartesian3(0.0, 0.0, -20)
            },
            name: auv.name,
            id: auv.name,
            viewFrom: new Cesium.Cartesian3(0, 0, 12000)
        });

        this.showMenu = true;

        let viewer = this.viewer;
        this.viewer.flyTo(this.auvEntity).then(() => {
            viewer.trackedEntity = this.auvEntity;
        })

        this.points.add({
            position : Cesium.Cartesian3.fromDegrees(longitude, latitude),
            color : Cesium.Color.YELLOW,
            pixelSize: 2
        });
    }

    reset() {
        this.viewer.entities.removeAll();
        this.date = new Date();
        this.showMenu = false;
    }

    private updateRender(data: any) {

        if (data.layerActive !== this.state.layerActive) {
            this.environment.clearAllLayer(this.viewer);

            switch(data.layerActive.toString()) {
                case "Waves Height": {
                    this.environment.setWavesHeight(this.viewer, true, this.date);
                    break;
                }
                case "Waves Velocity": {
                    this.environment.setWavesVelocity(this.viewer, true, this.date);
                    break;
                }
                case "Water temperature": {
                    this.environment.setWaterTemp(this.viewer, true, this.date);
                    break;
                }
                case "Salinity": {
                    this.environment.setSalinity(this.viewer, true, this.date);
                    break;
                }
                case "AIS Density": {
                    this.environment.showAisDensity(this.viewer);
                    break;
                }
                case "Bathymetry": {
                    this.environment.showBathymetryGlobe(this.viewer);
                    break;
                }
                case "Wrecks": {
                    this.environment.showWrecks(this.viewer);
                    break;
                }
            }

            // eslint-disable-next-line
            this.state.layerActive = data.layerActive;
        }

        this.setState(prevState => ({
            state: {...prevState, ...data.layerActive}
        }));
    }

    resetView() {
        this.auvEntity = undefined;
        this.points.removeAll();
        this.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(-6.5, 40.0, 2000000),
            duration: 3
        });
    }

}

export default TopView;