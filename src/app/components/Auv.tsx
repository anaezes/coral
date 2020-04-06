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

    /*
    *  Haversine formula
    * */
    getDist(longitude: number, latitude: number, longitudePto: number, latitudePto: number) {
        const R = 6371e3; /* radius of the Earth in meters*/

        latitude = this.degrees_to_radians(latitude);
        latitudePto = this.degrees_to_radians(latitudePto);
        longitude = this.degrees_to_radians(longitude);
        longitudePto = this.degrees_to_radians(longitudePto);

        let dlon = longitudePto - longitude;
        let dlat = latitudePto - latitude;

        let a = Math.sin(dlat/2) * Math.sin(dlat/2) +
            Math.cos(latitude) * Math.cos(latitudePto) *
            Math.sin(dlon/2) * Math.sin(dlon/2);
        let dist = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * dist;
    }

    degrees_to_radians(degrees: number) {
        return degrees * (Math.PI/180);
    }

    generatePath() {
        var property = new Cesium.SampledPositionProperty();

        for (let i = 0; i < this.waypoints.length; i += 1) {

            let time = Cesium.JulianDate.fromDate(new Date(this.waypoints[i]['arrivalDate']));
            var position = Cesium.Cartesian3.fromDegrees(this.waypoints[i].longitude, this.waypoints[i].latitude, i);
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

