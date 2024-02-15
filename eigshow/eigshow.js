const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");
if (!gl) {
	console.error("WebGL2 is not supported.");
}

const vertexShaderSource = `#version 300 es
	in vec2 a_position;
	uniform vec2 u_rotation;
	uniform vec2 u_resolution;
	uniform vec4 u_color;
	out vec4 v_color;
	void main() {
		vec2 rotatedPosition = vec2(
			a_position.x * u_rotation.y + a_position.y * u_rotation.x,
			a_position.y * u_rotation.y - a_position.x * u_rotation.x);
		vec2 position = rotatedPosition;
		gl_Position = vec4(2.0 * position/u_resolution, 0.0, 1.0);
		v_color = u_color;
	}
`;

const fragmentShaderSource = `#version 300 es
	precision highp float;
	out vec4 fragColor;
	in vec4 v_color;
	void main() {
		fragColor = v_color;
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

let v = [0, 1];
const I = [
	1, 0,
	0, 1
];
let A = [
	2, 2,
	2, 2
];

function matMul(v, A) {
	return [A[0]*v[0] + A[1]*v[1], A[2]*v[0] + A[3]*v[1]];
}

function mag(v) {
	return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
}

function normalize(v) {
	let magni = mag(v);
	return [v[0]/magni, v[1]/magni];
}

function dot(u, v) {
	return u[0]*v[0] + u[1]*v[1];
}

function proj(a, b) {
	const scale = dot(a, b)/dot(b, b);
	return [scale*b[0], scale*b[1]];
}

function oproj(a, b) {
	aa = proj(a, b);
	return [a[0]-aa[0], a[1]-aa[1]];
}

const arrowShaftWidth = 4;
const arrowShaftOffset = 0;
const vertexCount = 12;
const arrowHeadWidth = 15;
const arrowHeadRecess = 5;
const scale = 100;

let rotation = [0, 0];
updateVertices(v, A); // Need this to initialize rotation

function updateVertices(v, A) {
	const Av = matMul(v, A);
	rotation = normalize(Av);
	const arrowShaftLength = scale * mag(Av);
	const vertices = [
		// Arrowhead
		0, arrowHeadWidth*Math.cos(Math.PI/6)/2 + arrowShaftLength,
		-arrowHeadWidth/2, -arrowHeadWidth*Math.cos(Math.PI/6)/2 + arrowShaftLength,
		0, -arrowHeadWidth*Math.cos(Math.PI/6)/2 + arrowHeadRecess + arrowShaftLength,
		0, arrowHeadWidth*Math.cos(Math.PI/6)/2 + arrowShaftLength,
		arrowHeadWidth/2, -arrowHeadWidth*Math.cos(Math.PI/6)/2 + arrowShaftLength,
		0, -arrowHeadWidth*Math.cos(Math.PI/6)/2 + arrowHeadRecess + arrowShaftLength,
		
		// Body
		-arrowShaftWidth/2, 0,
		arrowShaftWidth/2, 0,
		arrowShaftWidth/2, arrowShaftLength - arrowShaftOffset,

		-arrowShaftWidth/2, 0,
		arrowShaftWidth/2, arrowShaftLength - arrowShaftOffset,
		-arrowShaftWidth/2, arrowShaftLength - arrowShaftOffset,
	]

	return vertices;
}

let isMouseDown = false;
let isCloseToVector = false;

canvas.addEventListener('mousedown', (e) => {
	isMouseDown = true;
});

canvas.addEventListener('mousemove', (e) => {
	const rect = canvas.getBoundingClientRect();
	const x = e.clientX - rect.left - rect.width/2;
	const y = rect.bottom - e.clientY - rect.height/2;
	if (isMouseDown && isCloseToVector) {
		v = normalize([x, y]);
	} else {
		if ((dot([x, y], v) > 0) && (mag([x, y]) <= scale) && (mag(oproj(v, [x, y])) <= 0.1)) {
			isCloseToVector = true;
		} else {
			isCloseToVector = false
		}
	}
	draw();
});

canvas.addEventListener('mouseup', (e) => {
	if (isMouseDown) {
		isMouseDown = false;
	}
});

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const positionAttribLocation = gl.getAttribLocation(program, "a_position");
gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionAttribLocation);
const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
const rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");
const colorUniformLocation = gl.getUniformLocation(program, "u_color");

gl.useProgram(program);
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

function draw() {
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	gl.clearColor(1.0, 1.0, 1.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);


	gl.useProgram(program);
	gl.bindVertexArray(vao);

	// Transformed vector
	gl.bufferData(
		gl.ARRAY_BUFFER, new Float32Array(updateVertices(v, A)), gl.STATIC_DRAW);
	gl.uniform4fv(colorUniformLocation, [1.0, 0.0, 0.0, 1.0]);
	gl.uniform2fv(rotationUniformLocation, rotation);
	gl.drawArrays(gl.TRIANGLES, 0, vertexCount);

	// Original vector
	gl.bufferData(
		gl.ARRAY_BUFFER, new Float32Array(updateVertices(v, I)), gl.STATIC_DRAW);
	if (isCloseToVector) {
		gl.uniform4fv(colorUniformLocation, [0.0, 0.0, 1.0, 0.5]);
	} else {
		gl.uniform4fv(colorUniformLocation, [0.0, 0.0, 1.0, 1.0]);
	}
	gl.uniform2fv(rotationUniformLocation, rotation);
	gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
}

draw();
