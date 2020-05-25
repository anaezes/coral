const Cesium = require('cesium');

export default class Utils {
    static getPointFromAngleAndPoint(angle:number, origin_lon:number, origin_lat:number, distance?:number) {

/*        if(angle > 360)
            angle = angle % 360;*/

        //let angleNormal = Utils.normalRelativeAngle(angle);

        let dist = 5000;
        if(distance !== undefined)
            dist = distance

        let teta = Cesium.Math.toRadians(Utils.normalRelativeAngle(angle));

        //p0
        let p0_lon = origin_lon;
        let p0_lat = origin_lat + 0.005;
        let p0 = new Cesium.Cartesian3.fromDegrees(p0_lon, p0_lat);

        //distance
        let x = dist * Math.cos(teta);
        let y = dist * Math.sin(teta);
        let offset = new Cesium.Cartesian3(x, y);

        //New point
        let result = new Cesium.Cartesian3();
        Cesium.Cartesian3.add(p0, offset, result);

        return Cesium.Cartographic.fromCartesian(result);
    }

    static normalRelativeAngle(angle) {
        if (angle > -180 && angle <= 180) {
            return angle;
        }
        let fixedAngle = angle;

        while (fixedAngle <= -180) {
            fixedAngle += 360;
        }
        while (fixedAngle > 180) {
            fixedAngle -= 360;
        }
        return fixedAngle;
    }
}



