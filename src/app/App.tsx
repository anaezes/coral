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
const urlAuvs =  'https://ripples.lsts.pt/imcrouter/imc/systems/';
//const urlAuvs =  'https://cors-anywhere.herokuapp.com/https://ripples.lsts.pt/soi';
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
    private updateBathymetryIntervalId: any;
    private updateTopViewIntervalId: any;
    private updateEnvironmentIntervalId: any;
    private updateAisIntervalId: any;
    private environmentComponent = new EnvironmentComponent();
    private aisComponent: AisComponent = new AisComponent(0.1, 1.5,
        new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5));
    private bathymetryComponent : any;
    private dateMap : Map<string, Date> = new Map<string, Date>();

    public legendTime : HTMLImageElement | undefined;
    private img = document.createElement('img');


    state = {
        data: [],
        wsMsg: [],
        isLoading: true,
        error: false,
        options: {
            auvActive: '',
            terrainExaggeration: 1,
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
        this.initCesium();

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

    handleButtonResetLayersClick = (event: any) =>{
        let target = event.currentTarget;
        this.resetEnvironmentLayers();
    }

    handleButtonResetTimelineClick = (event: any) =>{
        let target = event.currentTarget;
        this.aisComponent.getBoundsTime(this.CesiumViewer);
    }

    /**
     * Main rendering loop
     */
    render() {
        const {isLoading, data, options} = this.state;

        if (!isLoading && !this.isSystemInit) {
            this.getAuvs();
            this.getDates();
            this.createPins();
            this.isSystemInit = true;
            this.topView = new TopView(this.props);
        }

        //this.updateLabelTime();

        return (
            <div>
                <div id="Container" ref={element => this.container = element}/>
                {this.isUnderwater && options.waterEffects? <div> <WaterEffect/> <WaterParticles/> </div> : <div/>}
                {this.isUnderwater?  this.menuUnderwater() : this.menuSurface()}
                <div id="legend-env-box">
                    {EnvironmentComponent.legend !== undefined?  <img src={EnvironmentComponent.legend.src}/>  : <div/>}
                </div>
                <div id="legend-timeline">
                    {this.legendTime !== undefined?  <img src={this.legendTime.src}/>  : <div/>}
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
                    <DatNumber path='terrainExaggeration' label='Terrain exageration' min={1} max={8} step={1} />
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
                <DatFolder title="Environment" >
                    <DatSelect
                        label="Choose day"
                        path="date"
                        options={this.dateOptions}/>
                    <DatBoolean path='wavesHeight' label='Waves height'/>
                    <DatBoolean path='wavesVelocity' label='Sea water velocity'/>
                    <DatBoolean path='salinity' label='Salinity' />
                    <DatBoolean path='water_temp' label='Water temperature'/>
                    <DatBoolean path='bathymetry' label='Bathymetry' />
                    <DatBoolean path='wrecks' label='Wrecks' />
                    <DatButton label="Reset" onClick={this.handleButtonResetLayersClick} />
                </DatFolder>
                <DatFolder title="AIS">
                    <DatBoolean path='aisDensity' label='AIS density' />
                    <DatBoolean path='ais' label='AIS'/>
                </DatFolder>
                <DatButton label="Reset timeline" onClick={this.handleButtonResetTimelineClick} />
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
        globe.depthTestAgainstTerrain = false;

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
            shouldAnimate: false, // Enable
            canAnimate: false,
            requestRenderMode: false,
            creditContainer: dummyCredit,
            showWaterEffect: true
        });

        this.CesiumViewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(0.0, 25.0, 40000000),
            duration: 0
        });

        this.CesiumViewer.terrainProvider = Cesium.createWorldTerrain({
            requestWaterMask: true,
           // requestVertexNormals: true
        });

        this.CesiumViewer.scene.globe.enableLighting = true;

        // Debug
        //this.CesiumViewer.extend(Cesium.viewerCesiumInspectorMixin);
        //this.CesiumViewer.extend(Cesium.viewerCesium3DTilesInspectorMixin);

        //Set the random number seed for consistent results.
        Cesium.Math.setRandomNumberSeed(3);

        this.CesiumViewer.scene.fog.enabled = true;
        this.CesiumViewer.scene.fog.density = 2.0e-4;

        this.CesiumViewer.animation.viewModel.setShuttleRingTicks([0, 1500]);

        // Set bounds timeline [now, +6h]
        this.aisComponent.getBoundsTime(this.CesiumViewer);



        // Update layers event listeners
        let app = this;
        let updateAnimation = false;
        this.CesiumViewer.clock.onTick.addEventListener(function(){
            updateAnimation = app.updateLayerTime(updateAnimation);
            app.updateLabelTime();
        });

        let updateTimeline = false;
        const eventObj = {
            handleEvent(e) {
                updateTimeline = app.updateLayerTime(updateTimeline);
                app.updateLabelTime();
            }
        }
        this.CesiumViewer.timeline.container.addEventListener('click', eventObj);
    }

    updateLayerTime(update) {
        let currentTime = Cesium.JulianDate.toGregorianDate(this.CesiumViewer.clock.currentTime);
        if(!update && currentTime.minute > 30 && currentTime.minute < 32) {
            let date = this.dateMap.get(this.state.options.date)
            this.environmentComponent.updateLayersTime(this.CesiumViewer, date);
            return true;
        }
        if(currentTime.minute === 0)
            return false;
        return update;
    }


    /**
     * Handles user input and updates components accordingly
     */
    private updateRender(data) : void {
        if(data.auvActive !== this.state.options.auvActive) {
            this.state.options.auvActive = data.auvActive;

            this.resetApp()
            this.CesiumViewer.entities.removeAll()

            if (data.auvActive === 'None') {
                this.CesiumViewer.scene.globe.depthTestAgainstTerrain = false;
                this.CesiumViewer.scene.globe.show = true;
                this.CesiumViewer.scene.backgroundColor = Cesium.Color.BLACK;

                this.CesiumViewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(0.0, 25.0, 40000000),
                    duration: 3
                });

                this.topView.resetView();
                this.createPins();
                this.isUnderwater = false;

                // todo reset timeline
                this.CesiumViewer.clock.canAnimate = true;
                this.CesiumViewer.clock.shouldAnimate = true;

            } else {

                this.CesiumViewer.scene.globe.depthTestAgainstTerrain = true;
                let success = this.auvComponent.setAuv(this.auvs, data.auvActive, this.CesiumViewer);

                if(!success){
                    console.log("Error: please choose another vehicle.");
                    this.createPins();
                    return;
                }

                //Environment update
                let auvPosition = this.auvComponent.getAuvEntity().position.getValue(this.CesiumViewer.clock.currentTime);
                //this.environmentComponent.update(auvPosition, this.CesiumViewer);
                this.updateEnvironmentIntervalId = setInterval(this.updateEnvironment.bind(this), 500);

                // Bathymetry update
                //let auvPosition = this.auvComponent.getAuvEntity().position.getValue(this.CesiumViewer.clock.currentTime);
                this.bathymetryComponent.update(auvPosition, this.CesiumViewer, this.state.options.terrainExaggeration);
                this.updateBathymetryIntervalId = setInterval(this.updateBathymetry.bind(this), 500);

                // Top view
                this.updateTopView();
                this.updateTopViewIntervalId = setInterval(this.updateTopView.bind(this), 500);

                this.isUnderwater = true;
            }
        }

        if(data.terrainExaggeration !== this.state.options.terrainExaggeration) {
            if(this.isUnderwater){
                this.bathymetryComponent.onTerrainExaggeration(this.CesiumViewer, data.terrainExaggeration);
            }
        }

        if(data.ais !== this.state.options.ais) {
            if(data.ais) {
                this.aisComponent.getBoundsTime(this.CesiumViewer);
                this.updateAis();
                this.aisComponent.setLabels(this.CesiumViewer);
                this.updateAisIntervalId  = setInterval(this.updateAis.bind(this), 3000);
            }
            else {
                this.aisComponent.update(this.CesiumViewer, false);
                clearInterval(this.updateAisIntervalId);
            }
        }

        if(data.wavesHeight !== this.state.options.wavesHeight){
            this.environmentComponent.setWavesHeight(this.CesiumViewer, data.wavesHeight, this.dateMap.get(data.date));
        }

        if(data.wavesVelocity !== this.state.options.wavesVelocity){
            this.environmentComponent.setWavesVelocity(this.CesiumViewer, data.wavesVelocity, this.dateMap.get(data.date));
        }

        if(data.water_temp !== this.state.options.water_temp){
            this.environmentComponent.setWaterTemp(this.CesiumViewer, data.water_temp, this.dateMap.get(data.date));
        }

        if(data.wrecks !== this.state.options.wrecks){
            this.environmentComponent.showWrecks(this.CesiumViewer, data.wrecks);
        }

        if(data.salinity !== this.state.options.salinity){
            this.environmentComponent.setSalinity(this.CesiumViewer, data.salinity, this.dateMap.get(data.date));
        }

        if(data.bathymetry !== this.state.options.bathymetry){
            this.environmentComponent.showBathymetryGlobe(this.CesiumViewer, data.bathymetry);
        }

        if(data.aisDensity !== this.state.options.aisDensity){
            this.environmentComponent.showAisDensity(this.CesiumViewer, data.aisDensity);
        }

        if(data.updatePlan !== this.state.options.updatePlan){
            let newPlan : Array<WaypointJSON> = JSON.parse(JSON.stringify(waypoints.waypoints));
            this.auvComponent.updatePath(newPlan, this.CesiumViewer);
        }

        if(data.date !== this.state.options.date){
            this.environmentComponent.updateLayersTime(this.CesiumViewer, this.dateMap.get(data.date));
        }

        this.setState(prevState => ({
            options: { ...prevState.options, ...data }
        }));
    }

    updateAis() {
        this.aisComponent.update(this.CesiumViewer, true);
    }

    /**
     * Updates top view
     */
    updateTopView() {
        this.auvComponent.getAuvActive().setPosition(this.auvComponent.getAuvEntity().position.getValue(this.CesiumViewer.clock.currentTime));
        let quaternion = this.auvComponent.getAuvEntity().orientation.getValue(this.CesiumViewer.clock.currentTime);
        let hpr = Cesium.HeadingPitchRoll.fromQuaternion(quaternion);
        this.topView.setTopView(this.auvComponent.getAuvActive(), hpr, this.CesiumViewer.clock.currentTime);
    }

    /**
     * Updates bathymetry component
     */
    updateBathymetry() : void {
        let auvPosition = this.auvComponent.getAuvEntity().position.getValue(this.CesiumViewer.clock.currentTime);
        this.bathymetryComponent.update(auvPosition, this.CesiumViewer, this.state.options.terrainExaggeration);
    }

    /**
     * Updates bathymetry component
     */
    updateEnvironment() : void {
        let auvPosition = this.auvComponent.getAuvEntity().position.getValue(this.CesiumViewer.clock.currentTime);
        this.environmentComponent.update(auvPosition, this.CesiumViewer);
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

                if(app.isUnderwater)
                    return;

                if(pickedLabel === undefined)
                    return;

                if(app.options.includes(pickedLabel.id.id)){
                    if (Cesium.defined(pickedLabel)) {
                        let d: MenuOptions = {
                            auvActive : pickedLabel.id.id,
                            terrainExaggeration : app.state.options.terrainExaggeration,
                            waterEffects : app.state.options.waterEffects,
                            ais : app.state.options.ais,
                            wavesHeight : app.state.options.wavesHeight,
                            wavesVelocity: app.state.options.wavesVelocity,
                            aisDensity: app.state.options.aisDensity,
                            water_temp: app.state.options.water_temp,
                            salinity: app.state.options.salinity,
                            bathymetry: app.state.options.bathymetry,
                            wrecks: app.state.options.wrecks,
                            updatePlan : app.state.options.updatePlan
                        };
                        app.updateRender(d);
                    }
                }
            },
            Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }


    /**
     * Processes the data of the auvs requested from the server
     */
    private getAuvs() : void {
        let auvs : Array<AuvJSON> = JSON.parse(JSON.stringify(this.state.data));
        let temp: Array<AuvJSON> = [];
        for (let i = 0; i < auvs.length; i++) {
            if(auvs[i].type === 'UUV'){
                temp.push(auvs[i]);
                this.options.push(auvs[i].name);
            }
        }
        this.auvs = temp;
    }

    resetApp(){
        clearInterval(this.updateBathymetryIntervalId);
        clearInterval(this.updateTopViewIntervalId);
        clearInterval(this.updateEnvironmentIntervalId);

        //this.CesiumViewer.destroy();
        //this.initCesium();

        this.aisComponent.getBoundsTime(this.CesiumViewer);

        this.topView.reset();
        this.resetEnvironmentLayers();

        if(this.bathymetryComponent !== undefined)
            this.bathymetryComponent.tiles.forEach(tile => {
                this.bathymetryComponent.removeTile(tile, this.CesiumViewer);
            });

        this.environmentComponent = new EnvironmentComponent();
        this.bathymetryComponent = new BathymetryComponent();
        this.auvComponent = new AuvComponent();

        this.aisComponent.update(this.CesiumViewer, false);
        clearInterval(this.updateAisIntervalId);
        this.aisComponent = new AisComponent(0.2, 2,
            new Cesium.NearFarScalar(
                1.5e2,
                1,
                8.0e6,
                0.0
            ));

        this.CesiumViewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOWN);
        this.CesiumViewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_UP);
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

    private updateLabelTime() {

        if (this.CesiumViewer === undefined)
            return;

        let timeTimeline = this.CesiumViewer.clock.currentTime;
        let realTime = Cesium.JulianDate.addHours(Cesium.JulianDate.now(), 1, new Cesium.JulianDate());
        let time = Cesium.JulianDate.secondsDifference(timeTimeline, realTime).toFixed(1);


        if (time < -60.0) {
            this.img.src = "../images/replayInfo.png";
        } else if (time > 20.0) {
            this.img.src = "../images/forecastInfo.png";
        } else {
            this.img.src = "../images/realTimeInfo.png";
        }

        this.legendTime = this.img;

        this.forceUpdate();
    }


    private resetEnvironmentLayers() {
        this.environmentComponent.clearAllLayer(this.CesiumViewer);
        let newData : any = {};
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
};
export default App;