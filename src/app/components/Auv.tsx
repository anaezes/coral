import {AuvJSON, Sample, WaypointJSON} from '../utils/AUVUtils';
const SUPERFICE = 0;
const Cesium = require('cesium');


class Auv {
    public name: string;
    public latitude: number = 0;
    public longitude: number = 0;
    public waypoints: Array<WaypointJSON> = [];
    public path : any;
    private startTime: any;
    public stopTime: any;
    public heading: any;
    position: any;
    samples = new Map<string, Sample>();

    constructor(auv: AuvJSON) {
        this.name = auv.name;

        if(auv.plan.length === 0) {
            return;
        }

        let waypoints: Array<WaypointJSON> = JSON.parse(JSON.stringify(auv.plan));
        //this.setVariables(waypoints);

        this.waypoints = waypoints;
        this.longitude = this.waypoints[0].longitude;
        this.latitude = this.waypoints[0].latitude;
        this.startTime = this.waypoints[0].eta;
        this.stopTime = this.waypoints[this.waypoints.length-1].eta;

        this.heading = auv.lastState.heading;
        this.path = this.generatePath();
    }

    generatePath() {
        var property = new Cesium.SampledPositionProperty();
        for (let i = 0; i < this.waypoints.length; i += 1) {
            let depth = SUPERFICE  - this.waypoints[i].depth;
            let time = Cesium.JulianDate.fromDate(new Date(this.waypoints[i]['eta']));
            let position = Cesium.Cartesian3.fromDegrees(this.waypoints[i].longitude, this.waypoints[i].latitude,depth);
            property.addSample(time, position);
        }
        return property;
    }

    public setPosition(position){
        this.position = position;
    }
    public getPosition(){
        return this.position;
    }

    public getPath(){
        return this.path;
    }

    public addSample(sample: Sample) {
        this.samples.set(sample.sampleType, sample);
    }

    public getSamples() {
        return this.samples;
    }

    public getStartTime() {
        return this.startTime;
    }

    public updatePath(waypoints: Array<WaypointJSON>, auvPos){
        waypoints.forEach(waypoint => {
            this.waypoints.push(waypoint);
        })

        this.stopTime = this.waypoints[this.waypoints.length-1].eta;
        this.path = this.generatePath();
    }
};

export default Auv;

