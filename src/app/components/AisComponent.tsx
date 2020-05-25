import React from 'react';
import Utils from "../utils/Utils";
import {AisJSON} from "../utils/AisUtils";
import AisProvider from "../utils/AisProvider";
import Auv from "./Auv";

const Cesium = require('cesium');


class AisComponent {
    private ais: Array<AisJSON> = [];
    private scale: any;
    private scaleByDistance: any;
    private width: any;
    private static aisDensityLayer: any = null;
    private startTime: any;
    private stopTime: any;
    public isAnimating : boolean = false;
    public legendTime : HTMLImageElement | undefined;
    private img = document.createElement('img');

    constructor(scale, width, scaleByDistance){
        this.scale = scale;
        this.scaleByDistance = scaleByDistance;
        this.width = width;
    }


    /**
     * Request data (http) and add to the given cesium viewer to render
     * */
    update(viewer: Cesium.Viewer, isVisible: boolean, auv?: Auv) {

        if(!isVisible){
            this.clear(viewer);
            return;
        }

        let latMax, latMin, lonMax, lonMin;
        if(auv === undefined) {
            console.log("fui pelo main view!!!");
            latMax = 42.0;
            latMin = 36.5;
            lonMax = -7.25;
            lonMin  = -10.25;}
        else{
            latMax = auv.latitude + 0.03;
            latMin = auv.latitude - 0.03;
            lonMax = auv.longitude + 0.05;
            lonMin  = auv.longitude - 0.05;
        }

        let aisProvider = new AisProvider();
        aisProvider.getAisFromArea(latMax,latMin,lonMax,lonMin).then(response => {
            try{
                this.ais = JSON.parse(response);
                this.render(viewer);
            }
            catch (e) {
                console.error(e.toString());
            }
        });
    }

    public render(viewer: Cesium.Viewer) {
        for (let i = 0; i < this.ais.length; i++) {
            let entity = viewer.entities.getById(this.ais[i].name);
            if(entity !== undefined) {
                this.updateAisPosition(this.ais[i], entity, viewer);
                entity.show = true;
            }
            else
                this.renderAis(viewer, this.ais[i]);
        }

        this.legendTime = this.img;
    }

    private  renderAis(viewer, ais){
        let origin = Cesium.Cartographic.fromDegrees(ais.longitude, ais.latitude);
        let result = Utils.getPointFromAngleAndPoint(ais.cog, ais.longitude, ais.latitude);
        let rotation = Math.round(ais.heading !== 511 ? ais.heading : ais.cog);

        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(ais.longitude, ais.latitude),
             polyline: {
                 positions: Cesium.Cartesian3.fromRadiansArray([
                     origin.longitude,
                     origin.latitude,
                     result.longitude,
                     result.latitude
                 ]),
                 width: this.width,
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
                rotation: Cesium.Math.toRadians(Utils.normalRelativeAngle(rotation)),
                color: this.getColorVessel(ais),
                scale: this.scale,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                    0.0,
                    2000000.0
                ),
                scaleByDistance : this.scaleByDistance
            },
            label : {
                text : ais.name + " (" + ais.strtype + ")",
                font : '9px sans-serif',
                showBackground : true,
                horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
                verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                    0.0,
                    500000.0
                ),
                show: false
            },
            name: ais.name,
            id: ais.name,
            show: true
        });
    }

    private updateAisPosition(ais, entity, viewer) {

        let timeTimeline = viewer.clock.currentTime;
        let realTime = Cesium.JulianDate.addHours(Cesium.JulianDate.now(), 1, new Cesium.JulianDate());
        let time = Cesium.JulianDate.secondsDifference(timeTimeline, realTime);

       if(time < 50) {
           this.img.src = "../images/realTimeInfo.png";
           entity.position = Cesium.Cartesian3.fromDegrees(ais.longitude, ais.latitude);

           let origin = Cesium.Cartographic.fromDegrees(ais.longitude, ais.latitude);
           let result = Utils.getPointFromAngleAndPoint(ais.cog, ais.longitude, ais.latitude);
           entity.polyline.positions =  Cesium.Cartesian3.fromRadiansArray([
               origin.longitude,
               origin.latitude,
               result.longitude,
               result.latitude
           ]);
       }
       else {
           this.img.src = "../images/forecastInfo.png";

           let distance = ais.sog * time;
           let result = Utils.getPointFromAngleAndPoint(ais.heading,
               ais.longitude, ais.latitude, distance);
           let futurePos = Cesium.Cartesian3.fromRadians(result.longitude, result.latitude);
           entity.position = futurePos;
           let cogDirectionPos = Utils.getPointFromAngleAndPoint(ais.cog, Cesium.Math.toDegrees(result.longitude), Cesium.Math.toDegrees(result.latitude));
           entity.polyline.positions =  Cesium.Cartesian3.fromRadiansArray([
               cogDirectionPos.longitude,
               cogDirectionPos.latitude,
               result.longitude,
               result.latitude,
           ]);
       }

        let rotation = Math.round(ais.heading !== 511 ? ais.heading : ais.cog);
        entity.billboard.rotation = Cesium.Math.toRadians(Utils.normalRelativeAngle(rotation)) + Cesium.Math.PI;
    }


    getBoundsTime(viewer) {
        //Set bounds of our simulation time
        this.startTime = Cesium.JulianDate.addHours(Cesium.JulianDate.now(), 1, new Cesium.JulianDate());
        this.stopTime = Cesium.JulianDate.addHours(this.startTime, 6, new Cesium.JulianDate());

        //Make sure viewer is at the desired time.
        viewer.clock.startTime = this.startTime.clone();
        viewer.clock.stopTime = this.stopTime.clone();
        viewer.clock.currentTime = this.startTime.clone();
        //viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK;
        viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
        viewer.clock.multiplier = 1;

        //Set timeline to simulation bounds
        viewer.timeline.zoomTo(this.startTime, this.stopTime);
        viewer.clock.canAnimate = true;
        viewer.clock.shouldAnimate = true;


        viewer.screenSpaceEventHandler.setInputAction(function onLeftDown(
            movement) {

            let pickedLabel = viewer.scene.pick(movement.position);

            if(pickedLabel === undefined)
                return;
            pickedLabel.id.label.show = true;
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        viewer.screenSpaceEventHandler.setInputAction(function onLeftUp(
            movement) {
            let pickedLabel = viewer.scene.pick(movement.position);
            if(pickedLabel === undefined)
                return;
            pickedLabel.id.label.show = false;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

    }

    clear(viewer) {
        for (let i = 0; i < this.ais.length; i++) {
            let entity = viewer.entities.getById(this.ais[i].name);
            if(entity !== undefined)
                entity.show = false;
        }

        this.legendTime = undefined;
    }

    private getColorVessel(ais) {
        if(ais.strtype.includes("Cargo") || ais.strtype.includes("Tug Tow") )
            return Cesium.Color.GOLD;

        if(ais.strtype.includes("Fishing"))
            return Cesium.Color.DARKGOLDENROD;

        if(ais.strtype.includes("Military"))
            return Cesium.Color.MEDIUMSLATEBLUE;

        if(ais.strtype.includes("Passenger"))
            return Cesium.Color.GREEN;

        if(ais.strtype.includes("Pleasure Craft") || ais.strtype.includes("Sailing"))
            return Cesium.Color.LIGHTGREEN;

        if(ais.strtype.includes("Tanker") )
            return Cesium.Color.SALMON;

        return Cesium.Color.WHITE;

    }
}
export default AisComponent;