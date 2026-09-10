#version 300 es

precision mediump float;

in vec2 vUV;

out vec4 outColor;

uniform sampler2D uTexture;
uniform float uAmount;

void main() {
  vec4 color = texture(uTexture, vUV);
  float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(color.rgb, vec3(luminance), clamp(uAmount, 0.0, 1.0));
  outColor = color;
}
