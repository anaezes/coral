import {AuvJSON, WaypointJSON} from '../utils/AUVUtils';
const HEIGHT = 150.0;
const Cesium = require('cesium');


class Auv {
    public name: string;
    public latitude: number = 0;
    public longitude: number = 0;
    public waypoints: Array<WaypointJSON> = [];
    public path : any;
    public startTime: any;
    public stopTime: any;
    public heading: any;
    position: any;


    constructor(auv: AuvJSON) {
        this.name = auv.name;

        if(auv.plan.waypoints.length === 0) {
            console.log("ERROR: " + auv.plan.waypoints.length);
            return;
        }

        // @todo copy
        let w: Array<WaypointJSON> = JSON.parse(JSON.stringify(auv.plan.waypoints));
        this.waypoints = w;

        this.longitude = this.waypoints[0].longitude;
        this.latitude = this.waypoints[0].latitude;

        this.startTime = this.waypoints[0].arrivalDate;
        this.stopTime = this.waypoints[this.waypoints.length-1].arrivalDate;

        this.heading = auv.lastState.heading;

        this.path = this.generatePath();
    }

    generatePath() {
        var property = new Cesium.SampledPositionProperty();

        for (let i = 0; i < this.waypoints.length; i += 1) {

            let time = Cesium.JulianDate.fromDate(new Date(this.waypoints[i]['arrivalDate']));
            var position = Cesium.Cartesian3.fromDegrees(this.waypoints[i].longitude, this.waypoints[i].latitude, HEIGHT);
            property.addSample(time, position);

            // debug
            // //Also create a point for each sample we generate.
            // this.CesiumViewer.entities.add({
            //     position : position,
            //     point : {
            //         pixelSize : 8,
            //         color : Cesium.Color.TRANSPARENT,
            //         outlineColor : Cesium.Color.YELLOW,
            //         outlineWidth : 3
            //     }
            // });
        }
        return property;
    }

    public setPosition(position){
        this.position = position;
    }
    public getPosition(){
        return this.position;
    }
};

export default Auv;

