import React, { Component } from "react";
import DatGui, {DatSelect} from "react-dat-gui";
import Auv from "../components/Auv";
import AisComponent from "../components/AisComponent";
import EnvironmentComponent from "../components/EnvironmentComponent";

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


    async componentDidMount() {
        if (this.viewer == null) {
            this.initCesium();
            //this.viewer.scene.morphTo2D(0);
            //this.viewer.scene.camera.zoomOut(20);
        }
    }

    public setCameraView(pos) {
        let result = Cesium.Cartographic.fromCartesian(pos, Cesium.Ellipsoid.WGS84);
        let longitude = Cesium.Math.toDegrees(result.longitude);
        let latitude = Cesium.Math.toDegrees(result.latitude);

        this.viewer.camera.flyTo({
            destination: new Cesium.Cartesian3.fromDegrees(longitude, latitude, 5000.0)
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

        var west = 180.0;
        var south = 90.0;
        var east = -180.0;
        var north = -90.0;

        var rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

        //Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
        //Cesium.Camera.DEFAULT_VIEW_RECTANGLE = rectangle;

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
            creditContainer: dummyCredit,
            sceneMode : Cesium.SceneMode.SCENE2D,
            mapMode2D: Cesium.MapMode2D.ROTATE
        });

        this.viewer.camera.DEFAULT_VIEW_RECTANGLE = rectangle;

       this.viewer.camera.setView({
            destination: rectangle,
        });

        //Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(0, -89, 170, 89);
        //Cesium.Camera.DEFAULT_VIEW_FACTOR = 1.1;
    }

    public setTopView(auv, time) {
        this.aisComponent.update(this.viewer, true, auv);
        this.setAuvPosition(auv);
        this.setCameraView(auv.getPosition());
        this.viewer.clock.currentTime = time.clone();
    }

    public setAuvPosition(auv: Auv) {
        let result = Cesium.Cartographic.fromCartesian(auv.getPosition(), Cesium.Ellipsoid.WGS84);
        let longitude = Cesium.Math.toDegrees(result.longitude);
        let latitude = Cesium.Math.toDegrees(result.latitude);

        let e = this.viewer.entities.getById(auv.name);
        if (e !== undefined) {
            e.position = Cesium.Cartesian3.fromDegrees(longitude, latitude);
            return;
        }

        //console.log("auv time: " + auv.startTime);
        this.date = new Date(auv.getStartTime());

        console.log("auv.getStartTime()" + auv.getStartTime());

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

    reset() {
        this.viewer.entities.removeAll();
        this.date = new Date();
        this.showMenu = false;
    }

    private updateRender(data: any) {

        if (data.layerActive !== this.state.layerActive) {
            this.environment.clearAllLayer(this.viewer);

            console.log(this.date);

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

            this.state.layerActive = data.layerActive;
        }

        this.setState(prevState => ({
            state: {...prevState, ...data.layerActive}
        }));
    }

    //todo
    resetView() {
/*       var west = 180.0;
        var south = 90.0;
        var east = -180.0;
        var north = -90.0;

        var rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);

        this.viewer.camera.setView({
            destination: rectangle,
        });*/

        this.viewer.camera.flyHome(3);
    }

}

export default TopView;