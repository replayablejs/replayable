#version 300 es

precision highp float;

in vec2 aPosition;
out vec2 vTextureCoord;
out vec2 vNoisePosition;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

void main() {
    // Pixi supplies the filtered frame in logical screen pixels.
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    // Tile the repeatable noise in logical pixels, keeping its patches square on rotation.
    vNoisePosition = position / 960.0;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    gl_Position = vec4(position, 0.0, 1.0);
    vTextureCoord = aPosition * uOutputFrame.zw * uInputSize.zw;
}
