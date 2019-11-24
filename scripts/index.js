let color = [];
let values = [];
let index = 0;
var fizzyText; 

window.onload = function() {
	class FizzyText {
		constructor() {
			this.value = values[index];
			this.color = color[index];
		}
	}

	fizzyText = new FizzyText();
	var gui = new dat.GUI();

	var f1 = gui.addFolder('temperature');
	f1.open();

	f1.add(fizzyText, 'value', -2, 30).listen();
	f1.addColor(fizzyText, 'color').listen();

	var update = function() {
		requestAnimationFrame(update);
		fizzyText.value = values[index];
		fizzyText.color = color[index];
	};
	
	update();
}



  
AFRAME.registerComponent('wobble-normal', {
	schema: {},
	tick: function (t) {
		this.el.components.material.material.normalMap.offset.x += 0.0001 * Math.sin(t/10000);
		this.el.components.material.material.normalMap.offset.y += 0.0001 * Math.cos(t/8000);
		this.el.components.material.material.normalScale.x = 0.5 + 0.5 * Math.cos(t/1000);
		this.el.components.material.material.normalScale.x = 0.5 + 0.5 * Math.sin(t/1200);

		if(index < values.length-1){
			this.el.setAttribute('material', 'color', color[index]);
			index++;
		}

	}
})

AFRAME.registerPrimitive('a-ocean-plane', {
	defaultComponents: {
		geometry: {
			primitive: 'plane',
			height: 10000,
			width: 10000
		},
		rotation: '0 0 0',
		material: {
			shader: 'standard',
			color: '#8ab3b3',
			metalness: 0.1,
			roughness: 0.6,
			normalTextureRepeat: '50 50',
			normalTextureOffset: '0 0',
			normalScale: '0.5 0.5',
			opacity: 0.2
		},
		'wobble-normal': {}
	},
});



d3.csv("data/Temperature.csv", function(data) {
	data.forEach(function(d) {
		d.time = d["timestamp (seconds since 01/01/1970)"];
	    d.system = d[" system"];
		d.entity = d[" entity "] ;
		d.value = d[" value (°c)"];
	});
	data.forEach(function(d) {
		if(d.entity === " Depth Sensor") {
			values.push(d.value);
			
			if(d.value < -2.2)
				color.push('#cc04ae');
			else if(d.value < 2.2)
				color.push('#8f06ea');	
			else if(d.value < 6.5)
				color.push('#486afa');
			else if(d.value < 10.7)
				color.push('#00ffff');
			else if(d.value < 15)
				color.push('#00d34a');
			else if(d.value < 19.2)
				color.push('#0059d8');
			else if(d.value < 23.5)
				color.push('#f2fc00');
			else if(d.value < 27.7)
				color.push('#ff8a00');				
			else
				color.push('#ff1500');
		}
	});
});