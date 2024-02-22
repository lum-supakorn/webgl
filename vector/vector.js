const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");
if (!gl) {
	console.error("WebGL2 is not supported.");
}

const vertexShaderSource = `#version 300 es
	in vec2 a_position;
	uniform vec2 u_translation;
	uniform vec2 u_rotation;
	uniform vec2 u_resolution;
	void main() {
		vec2 rotatedPosition = vec2(
			a_position.x * u_rotation.y + a_position.y * u_rotation.x,
			a_position.y * u_rotation.y - a_position.x * u_rotation.x);
		vec2 position = rotatedPosition + u_translation;
		gl_Position = vec4(2.0 * position/u_resolution, 0.0, 1.0);
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

let p1 = [0, 0];
let p2 = [0, 100];

let clickCounter = 0;
let isMouseDown = false;
canvas.addEventListener('mousedown', (e) => {
	isMouseDown = true;
	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left - rect.width/2;
	const y = rect.bottom - e.clientY - rect.height/2;
	p1 = [x, y];
});

canvas.addEventListener('mousemove', (e) => {
	if (isMouseDown) {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left - rect.width/2;
		const y = rect.bottom - e.clientY - rect.height/2;
		p2 = [x, y];
		draw();
	}
});

canvas.addEventListener('mouseup', (e) => {
	if (isMouseDown) {
		isMouseDown = false;
	}
});

const arrowShaftWidth = 4;
const arrowShaftOffset = 0;
const arrowShaftLength = 1;
const vertexCount = 12;
const arrowHeadWidth = 15;
const arrowHeadRecess = 5;

let rotation = [0, 0];
updateVertices(p1, p2); // Need this to initialize rotation

function updateVertices(p1, p2) {
	let mag = Math.sqrt(Math.pow(p2[0]-p1[0], 2) + Math.pow(p2[1]-p1[1], 2));
	rotation = [(p2[0]-p1[0])/mag, (p2[1]-p1[1])/mag];
	let vertices = [
		// Arrowhead
		0, arrowHeadWidth*Math.cos(Math.PI/6)/2 + mag*arrowShaftLength,
		-arrowHeadWidth/2, -arrowHeadWidth*Math.cos(Math.PI/6)/2 + mag*arrowShaftLength,
		0, -arrowHeadWidth*Math.cos(Math.PI/6)/2 + arrowHeadRecess + mag*arrowShaftLength,
		0, arrowHeadWidth*Math.cos(Math.PI/6)/2 + mag*arrowShaftLength,
		arrowHeadWidth/2, -arrowHeadWidth*Math.cos(Math.PI/6)/2 + mag*arrowShaftLength,
		0, -arrowHeadWidth*Math.cos(Math.PI/6)/2 + arrowHeadRecess + mag*arrowShaftLength,
		
		// Body
		-arrowShaftWidth/2, 0,
		arrowShaftWidth/2, 0,
		arrowShaftWidth/2, mag*arrowShaftLength - arrowShaftOffset,

		-arrowShaftWidth/2, 0,
		arrowShaftWidth/2, mag*arrowShaftLength - arrowShaftOffset,
		-arrowShaftWidth/2, mag*arrowShaftLength - arrowShaftOffset,
	]

	return vertices;
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
const rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");

gl.useProgram(program);
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

function draw() {
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.bufferData(
		gl.ARRAY_BUFFER, new Float32Array(updateVertices(p1, p2)), gl.STATIC_DRAW);

	gl.useProgram(program);
	gl.bindVertexArray(vao);
	gl.uniform2fv(translationUniformLocation, p1);
	gl.uniform2fv(rotationUniformLocation, rotation);
	gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}

draw();
