#version 300 es

precision highp float;

in vec2 vTextureCoord;
in vec2 vNoisePosition;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform sampler2D uNoiseTexture;
uniform float uProgress;

void main() {
    // Extending the threshold beyond [0, 1] guarantees fully opaque/clear endpoints.
    float threshold = mix(-0.2, 1.2, uProgress);
    float noise = texture(uNoiseTexture, vNoisePosition).r;
    float opacity = smoothstep(threshold - 0.2, threshold + 0.2, noise);
    // Pixi uses premultiplied alpha: fade RGB and alpha together.
    finalColor = texture(uTexture, vTextureCoord) * opacity;
}
