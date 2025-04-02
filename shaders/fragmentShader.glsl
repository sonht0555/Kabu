#version 300 es
precision highp float;
in vec2 v_texcoord;
out vec4 fragColor;
uniform sampler2D texSampler;
uniform vec2 game_size;
uniform vec2 render_size;
uniform float smooth_width;
uniform float smooth_height;
uniform float input_gamma;
uniform float color_correction_strength;
uniform vec3 red_color;
uniform vec3 green_color;
uniform vec3 blue_color;
uniform bool enable_color_adjustment;

vec3 adjust_color(vec4 color) {
    vec3 c = pow(color.rgb, vec3(input_gamma));
    c = c.r * red_color + c.g * green_color + c.b * blue_color;
    c = pow(c, vec3(1.0 / 2.2));
    return mix(color.rgb, clamp(c, 0., 1.), color_correction_strength);
}

vec4 get_color(vec2 tex_coord) {
    vec4 color = texture(texSampler, tex_coord);
    if (enable_color_adjustment) {
        color.rgb = adjust_color(color);
    }
    return color;
}

vec4 interpolate_color(vec2 tex_coord) {
    vec2 ip = floor(tex_coord * game_size - 0.5) + 0.5;
    vec2 residual = fract(tex_coord * game_size + 0.5);
    ip /= game_size;
    vec4 v0 = get_color(ip);
    vec4 v1 = get_color(ip + vec2(1.0, 0.0) / game_size);
    vec4 v2 = get_color(ip + vec2(0.0, 1.0) / game_size);
    vec4 v3 = get_color(ip + vec2(1.0, 1.0) / game_size);

    vec2 smooth_dim = vec2(smooth_width, smooth_height);
    if (fract(render_size.x / game_size.x) * game_size.x < 0.01) smooth_dim.x = 0.01;
    if (fract(render_size.y / game_size.y) * game_size.y < 0.01) smooth_dim.y = 0.01;

    vec2 alpha = vec2(
        smoothstep(0.5 - smooth_dim.x * 0.5, 0.5 + smooth_dim.x * 0.5, residual.x),
        smoothstep(0.5 - smooth_dim.y * 0.5, 0.5 + smooth_dim.y * 0.5, residual.y)
    );
    return mix(mix(v0, v1, alpha.x), mix(v2, v3, alpha.x), alpha.y);
}

void main() {
    bool shouldInterpolate = fract(render_size.x / game_size.x) > 0.001;
    vec4 color;
    if (shouldInterpolate) {
        color = interpolate_color(v_texcoord);
        vec2 pixel_size = 2.0 / render_size;
        if (v_texcoord.x < pixel_size.x || v_texcoord.x > 1.0 - pixel_size.x ||
            v_texcoord.y < pixel_size.y || v_texcoord.y > 1.0 - pixel_size.y) {
            color.rgb = vec3(0.8667, 0.3373, 0.2235);
        }
    } else {
        color = get_color(v_texcoord);
    }
    fragColor = color;
}