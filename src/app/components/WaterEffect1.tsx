import React, { Component } from "react";
import * as THREE from "three";

class WaterEffect1 extends Component {
    private container: any;

    componentDidMount() {
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
        var renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(renderer.domElement);
        //this.getEffect1(renderer, camera, scene);
        //this.getEffect2(renderer, camera, scene);
    }

    render() {
        return <div id="ThreeContainer" ref={ref => (this.container = ref)} />;
    }

    private getEffect1(renderer, camera, scene) {

        // UnderWater Caustic lights
        var timeUniform1 =  {
            resolution: { value: new THREE.Vector2() },
            mouse: { value: new THREE.Vector2() },
            time: {value: 1.0},
        }
        timeUniform1.resolution.value.x = window.innerWidth;
        timeUniform1.resolution.value.y = window.innerHeight;

        var material1 = new THREE.ShaderMaterial({
            uniforms: timeUniform1,
            vertexShader: WaterShader1.vertexShader,
            fragmentShader: WaterShader1.fragmentShader,
            transparent: true,
            opacity: 0.3
        });

        var waterEffect1 = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight, 20),
            material1
        );
        scene.add(waterEffect1);

        var clock = new THREE.Clock();

        var animate = function() {
            requestAnimationFrame(animate);
            timeUniform1.time.value += clock.getDelta();
            renderer.render(scene, camera);
        };

        animate();
    }

    private getEffect2(renderer, camera, scene)
    {
        // Voronoi effect
        var timeUniform2 =  {
            iResolution: { value: new THREE.Vector3() },
            iMouse: { value: new THREE.Vector4() },
            iTime: {value: 1.0},
        }

        timeUniform2.iResolution.value.x = window.innerWidth;
        timeUniform2.iResolution.value.y = window.innerHeight;

        var material = new THREE.ShaderMaterial({
            uniforms: timeUniform2,
            vertexShader: WaterShader2.vertexShader,
            fragmentShader: WaterShader2.fragmentShader,
            transparent: true,
            opacity: 0.3
        });

        var waterEffect2 = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight, 20),
            material
        );
        scene.add(waterEffect2);

        var clock = new THREE.Clock();
        var animate = function() {
            requestAnimationFrame(animate);
            timeUniform2.iTime.value += clock.getDelta();
            renderer.render(scene, camera);
        };

        animate();
    }
}

export default WaterEffect1;

// Shader from : http://glslsandbox.com/e#10009.0
const WaterShader1 = {

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
        
    gl_FragColor = vec4(.1,.5,.6,0.1)*(f);
}
   `].join( '\n' )
};

// Shader from : https://www.shadertoy.com/view/XttyRX
const WaterShader2 = {

    vertexShader: [`
        void main()	{
            gl_Position = vec4( position, 1.0 );
        }`
    ].join( '\n' ),

    fragmentShader: [ `
#define tau 6.28318530718

uniform float iTime;
uniform vec4 iMouse;
uniform vec3 iResolution;

float sin01(float x) {
return (sin(x*tau)+1.)/2.;
}
float cos01(float x) {
    return (cos(x*tau)+1.)/2.;
}

// rand func from theartofcode (youtube channel)
vec2 rand01(vec2 p) {
    vec3 a = fract(p.xyx * vec3(123.5, 234.34, 345.65));
    a += dot(a, a+34.45);
    
    return fract (vec2(a.x * a.y, a.y * a.z));
}

float circ(vec2 uv, vec2 pos, float r) {
    return smoothstep(r, 0., length(uv - pos));
}

float smoothFract(float x, float blurLevel) {
    return pow(cos01(x), 1./blurLevel);
}

float manDist(vec2 from, vec2 to) {
    return abs(from.x - to.x) + abs(from.y - to.y);
}


float distFn(vec2 from, vec2 to) {
    float x = length (from - to);
    return pow (x, 4.);
}

float voronoi(vec2 uv, float t, float seed, float size) {
    
    float minDist = 100.;
    
    float gridSize = size;
    
    vec2 cellUv = fract(uv * gridSize) - 0.5;
    vec2 cellCoord = floor(uv * gridSize);
    
    for (float x = -1.; x <= 1.; ++ x) {
        for (float y = -1.; y <= 1.; ++ y) {
            vec2 cellOffset = vec2(x,y);
            
            // Random 0-1 for each cell
            vec2 rand01Cell = rand01(cellOffset + cellCoord + seed);

            // Get position of point
            vec2 point = cellOffset + sin(rand01Cell * (t+10.)) * .5;
            
            // Get distance between pixel and point
            float dist = distFn(cellUv, point);
            minDist = min(minDist, dist);
        }
    }
    
    return minDist;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Center coordinates at 0
    vec2 uv = (2.*fragCoord - iResolution.x)/iResolution.y;
    
    float t = iTime * .35;
    
    // Distort uv coordinates
    float amplitude = .12;
    float turbulence = .5;
    uv.xy += sin01(uv.x*turbulence + t) * amplitude;
    uv.xy -= sin01(uv.y*turbulence + t) * amplitude;
    
    // Apply two layers of voronoi, one smaller   
    float v;
    float sizeDistortion = abs(uv.x)/3.;
    v += voronoi(uv, t * 2., 0.5, 2.5 - sizeDistortion);
    v += voronoi(uv, t * 4., 0., 4. - sizeDistortion) / 2.;
    
    // Foreground color
    vec3 col = v * vec3(.55, .75, 1.);
    
    // Background color
    col += (1.-v) * vec3(.0, .3, .5);
    
    // Output to screen
    fragColor = vec4(col,0.2);
}

void main(void)
{
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
   `].join( '\n' )
};