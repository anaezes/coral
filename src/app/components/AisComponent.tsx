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

    constructor(scale, width, scaleByDistance){
        this.scale = scale;
        this.scaleByDistance = scaleByDistance;
        this.width = width;
    }


    /**
     * Request data (http) and add to the given cesium viewer to render
     * */
    update(viewer: Cesium.Viewer, isVisible: boolean, auv?: Auv) {
        let aisProvider = new AisProvider();

        if(auv == undefined) {
            aisProvider.getAllAis().then(response => {
                this.ais = JSON.parse(response);
                console.log(this.ais);
                this.render(viewer, isVisible);
            });
        }
        else {
            let latMax = auv.latitude + 0.03;
            let latMin = auv.latitude - 0.03;
            let lonMax = auv.longitude + 0.05;
            let lonMin  = auv.longitude - 0.05;
            aisProvider.getAisFromArea(latMax,latMin,lonMax,lonMin).then(response => {
                try{
                    this.ais = JSON.parse(response);
                    console.log(this.ais);
                    this.render(viewer, isVisible);
                }
                catch (e) {
                    console.log(e.toString());
                }
            });
        }
    }

    private render(viewer: Cesium.Viewer, isVisible: boolean) {
        console.log("antes");
        if(isVisible) {
            console.log("here");
            for (let i = 0; i < this.ais.length/4; i++) {
                let entity = viewer.entities.getById(this.ais[i].name);
                if(entity !== undefined)
                    entity.show = true;
                else
                    this.renderAis(viewer, this.ais[i]);
            }
        }
        else {
            console.log("remover");
            for (let i = 0; i < this.ais.length/4; i++) {
                let entity = viewer.entities.getById(this.ais[i].name);
                if(entity !== undefined)
                    entity.show = false;
            }
        }
    }

    private  renderAis(viewer, ais){
        let origin = Cesium.Cartographic.fromDegrees(ais.longitude, ais.latitude);
        let result = Utils.getPointFromAngleAndPoint(ais.cog, ais.longitude, ais.latitude);

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
                rotation: Cesium.Math.toRadians(ais.heading % 360),
                color: Cesium.Color.RED,
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
    }
}

export default AisComponent;