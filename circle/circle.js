const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl2");
if (!gl) {
	console.error("WebGL2 is not supported.");
}

const vertexShaderSource = `#version 300 es
	in vec2 a_position;
	uniform vec2 u_resolution;
	void main() {
		gl_Position = vec4(a_position/u_resolution, 0.0, 1.0);
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

const rSlider = document.getElementById("r");
const vertexCountSlider = document.getElementById("vertexCount");
const rValue = document.getElementById("rValue");
const vertexCountValue = document.getElementById("vertexCountValue");
let r = parseInt(rSlider.value);
rValue.innerHTML = r;
let vertexCount = parseInt(vertexCountSlider.value);
vertexCountValue.innerHTML = vertexCount;
rSlider.oninput = function() {
	r = parseInt(this.value);
	rValue.innerHTML = r;
	render();
}
vertexCountSlider.oninput = function() {
	vertexCount = parseInt(this.value);
	vertexCountValue.innerHTML = vertexCount;
	render();
}
function createVertices(r, vertexCount) {
	const vertices = [];
	for (let i = 0; i < vertexCount; i++) {
		const angle = (i/vertexCount) * Math.PI * 2;
		const x = r*Math.cos(angle);
		const y = r*Math.sin(angle);
		vertices.push(x, y);
	}
	vertices.push(vertices[0], vertices[1]);

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

gl.useProgram(program);
gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

function render() {
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT);

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(createVertices(r, vertexCount)), gl.STATIC_DRAW);

	gl.useProgram(program);
	gl.bindVertexArray(vao);
	gl.drawArrays(gl.LINE_STRIP, 0, vertexCount+1);
}

render();
