#version 300 es
in vec2 position;
in vec2 texcoord;
out vec2 v_texcoord;
void main() {
    gl_Position = vec4(position, 0, 1);
    v_texcoord = texcoord;
}