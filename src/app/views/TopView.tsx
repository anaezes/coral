import React, { Component } from "react";
import {ButtonGroup, Button} from '@material-ui/core';
import {AisJSON} from "../utils/AisUtils";
import Utils from "../utils/Utils";
import Auv from "../components/Auv";
import MenuView from "../utils/MenuTopView";
import AisProvider from "../components/AisProvider";

const Cesium = require('cesium');
const urlAis =  'https://ripples.lsts.pt/ais';
const dummyCredit = document.createElement("div");

interface viewState {
    data: Array<string>,
    viewer: Cesium.Viewer,
    isLoading: Boolean,
    error: Boolean
}

class TopView extends Component {
    static object_count = 0;

    private container: any;
    //private viewer: any;
    private ais: Array<AisJSON> = [];

    private isSystemInit: boolean = false;
    private vstate;

    constructor(props) {
        super(props);
        TopView.object_count += 1;
        this.handleChange = this.handleChange.bind(this);

        console.log("object_count: " + TopView.object_count);

        this.vstate = {
            data: [],
            isLoading: true,
            error: false,
            viewer: null
        };
    }

    handleChange(e) {
        console.log("state changed!!");
    }


    async componentDidMount() {
        console.log("did mount")
  /*     if(this.viewer == null)
            this.initCesium();*/

        this.vstate = {
            data: [],
            isLoading: true,
            error: false,
            viewer: this.initCesium()
        };

        this.setState(this.vstate);
    }

    public addAis(auv: Auv) {

        let latMax = auv.latitude + 0.03;
        let latMin = auv.latitude - 0.03;
        let lonMax = auv.longitude + 0.05;
        let lonMin = auv.longitude - 0.05;

        let aisProvider = new AisProvider();
        aisProvider.getAisFromArea(latMax, latMin, lonMax, lonMin).then(response => {
            let ais: Array<AisJSON> = JSON.parse(response);

            if(ais.length !== 0) {
                console.log(ais);
                this.renderAis(ais);
            }

            console.log("ais vazio!!!");
        });

    }

    public setCameraView(pos) {

        let result = Cesium.Cartographic.fromCartesian(pos, Cesium.Ellipsoid.WGS84);
        let cartesian = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(result.longitude),
            Cesium.Math.toDegrees(result.latitude), 1000);
        let longitude = Cesium.Math.toDegrees(result.longitude);
        let latitude = Cesium.Math.toDegrees(result.latitude);

        let viewer = this.vstate.viewer;
        viewer.camera.flyTo({
            destination : new Cesium.Cartesian3.fromDegrees(longitude,  latitude, 1000.0)
        });

        this.setState({
            viewer: viewer
        });
    }

    private renderAis(ais) {
        const viewer = this.vstate.viewer;
        for (let i = 0; i < ais.length/4; i++) {

            let origin = Cesium.Cartographic.fromDegrees(ais[i].longitude, ais[i].latitude);
            let result = Utils.getPointFromAngleAndPoint(ais[i].cog, ais[i].longitude, ais[i].latitude);

            viewer.entities.add({
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

        this.setState({
            viewer: viewer
        });
    }

    handleClick = (event) => {
        //setAnchorEl(event.currentTarget);
    };

    public render() {
        const {isLoading, data} = this.vstate;

        if (!isLoading && !this.isSystemInit) {
            //this.addAis();
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
        console.log("init cesium");

         let viewer = new Cesium.Viewer('TopView', {
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

         this.setState({
             viewer: viewer
         });

    }


    public getAis() {
        return this.ais;
    }

    public setAuvPosition(auv: Auv) {
        const viewer = this.vstate.viewer;
        viewer.entities.add({
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

        this.setState({
            viewer: viewer
        });
    }
}

export default TopView;