const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");
if (!gl) {
	console.error("WebGL2 is not supported.");
}

const vertexShaderSource = `#version 300 es
	in vec2 a_position;
	void main() {
		gl_Position = vec4(a_position, 0.0, 1.0);
	}
`;

const fragmentShaderSource = `#version 300 es
	precision highp float;
	out vec4 fragColor;
	void main() {
		fragColor = vec4(1.0, 1.0, 1.0, 1.0);
	}
`;

function linspace(start, end, n) {
	// [start,end] linspace
	let arr = [];
	const step = (end-start)/(n-1);
	for (let i = 0; i < n; i++) {
		arr.push(start + step*i);
	}
	return arr;
}

const x = linspace(-2*Math.PI, 2*Math.PI, 100);
const f = (x) => Math.sin(x);
const numPoints = x.length;
const xlim = [-2*Math.PI, 2*Math.PI];
const ylim = [-2, 2];
let vertices = [];

function lmap(v, vlim) {
	// Linear map from vlim[-1] => -1 and vlim[1] => 1
	const a = vlim[0];
	const b = vlim[1];
	return (-2/(a-b))*v + (a/(a-b)) + (b/(a-b));
}

for (let i = 0; i < numPoints; i++) {
	vertices.push(lmap(x[i], xlim), lmap(f(x[i]), ylim));
}

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

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);
const positionAttribLocation = gl.getAttribLocation(program, "a_position");
gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionAttribLocation);

function render() {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	gl.useProgram(program);
	gl.bindVertexArray(vao);
	gl.drawArrays(gl.LINE_STRIP, 0, numPoints);
}

render();
