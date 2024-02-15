const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");
if (!gl) {
	console.error("WebGL2 is not supported.");
}

const vertexShaderSource = `#version 300 es
	in vec2 a_position;
	uniform vec2 u_translation;
	uniform vec2 u_resolution;
	void main() {
		vec2 position = a_position + u_translation;
		gl_Position = vec4(position/u_resolution, 0.0, 1.0);
	}
`;

const fragmentShaderSource = `#version 300 es
	precision highp float;
	out vec4 fragColor;
	void main() {
		fragColor = vec4(1.0, 1.0, 1.0, 1.0);
	}
`;

function compileShader(gl, source, type) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error("Error compiling shader: ", gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		return null;
	}
	return shader;
}

const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
	console.error("Error linking program: ", gl.getProgramInfoLog(program));
}

const a = 40;
const b = 10;
const c = 200;
const d = 10;
const vertices = [
	// Arrowhead
	0, a*Math.cos(Math.PI/6)/2,
	-a/2, -a*Math.cos(Math.PI/6)/2,
	0, -a*Math.cos(Math.PI/6)/2 + d,
	0, a*Math.cos(Math.PI/6)/2,
	a/2, -a*Math.cos(Math.PI/6)/2,
	0, -a*Math.cos(Math.PI/6)/2 + d,
	
	// Body
	-b/2, -a*Math.cos(Math.PI/6)/2 + d,
	b/2, -a*Math.cos(Math.PI/6)/2 + d,
	b/2, -c,

	-b/2, -a*Math.cos(Math.PI/6)/2 + d,
	b/2, -c,
	-b/2, -c,
]
const vertexCount = 12;

let translation = [0, 0]

const xSlider = document.getElementById("x");
const ySlider = document.getElementById("y");
const xValue = document.getElementById("x-value");
const yValue = document.getElementById("y-value");
translation[0] = parseInt(xSlider.value);
xValue.innerHTML = translation[0];
translation[1] = parseInt(ySlider.value);
yValue.innerHTML = translation[1];
xSlider.oninput = function() {
	translation[0] = parseInt(this.value);
	xValue.innerHTML = translation[0];
	draw();
}
ySlider.oninput = function() {
	translation[1] = parseInt(this.value);
	yValue.innerHTML = translation[1];
	draw();
}


const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const positionAttribLocation = gl.getAttribLocation(program, "a_position");
gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionAttribLocation);
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const translationUniformLocation = gl.getUniformLocation(program, "u_translation");

gl.useProgram(program);
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

function draw() {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.bufferData(
		gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.useProgram(program);
	gl.bindVertexArray(vao);
	gl.uniform2fv(translationUniformLocation, translation);
	gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}

draw();
