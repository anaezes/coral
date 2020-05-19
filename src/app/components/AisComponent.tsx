import React from 'react';
import Utils from "../utils/Utils";
import {AisJSON} from "../utils/AisUtils";
import AisProvider from "../utils/AisProvider";
import Auv from "./Auv";
import Ais from "./Ais";
import {TileJSON} from "../utils/TilesUtils";
import Tile from "./Tile";
import {JulianDate} from "cesium";

const Cesium = require('cesium');


class AisComponent {
    private aisMap: Map<string, Ais> = new Map<string, Ais>();

    //private aisEntitys: Array<Cesium.Entity> = [];
    private scale: any;
    private scaleByDistance: any;
    private width: any;
    private static aisDensityLayer: any = null;
    private startTime: any;
    private stopTime: any;
    private isAnimating: boolean = false;
    private view: any;

    constructor(scale, width, scaleByDistance, view){
        this.scale = scale;
        this.scaleByDistance = scaleByDistance;
        this.width = width;

        this.view = view;
    }


    /**
     * Request data (http) and add to the given cesium viewer to render
     * */
    update(viewer: Cesium.Viewer, auv?: Auv) {
        let aisProvider = new AisProvider();

        if(auv == undefined) {
            let latMax = 42.00;
            let latMin = 36.48;
            let lonMax = -7.26;
            let lonMin  = -10.23;
            aisProvider.getAisFromArea(latMax,latMin,lonMax,lonMin).then(response => {
                let t : Array<AisJSON> = JSON.parse(response);
                for (let i = 0; i < t.length/10; i++) {
                    let ais = new Ais(t[i]);
                    this.aisMap.set(ais.name, ais);
                }
                //console.log(this.ais);
                //this.render(viewer);
            });
        }
        else { //top view
            let latMax = auv.latitude + 0.03;
            let latMin = auv.latitude - 0.03;
            let lonMax = auv.longitude + 0.05;
            let lonMin  = auv.longitude - 0.05;
            aisProvider.getAisFromArea(latMax,latMin,lonMax,lonMin).then(response => {
                try{
                    let t : Array<AisJSON> = JSON.parse(response);

                    //console.log(t);
                    for (let i = 0; i < t.length; i++) {
                        let ais = new Ais(t[i]);
                        this.aisMap.set(ais.name, ais);


                    }
                    //console.log(this.ais);
                    //this.render(viewer);
                }
                catch (e) {
                    console.error(e.toString());
                }
            });
        }
    }

    private render(viewer) {
        this.aisMap.forEach(ais => {
            let entity = viewer.entities.getById(ais.name);
            if (entity !== undefined) {
                this.updateAisPosition(ais, entity, viewer);
                entity.show = true;
            } else {
                this.renderAis(viewer, ais);
            }
        })
    }

    removeAis(viewer){
        this.aisMap.forEach(ais => {
            let entity = viewer.entities.getById(ais.name);
            if(entity !== undefined)
                entity.show = false;
        })
    }

    private  renderAis(viewer, ais){
        let origin = Cesium.Cartographic.fromDegrees(ais.longitude, ais.latitude);
        let result = Cesium.Cartographic.fromCartesian(Utils.getPointFromAngleAndPoint(ais.cog, ais.longitude, ais.latitude, 5000));

        let entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(ais.longitude, ais.latitude, 10),
           /* polyline: {
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
            },*/
            billboard: {
                image: "../images/navigation-arrow-white-25perc.png",
                rotation: Cesium.Math.toRadians(ais.heading % 360),
                color: Cesium.Color.GREEN,
                scale: this.scale,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                    0.0,
                    2000000.0
                ),
                scaleByDistance : this.scaleByDistance,
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            },
            name: ais.name,
            id: ais.name,
            show: true
        });
    }

   /* private  renderAis(viewer, ais){
        let origin = Cesium.Cartographic.fromDegrees(ais.longitude, ais.latitude);
        let result =  Cesium.Cartographic.fromCartesian(Utils.getPointFromAngleAndPoint(ais.cog, ais.longitude, ais.latitude, 5000));

        console.log("result");
        console.log(result);

        let path = ais.generatePath(this.startTime, this.stopTime);

        console.log("renderAis: ");
        console.log(path);

        viewer.entities.add({
            availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                    start: this.startTime,
                    stop: this.stopTime
            })]),
            position: path,
            orientation: new Cesium.VelocityOrientationProperty(path),
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
                rotation: Cesium.Math.toRadians(ais.heading % 360),
                color: Cesium.Color.GREEN,
                scale: this.scale,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                    0.0,
                    2000000.0
                ),
                scaleByDistance : this.scaleByDistance
            },
            name: ais.name,
            id: ais.name,
            show: true
        });
    }*/

    private updateAisPosition(ais, entity, viewer) {

        //console.log("updateAisPosition!!!");

       /* let timeTimeline = viewer.clock.currentTime;
        console.log("timeTimeline " + timeTimeline);
        let realTime = Cesium.JulianDate.now();
        console.log("realTime " + realTime);*/

        if(!this.isAnimating){
            //console.log(ais.name);

            entity.position = Cesium.Cartesian3.fromDegrees(ais.longitude, ais.latitude);
            entity.billboard.rotation = Cesium.Math.toRadians(ais.heading % 360);
        }
        else {
            //console.log("update position -> future time!!!" +  ais.name);

            let timeTimeline = viewer.clock.currentTime;
            console.log("timeTimeline " + timeTimeline);
            let realTime = Cesium.JulianDate.now();
            console.log("realTime " + realTime);

            let time = Cesium.JulianDate.secondsDifference(timeTimeline, realTime);
            let distance = ais.sog * time;

            let result = Cesium.Cartographic.fromCartesian(Utils.getPointFromAngleAndPoint(ais.heading,
                ais.longitude, ais.longitude, distance));
            let lastPos = Cesium.Cartesian3.fromRadians(result.longitude, result.latitude);

   /*         if(distance > 0) {
                console.log("distance" + distance);
                console.log("name" + ais.name);
                console.log("POS" + lastPos);
                console.log("POS" + entity.position.getValue(timeTimeline));
            }*/

            entity.position = lastPos;

  /*          if(distance > 0) {
                console.log("POS" + entity.position.getValue(timeTimeline));
            }*/
        }
    }

    getBoundsTime(viewer) {
        //Set bounds of our simulation time
        this.startTime = Cesium.JulianDate.now();
        this.stopTime = Cesium.JulianDate.addHours(this.startTime, 2, new Cesium.JulianDate());

        //Make sure viewer is at the desired time.
        viewer.clock.startTime = this.startTime.clone();
        viewer.clock.stopTime = this.stopTime.clone();
        viewer.clock.currentTime = this.startTime.clone();
        //viewer.clock.clockStep = Cesium.ClockStep.SYSTEM_CLOCK;
        viewer.clock.clockRange = Cesium.ClockRange.CLAMPED;
        viewer.clock.multiplier = 10;

        //Set timeline to simulation bounds
        viewer.timeline.zoomTo(this.startTime, this.stopTime);
        viewer.clock.canAnimate = true;

        let aisComponent = this;
        Cesium.knockout.getObservable(viewer.clockViewModel,
            'shouldAnimate').subscribe(function(isAnimating) {
            if (isAnimating) {
                aisComponent.isAnimating = true;
            } else {
                aisComponent.isAnimating = false;
                //console.log('Cesium clock is paused.');
            }
        });

        viewer.clock.onTick.addEventListener(function(clock) {
            var currentTime = clock.currentTime;
            aisComponent.render(viewer);
        });
    }

}
export default AisComponent;