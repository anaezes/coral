import React from 'react';
import DatGui, {DatSelect, DatNumber, DatBoolean, DatFolder} from "react-dat-gui";
import {AuvJSON, WaypointJSON} from './utils/AUVUtils';
import WaterEffect from "./components/WaterEffect";
import WaterParticles from "./components/WaterParticles";
import TopView from "./views/TopView";
import AisComponent from "./components/AisComponent";
import BathymetryComponent from "./components/BathymetryComponent";
import AuvComponent from "./components/AuvComponent";
import WeatherComponent from "./components/WeatherComponent";

// Data
import waypoints from '../data/waypointsTest.json';

const Cesium = require('cesium');
const DEPTH = 0.0;
const urlAuvs =  'https://ripples.lsts.pt/soi';
const dummyCredit = document.createElement("div");

interface state {
    data: Array<string>,
    wsMsg: Array<string>,
    options: MenuOptions,
    isLoading: Boolean,
    error: Boolean
}

interface MenuOptions {
    auvActive: string,
    terrainExaggeration: number,
    waterEffects: boolean,
    ais: boolean,
    waves: boolean,
    updatePlan: boolean
}

class App extends React.Component<{}, state> {
    private isSystemInit: boolean = false;
    private options: Array<string> = [];
    private auvs: Array<AuvJSON> = [];
    private isReady: boolean = false;
    private CesiumViewer: any;
    private container: any;
    private topView: any;
    //private auvComponent = new AuvComponent();
    //private bathymetryComponent = new BathymetryComponent();
    private updateBathymetryIntervalId: any;
    private updateTopViewIntervalId: any;
    private weather = new WeatherComponent();
    private aisComponent: AisComponent = new AisComponent(0.2, 2,
        new Cesium.NearFarScalar(
        1.5e2,
        1,
        8.0e6,
        0.0
    ));
    private auvComponent: any;
    private bathymetryComponent : any;


    state = {
        data: [],
        wsMsg: [],
        isLoading: true,
        error: false,
        options: {
            auvActive: '',
            terrainExaggeration: 4,
            waterEffects: false,
            ais: false,
            waves: false,
            world_temp: false,
            water_temp: false,
            salinity: false,
            updatePlan: false
        }
    };

    /**
     * Get all available AUV's
     */
    componentDidMount() {
        fetch(urlAuvs)
            .then(response => response.json())
            .then(data =>
                this.setState({
                    data: data,
                    isLoading: false,
                    error: false
                })
            )
            .catch(error => this.setState({error: error, isLoading: false}));

        const ws = new WebSocket('ws://localhost:9090/imcws');
        ws.onmessage = (evt: MessageEvent) => {
            const newData =  JSON.parse(evt.data);
            this.setState((prevState: state) => {

                return {
                    wsMsg: newData
                }
            })
            //console.log(this.state.data);
        };
    }

    componentDidUpdate() {
        // Process data samples
        let msg = JSON.parse(JSON.stringify(this.state.wsMsg));

        if('sampleType' in msg) {
            //TODO verify is sample belongs to active auv!
            if(this.auvComponent !== undefined && this.auvComponent.getAuvActive() !== undefined){
                this.auvComponent.processSample(msg);
            }
        }

        //test change plan
/*        if('plan' in msg) {
            console.log("new plan");
            let newPlan : Array<WaypointJSON> = JSON.parse(JSON.stringify(waypoints.waypoints));
            this.auvComponent.updatePath(newPlan, this.CesiumViewer);
        }*/

    }


    /**
     * Update current state of app with changes from controls
     */
    handleUpdate = newData =>
        this.updateRender(newData);

    /**
     * Main rendering loop
     */
    render() {
        const {isLoading, data, options} = this.state;

        if (!isLoading && !this.isSystemInit) {
            this.topView = new TopView(this.props);

            if(this.CesiumViewer == null)
                this.initCesium();

            this.getAuvs();
            this.createPins();

            this.isSystemInit = true;
        }

        return (
            <div>
                <div id="Container" ref={element => this.container = element}/>
                {this.isReady && options.waterEffects? <div> <WaterEffect/> <WaterParticles/> </div> : <div/>}
                <DatGui data={options} onUpdate={this.handleUpdate}>
                    <DatFolder title="Global Weather">
                        <DatBoolean path='waves' label='Waves'/>
                        <DatBoolean path='water_temp' label='Water temperature'/>
                        <DatBoolean path='world_temp' label='World temperature' />
                        <DatBoolean path='salinity' label='Salinity' />
                    </DatFolder>
                    <DatFolder title="AUV Tracking">
                        <DatNumber path='terrainExaggeration' label='Terrain exageration' min={1} max={10} step={1} />
                        <DatSelect
                            label="Available AUV's"
                            path="auvActive"
                            options={this.options}/>
                        <DatBoolean path='waterEffects' label='Water effects' />
                        <DatBoolean path='updatePlan' label='Test update plan' />
                    </DatFolder>
                    <DatBoolean path='ais' label='AIS' />
                </DatGui>
                <TopView ref={element => this.topView = element}/>/>
            </div>
        );
    }

    /**
     * Init and make the initial cesium viewer settings
     */
    initCesium() : void {
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkOGVmYTBmMC1jMDJjLTQ5' +
            'MTQtYTQwZi1jNjVkOTcyYTQ0MjEiLCJpZCI6MjMxNTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1ODI4MTE0NjB9.' +
            '8bD2ihWXbQPEjqO6CN79XDZ-oTrY7h1S5o8uiT_tvuU';

        // Init scene
        let globe = new Cesium.Globe();
        globe.show = true;

        let skyAtmosphere = new Cesium.SkyAtmosphere();
        skyAtmosphere.show = true;
        skyAtmosphere.brightnessShift = -1;

        this.CesiumViewer = new Cesium.Viewer('Container', {
            animation: true,
            scene3DOnly: true,
            globe: globe,
            skyBox: false,
            vrButton: false,
            shadows: true,
            skyAtmosphere: false,
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            fullscreenButton: true,
            infoBox: true,
            sceneModePicker: false,
            selectionIndicator: true,
            timeline: true,
            navigationHelpButton: false,
            navigationInstructionsInitiallyVisible: false,
            shouldAnimate: false, // Enable animations
            requestRenderMode: false,
            creditContainer: dummyCredit,
            showWaterEffect: true
        });

        this.CesiumViewer.terrainProvider = Cesium.createWorldTerrain({
            requestWaterMask: true,
        });

        this.CesiumViewer.scene.globe.enableLighting = true;

        // Debug
        //this.CesiumViewer.extend(Cesium.viewerCesiumInspectorMixin);
        //this.CesiumViewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);

        this.CesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;

        //Set the random number seed for consistent results.
        Cesium.Math.setRandomNumberSeed(3);

        this.CesiumViewer.scene.fog.enabled = true;
        this.CesiumViewer.scene.fog.density = 2.0e-4;

        this.CesiumViewer.animation.viewModel.setShuttleRingTicks([0, 1500]);
    }

    /**
     * TODO: aplicar isto para vários modelos
     */
    initEnvironment() : void {
        let newLatitude = this.auvComponent.getAuvActive().latitude-0.0005;
        let newLongitude = this.auvComponent.getAuvActive().longitude-0.0003;
        let modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
            Cesium.Cartesian3.fromDegrees(newLongitude, newLatitude, DEPTH+47.5));

        // naufrago
        var viewer = this.CesiumViewer;
        var tileset = viewer.scene.primitives.add(
            new Cesium.Cesium3DTileset({
                url: Cesium.IonResource.fromAssetId(90688),
                modelMatrix : modelMatrix
            })
        );

        // Debug
/*        let dist = Cesium.Cartesian3.distance(new Cesium.Cartesian3.fromDegrees(this.auvComponent.getAuvActive().longitude, this.auvComponent.getAuvActive().latitude),
            new Cesium.Cartesian3.fromDegrees(newLongitude, newLatitude));
        console.log("Distance: " + dist);*/
    }

    /**
     * Handles user input and updates components accordingly
     */
    private updateRender(data) : void {
        if(data.auvActive !== this.state.options.auvActive){
            this.CesiumViewer.entities.removeAll();
            this.resetApp();

            this.auvComponent.update(this.auvs, data.auvActive, this.CesiumViewer);

            this.initEnvironment();

            // Bathymetry update
            let auvPosition = this.auvComponent.getAuvEntity().position.getValue(this.CesiumViewer.clock.currentTime);
            this.bathymetryComponent.update(auvPosition, this.CesiumViewer, this.state.options.terrainExaggeration);
            this.updateBathymetryIntervalId = setInterval(this.updateBathymetry.bind(this), 500);

            // Top view
            this.topView.showTopView = true;
            this.updateTopView();
            this.updateTopViewIntervalId = setInterval(this.updateTopView.bind(this), 3000);

            this.isReady = true;
            this.state.options.auvActive = data.auvActive;
        }

        if(data.terrainExaggeration !== this.state.options.terrainExaggeration) {
            if(this.isReady){
                this.bathymetryComponent.onTerrainExaggeration(this.CesiumViewer, data.terrainExaggeration);
            }
        }

        if(data.ais !== this.state.options.ais)
          this.aisComponent.update(this.CesiumViewer, data.ais);

        if(data.waves !== this.state.options.waves){
            this.weather.setWaves(this.CesiumViewer, data.waves);
        }

        if(data.water_temp !== this.state.options.water_temp){
            this.weather.setWaterTemp(this.CesiumViewer, data.water_temp);
        }

        if(data.world_temp !== this.state.options.world_temp){
            this.weather.setWorldTemp(this.CesiumViewer, data.world_temp);
        }

        if(data.salinity !== this.state.options.salinity){
            this.weather.setSalinity(this.CesiumViewer, data.salinity);
        }

        if(data.updatePlan !== this.state.options.updatePlan){
            let newPlan : Array<WaypointJSON> = JSON.parse(JSON.stringify(waypoints.waypoints));
            this.auvComponent.updatePath(newPlan, this.CesiumViewer);
            //todo reset tiles!
        }

        this.setState(prevState => ({
            options: { ...prevState.options, ...data }
        }));
    }

    /**
     * Updates top view
     */
    updateTopView() {
        this.auvComponent.getAuvActive().setPosition(this.auvComponent.getAuvEntity().position.getValue(this.CesiumViewer.clock.currentTime));
        this.topView.setTopView(this.auvComponent.getAuvActive());
    }

    /**
     * Updates bathymetry component
     */
    updateBathymetry() : void {
        let auvPosition = this.auvComponent.getAuvEntity().position.getValue(this.CesiumViewer.clock.currentTime);
        this.bathymetryComponent.update(auvPosition, this.CesiumViewer, this.state.options.terrainExaggeration);
    }

    /**
     * Create pins to choose auv
     * credits icon: Designed by Freepik from www.flaticon.com
     */
    createPins() : void {
        var pinBuilder = new Cesium.PinBuilder();
        let viewer = this.CesiumViewer;

        this.auvs.forEach(auv => {
            Cesium.when(pinBuilder.fromUrl("../images/propeller.png", Cesium.Color.RED, 30), function(canvas) {
                return viewer.entities.add({
                    id: auv.name,
                    name : auv.name.toString(),
                    position : Cesium.Cartesian3.fromDegrees(auv.lastState.longitude, auv.lastState.latitude, 10),
                    billboard : {
                        image : canvas.toDataURL(),
                        verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
                    },
                    label: {
                        text: auv.name,
                        font: "12px sans-serif",
                        showBackground: true,
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                            0.0,
                            20000000.0
                        )

                    }
                });
            });
        });

        var app = this;
        viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(
            movement) {
                var pickedLabel = viewer.scene.pick(movement.position);

                //do nothing
                if(app.auvComponent.getAuvActive() !== undefined)
                    return;

                if (Cesium.defined(pickedLabel)) {
                    let d: MenuOptions = {
                        auvActive : pickedLabel.id.id,
                        terrainExaggeration : app.state.options.terrainExaggeration,
                        waterEffects : app.state.options.waterEffects,
                        ais : app.state.options.ais,
                        waves : app.state.options.waves,
                        updatePlan : app.state.options.updatePlan
                    };
                    app.updateRender(d);
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    /**
     * Processes the data of the auvs requested from the server
     */
    private getAuvs() : void {
        let auvs : Array<AuvJSON> = JSON.parse(JSON.stringify(this.state.data));
        this.auvs = auvs; //copy

        for (let i = 0; i < this.auvs.length; i++) {
            this.options.push(this.auvs[i].name);
        }
    }

    resetApp(){
        clearInterval(this.updateBathymetryIntervalId);
        clearInterval(this.updateTopViewIntervalId);

        this.topView.reset();

        if(this.bathymetryComponent !== undefined)
            this.bathymetryComponent.tiles.forEach(tile => {
                this.bathymetryComponent.removeTile(tile, this.CesiumViewer);
            });

        this.bathymetryComponent = new BathymetryComponent();
        this.auvComponent = new AuvComponent();

        this.aisComponent = new AisComponent(0.2, 2,
            new Cesium.NearFarScalar(
                1.5e2,
                1,
                8.0e6,
                0.0
            ));
    }
};
export default App;