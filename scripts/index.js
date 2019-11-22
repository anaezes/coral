let color = [];
let values = [];
let index = 0;
var fizzyText; 

window.onload = function() {
	var FizzyText = function() {
		this.value = values[index];
		this.color = color[index];
		this.show = false;
	};

	fizzyText = new FizzyText();
	var gui = new dat.GUI();
	gui.add(fizzyText, 'value', -2, 30).listen();
	gui.addColor(fizzyText, 'color').listen();
	gui.add(fizzyText, 'show');

	var update = function() {
		requestAnimationFrame(update);
		fizzyText.value =values[index];
		fizzyText.color =color[index];
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

		if(fizzyText.show && index < color.length ){
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
			if(d.value < 10.3)
				color.push('#8ab3b3');
			else if(d.value > 10.3 & d.value < 10.4)
				color.push('#04B431');
			else
				color.push('#FF0000');
		}
	});
});