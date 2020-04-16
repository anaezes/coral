import React from 'react';
import {AuvJSON, WaypointJSON} from '../utils/AUVUtils';


const Cesium = require('cesium');


class Auv extends React.Component   {
    private name: string;
    public latitude: number = 0;
    public longitude: number = 0;
    public waypoints: Array<WaypointJSON> = [];
    public path : any;
    public startTime: any;
    public stopTime: any;


    constructor(auv: AuvJSON) {
        super(auv)
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

        this.path = this.generatePath();
    }

    generatePath() {
        var property = new Cesium.SampledPositionProperty();

        for (let i = 0; i < this.waypoints.length; i += 1) {

            let time = Cesium.JulianDate.fromDate(new Date(this.waypoints[i]['arrivalDate']));
            var position = Cesium.Cartesian3.fromDegrees(this.waypoints[i].longitude, this.waypoints[i].latitude, 0);
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
};

export default Auv;

