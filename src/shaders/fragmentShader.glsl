#version 300 es
precision lowp float;

in vec2 v_texcoord;
out vec4 fragColor;

// Uniforms
uniform sampler2D texSampler;
uniform vec2 game_size;
uniform vec2 render_size;
uniform float smooth_width;
uniform float smooth_height;

// Hàm nội suy màu sắc (gộp luôn việc lấy màu)
vec4 interpolate_color(vec2 tex_coord) {
    vec2 ip = floor(tex_coord * game_size - 0.5) + 0.5;
    vec2 residual = fract(tex_coord * game_size + 0.5);
    ip /= game_size;

    // Lấy 4 giá trị màu từ các điểm lân cận trực tiếp
    vec4 v0 = texture(texSampler, ip);
    vec4 v1 = texture(texSampler, ip + vec2(1.0, 0.0) / game_size);
    vec4 v2 = texture(texSampler, ip + vec2(0.0, 1.0) / game_size);
    vec4 v3 = texture(texSampler, ip + vec2(1.0, 1.0) / game_size);

    // Tính toán độ mịn
    vec2 smooth_dim = vec2(smooth_width, smooth_height);
    if (fract(render_size.x / game_size.x) * game_size.x < 0.01) smooth_dim.x = 0.01;
    if (fract(render_size.y / game_size.y) * game_size.y < 0.01) smooth_dim.y = 0.01;

    // Tính toán alpha để nội suy
    vec2 alpha = vec2(
        smoothstep(0.5 - smooth_dim.x * 0.5, 0.5 + smooth_dim.x * 0.5, residual.x),
        smoothstep(0.5 - smooth_dim.y * 0.5, 0.5 + smooth_dim.y * 0.5, residual.y)
    );

    // Nội suy màu sắc
    return mix(mix(v0, v1, alpha.x), mix(v2, v3, alpha.x), alpha.y);
}

// Hàm chính
void main() {
    fragColor = interpolate_color(v_texcoord);
}