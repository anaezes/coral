import React, { Component } from "react";
import * as THREE from "three";
import * as VFX from "react-vfx";

import fragmentShader from './../shaders/fragment_shader';
import vertexShader from './../shaders/vertex_shader';



const uniforms = {
    resolution: { value: { x: window.innerWidth, y: window.innerHeight } },
    time: { value: 0.0 },
    mouse: { value: { x: null, y: null } },
}

const clock = new THREE.Clock();


class WaterEffect extends Component {
    private container: any;
    private startTime: any;
    private uniforms: any;
    private renderer: any;
    private scene: any;
    private camera: any;
    private done: boolean = false;
    private water: any;

    componentDidMount() {

        this.camera = new THREE.Camera();
        this.camera.position.z = 1;
        this.scene = new THREE.Scene();

        var renderer = new THREE.WebGLRenderer({alpha: true});
        renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(renderer.domElement);

        this.uniforms = {
            time: { type: "f", value: 1.0 },
            resolution: { type: "v2", value: new THREE.Vector2() }
        };

        var material = new THREE.ShaderMaterial( {
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms
        });

        var mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), material );

        // update time uniform
        this.uniforms.time.value = clock.getElapsedTime();
        this.scene.add( mesh );


        this.startTime = Date.now();

        console.log(this.startTime);

        uniforms.resolution.value.x =  window.innerWidth;
        uniforms.resolution.value.y = window.innerHeight;


/*        var scene = new THREE.Scene();

        var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);

        var renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(renderer.domElement);

        var geometry = new THREE.BoxGeometry(1, 1, 1);
        var material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        var cube = new THREE.Mesh(geometry, material);

        scene.add(cube);


        camera.position.z = 5;*/
       var scene = this.scene;
       var camera = this.camera;

        var animate = function() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        animate();
        setInterval(animate.bind(this), 500);
        setInterval(this.update.bind(this), 500);
    }

    update() {
        var elapsedMilliseconds = Date.now() - this.startTime;
        var elapsedSeconds = elapsedMilliseconds / 1000.;
        console.log("elapsedSeconds: " + elapsedSeconds)
        uniforms.time.value = 60. * elapsedSeconds;

        this.forceUpdate();
    }

    render() {
        return (
            <div id="ThreeContainer" ref={ref => (this.container = ref)} />
        )

    }
}

export default WaterEffect;
