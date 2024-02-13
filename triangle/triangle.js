let canvas = document.querySelector("#c");

let gl = canvas.getContext("webgl2");
if (!gl) {
	console.log("WebGL 2 is not available.");
}

let vertexShaderSource = `#version 300 es
// An attribute is an input to a vertex shader. It will receive data from a buffer.
in vec4 a_position;

void main() {
	// gl_Position is a special variable a vertex shader is responsible for setting.
	// This just sets gl_Position to whatever a_position is.
	gl_Position = a_position;
}
`;

let fragmentShaderSource = `#version 300 es
// Set precision for the fragment shader
precision highp float;

// Output from the fragment shader is the color
out vec4 outColor;

void main() {
	outColor = vec4(1, 0, 0.5, 1);
}
`;

function createShader(gl, type, source) {
	let shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	let success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}

	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

function createProgram(gl, vertexShader, fragmentShader) {
	let program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	let success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}

	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

let program = createProgram(gl, vertexShader, fragmentShader);

// Now a GSLS program has been created. We need to supply data (vertex position in this case)
// to this program
// Look for a_position attribute in the program we just created
let positionAttributeLocation = gl.getAttribLocation(program, "a_position");

// Attributes get data from a buffer so we need to create that too.
let positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// Put the data into the buffer by referencing the bind point
let a = 1;
let positions = [
	0, a*Math.cos(Math.PI/6)/2,
	-a/2, -a*Math.cos(Math.PI/6)/2,
	a/2, -a*Math.cos(Math.PI/6)/2,
]
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// Now the data is in the buffer but we need to tell the attribute how to get the required
// data out of it
// First we need to create a Vertex Array Object which is a collection of attribute state
let vao = gl.createVertexArray();
gl.bindVertexArray(vao); // Make it the current vertex array
// Now we need to set up the attributes in the vertex array
gl.enableVertexAttribArray(positionAttributeLocation);

// Now we need to specify how to pull data out
let size = 2;
let type = gl.FLOAT
let normalize = false;
let stride = 0;
let offset = 0;
// Also, the attribute is now bound to positionBuffer
gl.vertexAttribPointer(
	positionAttributeLocation, size, type, normalize, stride, offset);

// Tell WebGL how to convert from the clip space values we use to specify vertex position
// to pixels (screen space)
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

// Clear the canvas with rgba color
gl.clearColor(0, 0, 0, 0);
gl.clear(gl.COLOR_BUFFER_BIT);

// Tell WebGL which shader program to execute
gl.useProgram(program);

// Tell WebGL which set of buffers to use and how to pull data out of those buffers to supply
// to the attributes
gl.bindVertexArray(vao);

// Execute the GLSL program
let primitiveType = gl.TRIANGLES;
let drawOffset = 0;
let count = 3;
gl.drawArrays(primitiveType, drawOffset, count);
