#version 300 es

precision mediump float;

in vec2 vUV;

out vec4 outColor;

uniform sampler2D uTexture;
uniform sampler2D uNoiseTexture;
uniform float uProgress;
uniform float uEdgeWidth;
uniform vec3 uEdgeColor;

void main() {
  vec4 color = texture(uTexture, vUV);
  float noise = texture(uNoiseTexture, vUV).r;
  float threshold = clamp(uProgress, 0.0, 1.0);
  float alpha = smoothstep(threshold, threshold + uEdgeWidth, noise);
  float edge = smoothstep(threshold, threshold + uEdgeWidth, noise) -
    smoothstep(threshold + uEdgeWidth, threshold + uEdgeWidth * 2.0, noise);
  color.rgb = mix(color.rgb, uEdgeColor, edge);
  color.a *= alpha;
  outColor = color;
}
