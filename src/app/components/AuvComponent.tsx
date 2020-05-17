import {AuvJSON, Sample, WaypointJSON} from "../utils/AUVUtils";
import Auv from "./Auv";
import {TileJSON} from "../utils/TilesUtils";
import Tile from "./Tile";


const urlAuvs =  'https://ripples.lsts.pt/soi';
const Cesium = require('cesium');

const HEIGHT = 0.0;

class AuvComponent {
    private auvActive;
    private entityAUV;
    private startTime;
    private stopTime;

    getAuvActive(){
        return this.auvActive;
    }

    getAuvEntity(){
        return this.entityAUV;
    }

    setAuv(auvsOptions, auvChoosed, viewer){
        let i = 0;
        let found = false;
        while(i < auvsOptions.length){
            if(auvChoosed  === auvsOptions[i].name) {
                this.auvActive = new Auv(auvsOptions[i]);

                found = true;
                break;
            }
            i++;
        }

        if(!found || this.auvActive.waypoints.length === 0) {
            console.log("Option not available: waypoints not defined.");
            return false;
        }

        this.getBoundsTime(viewer);
        this.createAuvModel(viewer);

        return true;
    }

    getBoundsTime(viewer) {
        //Set bounds of our simulation time
        this.startTime = Cesium.JulianDate.fromDate(new Date(this.auvActive.startTime));
        this.stopTime = Cesium.JulianDate.fromDate(new Date(this.auvActive.stopTime));

        //Make sure viewer is at the desired time.
        viewer.clock.startTime = this.startTime.clone();
        viewer.clock.stopTime = this.stopTime.clone();
        viewer.clock.currentTime = this.startTime.clone();
        viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP; //Loop at the end
        viewer.clock.multiplier = 10;

        //Set timeline to simulation bounds
        viewer.timeline.zoomTo(this.startTime, this.stopTime);
    }

    createAuvModel(viewer) {
        //viewer.scene.globe = new Cesium.Globe(Cesium.Ellipsoid.WGS84);
        //viewer.scene.globe.baseColor =  new Cesium.Color(0.24,0.24,0.24,1);
        //viewer.scene.globe.fillHighlightColor =  new Cesium.Color(0.24,0.24,0.24,1);
        console.log('globeHeight = ' + viewer.scene.globe.getHeight(new Cesium.Cartographic(this.auvActive.longitude, this.auvActive.latitude)));

        viewer.scene.globe.show = false;
        viewer.scene.backgroundColor = new Cesium.Color(0.043,0.18,0.24,1);


        this.entityAUV = viewer.entities.add({
            id: this.auvActive.name,
            //Set the entity availability to the same interval as the simulation time.
            availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                start: this.startTime,
                stop: this.stopTime
            })]),

            //Use our computed positions
            position: this.auvActive.path,

            //Automatically compute orientation based on position movement.
            orientation: new Cesium.VelocityOrientationProperty(this.auvActive.path),

            //Load the Cesium plane model to represent the entity
            model: {
                uri: '../models/lauv-80.glb',
                minimumPixelSize: 64,
                maximumScale: 1.0,
            },
            scale: 1.0,

            //Show the path as a pink line sampled in 1 second increments.
            path: {
                resolution: 1,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.1,
                    color: Cesium.Color.YELLOW
                }),
                width: 1
            },

            // Color the model slightly blue when the eyepoint is underwater.
            color : new Cesium.Color(0.0, 0.0, 1.0, 1.0),
            colorBlendMode : Cesium.ColorBlendMode.MIX,
            /*colorBlendAmount : new Cesium.CallbackProperty(function(time, result) {
                var underwater = viewer.camera.positionCartographic.height < 0;
                return !underwater ? 1.0 : 0.0;
            }, false),*/


            label: {
                text: new Cesium.CallbackProperty(this.updateSamplesLabel(this.auvActive), false),
                font: "20px sans-serif",
                showBackground: true,
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
                    0.0,
                    100.0
                ),
                eyeOffset: new Cesium.Cartesian3(0, 1.5, 0),
            }
        });


        this.updateCamera(viewer);
    }

    updateCamera(viewer) {

        let longitude = this.auvActive.longitude;
        let latitude = this.auvActive.latitude;

       /* viewer.camera.setView({
            orientation: {
                heading: 0.03295948729686427 + Cesium.Math.PI_OVER_TWO,
                pitch: 0.0, //-Cesium.Math.PI_OVER_TWO (top view)
                roll: 0.0
            },
            destination: Cesium.Cartesian3.fromDegrees(longitude - 0.00015, latitude, HEIGHT + 3)
        });*/


        let entity = this.entityAUV;
        viewer.flyTo(entity).then(function () {
            viewer.trackedEntity = entity;
            viewer.camera.setView({
                orientation: entity.orientation,
                destination: Cesium.Cartesian3.fromDegrees(longitude, latitude - 0.00015, HEIGHT + 5)
            });
            viewer.scene.camera.lookAt(entity.position.getValue(viewer.clock.currentTime), entity.orientation.getValue(viewer.clock.currentTime));
        });
    }

    updateSamplesLabel(auv) {
        return function callbackFunction() {
            let result = "";
            if(auv !== undefined){
                let cartographic = new Cesium.Cartographic.fromCartesian(auv.getPosition());
                result = "Depth: " + (cartographic.height).toFixed(3).toString() + "m";
                auv.getSamples().forEach((sample: Sample, name: string) => {
                    result += "\n" + name + ": " + sample.value;
                    if(name === "Temperature")
                        result += " ºC";
                });
            }
            return result;
        };
    }
    
    processSample(sample: Sample) {
        this.auvActive.addSample(sample);
    }

    updatePath(newPlan: Array<WaypointJSON>, viewer) {
        if(this.auvActive === undefined)
            return;

/*      let auvPosition = this.entityAUV.position.getValue(viewer.clock.currentTime);
        let cartographic = new Cesium.Cartographic.fromCartesian(auvPosition);
        let initPoint = {
            "latitude":Cesium.Math.toDegrees(cartographic.latitude),
            "longitude": Cesium.Math.toDegrees(cartographic.longitude),
            "depth": cartographic.height,
            "arrivalDate": viewer.clock.currentTime
        }*/

        this.auvActive.updatePath(newPlan);
        this.getBoundsTime(viewer);
        viewer.entities.removeById(this.entityAUV.id);
        this.createAuvModel(viewer);
    }


}

export default AuvComponent