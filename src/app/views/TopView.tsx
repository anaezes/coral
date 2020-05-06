import React, { Component } from "react";
import {ButtonGroup, Button} from '@material-ui/core';
import {AisJSON} from "../utils/AisUtils";
import Utils from "../utils/Utils";
import Auv from "../components/Auv";
import MenuView from "../utils/MenuTopView";

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

        if(this.viewer == null)
            this.initCesium();
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

        for (let i = 0; i < ais.length/4; i++) {

            let origin = Cesium.Cartographic.fromDegrees(ais[i].longitude, ais[i].latitude);
            let result = Utils.getPointFromAngleAndPoint(ais[i].cog, ais[i].longitude, ais[i].latitude);

            this.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(ais[i].longitude, ais[i].latitude),
                polyline: {
                    positions: Cesium.Cartesian3.fromRadiansArray([
                        origin.longitude,
                        origin.latitude,
                        result.longitude,
                        result.latitude
                    ]),
                    width: 2,
                    material: new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.BLACK,
                    }),
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                        0.0,
                        2000000.0
                    )
                },
                billboard: {
                    image: "../images/navigation-arrow-white-25perc.png",
                    rotation: Cesium.Math.toRadians(ais[i].heading % 360),
                    color: Cesium.Color.RED,
                    scale: 0.2,
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                        0.0,
                        2000000.0
                    ),
                    scaleByDistance : new Cesium.NearFarScalar(
                        1.5e2,
                        1,
                        8.0e6,
                        0.0
                    )
                },
                name: ais[i].name,
                id: ais[i].name
            });
        }
    }

    handleClick = (event) => {
        //setAnchorEl(event.currentTarget);
    };

    render() {
        const {isLoading, data} = this.state;

        if (!isLoading && !this.isSystemInit) {
            this.addAis();
            this.isSystemInit = true;

            //this.addButton("test", onclick, "toolbar")
        }
        return (
        <div>
            <div>
                <MenuView/>
            </div>
            <div id="TopView"/>
        </div>);
    }

    /*
    <ButtonGroup
                    color="primary"
                    size="small"
                    aria-label="contained primary button group"
                    variant="contained">
                    <Button >Vessels</Button>
                    <Button>Waves</Button>
                    <Button>Combined</Button>
                </ButtonGroup>
    */

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

    public setAuvPosition(auv: Auv) {
        this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(auv.longitude, auv.latitude),
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
}

export default TopView;