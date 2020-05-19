import {AisJSON} from "../utils/AisUtils";
import Utils from "../utils/Utils";
const Cesium = require('cesium');


class Ais {
    public id: string;
    public name: string;
    public type: number;
    public cog: number;
    public heading: number;
    public timestamp: any;
    public latitude: number;
    public longitude: number;

    // speed over ground (m/s)
    public sog: number;
    //public path : any;

    constructor(ais: AisJSON) {
        this.id = ais.id;
        this.name = ais.name;
        this.type = ais.type;
        this.cog = ais.cog;
        this.heading = ais.heading;
        this.longitude = ais.longitude;
        this.latitude = ais.latitude;
        this.timestamp = ais.timestamp;
        this.sog = ais.sog;
    }

   /* public generatePath(startTime: Cesium.JulianDate, stopTime: Cesium.JulianDate) {
        let property = new Cesium.SampledPositionProperty();

        let firstPos = Cesium.Cartesian3.fromDegrees(this.longitude, this.longitude);
        property.addSample(startTime, firstPos);

        let time = Cesium.JulianDate.secondsDifference(stopTime, startTime);
        let distance = this.sog * time;
        console.log("distance meters: " + distance);

        let result = Cesium.Cartographic.fromCartesian(Utils.getPointFromAngleAndPoint(this.heading, this.longitude, this.longitude, distance));
        let lastPos = Cesium.Cartesian3.fromRadians(result.longitude, result.latitude);

        property.addSample(stopTime, lastPos);

        return property;
    }*/
}

export default Ais