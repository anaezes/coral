import React, { Component } from "react";
import * as THREE from "three";

class WaterEffect1 extends Component {
    private container: any;
    private start: any;
    private fov: any;


    componentDidMount() {
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
        var renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(renderer.domElement);
        camera.position.z = 5;

        this.start = Date.now();
        this.fov = 30;

        var clock = new THREE.Clock();

        var timeUniform =  {
            resolution: { value: new THREE.Vector2() },
            mouse: { value: new THREE.Vector2() },
            time: {value: 1.0},
        }

        timeUniform.resolution.value.x = window.innerWidth;
        timeUniform.resolution.value.y = window.innerHeight;

        var material = new THREE.ShaderMaterial({
            uniforms: timeUniform,
            vertexShader: WaterShader.vertexShader,
            fragmentShader: WaterShader.fragmentShader,
            transparent: true,
            opacity: 0.3
        });

        var water = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight, 20),
            material
        );

        scene.add(water);

        var animate = function() {
            requestAnimationFrame(animate);
            timeUniform.time.value += clock.getDelta();
            renderer.render(scene, camera);
        };

        animate();
    }
    render() {
        return <div id="ThreeContainer" ref={ref => (this.container = ref)} />;
    }
}

export default WaterEffect1;


const WaterShader = {

    vertexShader: [`
        void main()	{
            gl_Position = vec4( position, 1.0 );
        }`
    ].join( '\n' ),

    fragmentShader: [ `
#ifdef GL_ES
precision mediump float;
#endif
//Ashok Gowtham M
//UnderWater Caustic lights

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

//normalized sin
float sinn(float x)
{
    return sin(x)/2.+.5;
}

float CausticPatternFn(vec2 pos)
{
    return (sin(pos.x*40.+time)
        +pow(sin(-pos.x*130.+time),1.)
        +pow(sin(pos.x*30.+time),2.)
        +pow(sin(pos.x*50.+time),2.)
        +pow(sin(pos.x*80.+time),2.)
        +pow(sin(pos.x*90.+time),2.)
        +pow(sin(pos.x*12.+time),2.)
        +pow(sin(pos.x*6.+time),2.)
        +pow(sin(-pos.x*13.+time),5.))/2.;
}

vec2 CausticDistortDomainFn(vec2 pos)
{
    pos.x*=(pos.y*.20+.5);
    pos.x*=1.+sin(time/1.)/10.;
    return pos;
}

void main( void ) 
{
    vec2 pos = gl_FragCoord.xy/resolution;
    pos-=.5;
    vec2  CausticDistortedDomain = CausticDistortDomainFn(pos);
    float CausticShape = clamp(7.-length(CausticDistortedDomain.x*20.),0.,1.);
    float CausticPattern = CausticPatternFn(CausticDistortedDomain);
    float CausticOnFloor = CausticPatternFn(pos)+sin(pos.y*100.)*clamp(2.-length(pos*2.),0.,1.);
    float Caustic;
    Caustic += CausticShape*CausticPattern;
    Caustic *= (pos.y+.5)/4.;
    //Caustic += CausticOnFloor;
    float f = length(pos+vec2(-.5,.5))*length(pos+vec2(.5,.5))*(1.+Caustic)/1.;
        
    gl_FragColor = vec4(.1,.5,.6,0.2)*(f);
}
   `].join( '\n' )
};