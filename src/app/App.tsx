import React from 'react';
import DatGui, {DatSelect, DatNumber, DatBoolean, DatFolder, DatButton} from "react-dat-gui";
import {AuvJSON, WaypointJSON} from './utils/AUVUtils';
import WaterEffect from "./components/WaterEffect";
import WaterParticles from "./components/WaterParticles";
import TopView from "./views/TopView";
import AisComponent from "./components/AisComponent";
import BathymetryComponent from "./components/BathymetryComponent";
import AuvComponent from "./components/AuvComponent";
import EnvironmentComponent from "./components/EnvironmentComponent";

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
    wavesHeight: boolean,
    wavesVelocity: boolean,
    aisDensity: boolean,
    world_temp: boolean,
    water_temp: boolean,
    salinity: boolean,
    bathymetry: boolean,
    wrecks: boolean

    updatePlan: boolean
}

class App extends React.Component<{}, state> {
    private isSystemInit: boolean = false;
    private options: Array<string> = ['None'];
    private dateOptions: Array<string> = [];
    private auvs: Array<AuvJSON> = [];
    private isUnderwater: boolean = false;
    private CesiumViewer: any;
    private container: any;
    private topView: any;
    private auvComponent = new AuvComponent();
    //private bathymetryComponent = new BathymetryComponent();
    private updateBathymetryIntervalId: any;
    private updateTopViewIntervalId: any;
    private environment = new EnvironmentComponent();
    private aisComponent: AisComponent = new AisComponent(0.2, 2,
        new Cesium.NearFarScalar(
        1.5e2,
        1,
        8.0e6,
        0.0
    ));
    private bathymetryComponent : any;
    private dateMap : Map<string, Date> = new Map<string, Date>();


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
            aisDensity: false,
            wavesHeight: false,
            wavesVelocity: false,
            world_temp: false,
            water_temp: false,
            salinity: false,
            bathymetry: false,
            wrecks: false,
            updatePlan: false,
            date: 'Today',
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

    handleButtonClick = newData => {
        this.environment.clearAllLayer(this.CesiumViewer);
        newData.date = 'Today';
        newData.wavesHeight = false;
        newData.wavesVelocity= false;
        newData.world_temp= false;
        newData.water_temp= false;
        newData.salinity= false;
        newData.bathymetry= false;
        newData.wrecks= false;
        this.setState(prevState => ({
            options: { ...prevState.options, ...newData }
        }));
    }



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
            this.getDates();
            this.createPins();

            this.isSystemInit = true;

        }

        return (
            <div>
                <div id="Container" ref={element => this.container = element}/>
                {this.isUnderwater && options.waterEffects? <div> <WaterEffect/> <WaterParticles/> </div> : <div/>}
                {this.isUnderwater?  this.menuUnderwater() : this.menuSurface()}
                <div id="legend-box">
                    {EnvironmentComponent.legend !== undefined?  <img src={EnvironmentComponent.legend.src}/>  : <div/>}
                </div>
                <TopView ref={element => this.topView = element}/>
            </div>
        );
    }

    menuUnderwater() {
        const {options} = this.state;

        return(
            <DatGui class="mainview" data={options} onUpdate={this.handleUpdate} labelWidth="60%">
                <DatFolder title="AUV Tracking">
                    <DatSelect
                        label="Available AUV's"
                        path="auvActive"
                        options={this.options}/>
                    <DatNumber path='terrainExaggeration' label='Terrain exageration' min={1} max={10} step={1} />
                    <DatBoolean path='waterEffects' label='Water effects' />
                    <DatBoolean path='updatePlan' label='Test update plan' />
                </DatFolder>
            </DatGui>
        );
    }

    menuSurface(){
        const {options} = this.state;
        return(
            <DatGui class="mainview" data={options} onUpdate={this.handleUpdate} labelWidth="60%">
                <DatFolder title="AUV Tracking">
                    <DatSelect
                        label="Available AUV's"
                        path="auvActive"
                        options={this.options}/>
                </DatFolder>
                <DatFolder title="AIS">
                    <DatBoolean path='aisDensity' label='AIS density' />
                    <DatBoolean path='ais' label='AIS' />
                </DatFolder>
                <DatFolder title="Environment" >
                    <DatSelect
                        label="Choose day"
                        path="date"
                        options={this.dateOptions}/>
                    <DatBoolean path='wavesHeight' label='Waves height'/>
                    <DatBoolean path='wavesVelocity' label='Waves velocity'/>
                    <DatBoolean path='salinity' label='Salinity' />
                    <DatBoolean path='water_temp' label='Water temperature'/>
                    <DatBoolean path='world_temp' label='World temperature' />
                    <DatBoolean path='bathymetry' label='Bathymetry' />
                    <DatBoolean path='wrecks' label='Wrecks' />
                    <DatButton label="Reset" onClick={this.handleButtonClick} />
                </DatFolder>
            </DatGui>
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

        //this.CesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;

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
        if(data.auvActive !== this.state.options.auvActive) {
            this.state.options.auvActive = data.auvActive;
            this.CesiumViewer.entities.removeAll();
            this.resetApp();

            if (data.auvActive === 'None') {
                this.CesiumViewer.scene.globe.show = true;
                this.CesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;
                this.CesiumViewer.camera.flyHome(3);
                this.topView.resetView();
                this.createPins();
                this.isUnderwater = false;

                // todo reset timeline

            } else {
                let success = this.auvComponent.setAuv(this.auvs, data.auvActive, this.CesiumViewer);

                if(!success){
                    console.log("Error: please choose another vehicle.");
                    this.createPins();
                    return;
                }

                this.initEnvironment();

                // Bathymetry update
                let auvPosition = this.auvComponent.getAuvEntity().position.getValue(this.CesiumViewer.clock.currentTime);
                this.bathymetryComponent.update(auvPosition, this.CesiumViewer, this.state.options.terrainExaggeration);
                this.updateBathymetryIntervalId = setInterval(this.updateBathymetry.bind(this), 500);

                // Top view
                this.topView.showTopView = true;
                this.updateTopView();
                this.updateTopViewIntervalId = setInterval(this.updateTopView.bind(this), 3000);

                this.isUnderwater = true;
            }
        }

        if(data.terrainExaggeration !== this.state.options.terrainExaggeration) {
            if(this.isUnderwater){
                this.bathymetryComponent.onTerrainExaggeration(this.CesiumViewer, data.terrainExaggeration);
            }
        }

        if(data.ais !== this.state.options.ais)
          this.aisComponent.update(this.CesiumViewer, data.ais);

        if(data.wavesHeight !== this.state.options.wavesHeight){
            this.environment.setWavesHeight(this.CesiumViewer, data.wavesHeight, this.dateMap.get(data.date));
        }

        if(data.wavesVelocity !== this.state.options.wavesVelocity){
            this.environment.setWavesVelocity(this.CesiumViewer, data.wavesVelocity, this.dateMap.get(data.date));
        }

        if(data.water_temp !== this.state.options.water_temp){
            this.environment.setWaterTemp(this.CesiumViewer, data.water_temp, this.dateMap.get(data.date));
        }

        if(data.world_temp !== this.state.options.world_temp){
            this.environment.setWorldTemp(this.CesiumViewer, data.world_temp, this.dateMap.get(data.date));
        }

        if(data.wrecks !== this.state.options.wrecks){
            this.environment.showWrecks(this.CesiumViewer, data.wrecks);
        }

        if(data.salinity !== this.state.options.salinity){
            this.environment.setSalinity(this.CesiumViewer, data.salinity, this.dateMap.get(data.date));
        }

        if(data.bathymetry !== this.state.options.bathymetry){
            this.environment.showBathymetryGlobe(this.CesiumViewer, data.bathymetry);
        }

        if(data.aisDensity !== this.state.options.aisDensity){
            this.environment.showAisDensity(this.CesiumViewer, data.aisDensity);
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
                        wavesHeight : app.state.options.wavesHeight,
                        wavesVelocity: app.state.options.wavesVelocity,
                        aisDensity: app.state.options.aisDensity,
                        world_temp: app.state.options.world_temp,
                        water_temp: app.state.options.water_temp,
                        salinity: app.state.options.salinity,
                        bathymetry: app.state.options.bathymetry,
                        wrecks: app.state.options.wrecks,
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

    private getDates() {
        for(let i = -3; i < 4; i++){
            let date = new Date();
            date.setDate(date.getDate()+i);

            if(date.getDate() === (new Date()).getDate()){
                this.dateOptions.push("Today");
                this.dateMap.set("Today", date );
            }
            else {
                let day = date.getDate().toString();
                let weekday = date.toLocaleString('default', { weekday: 'short' });
                let month = date.toLocaleString('default', { month: 'short' });
                let stringDate = weekday + " " + day + " " + month;
                this.dateOptions.push(stringDate);
                this.dateMap.set(stringDate, date );
            }
        }
    }
};
export default App;