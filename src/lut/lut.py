import numpy as np

def apply_color_transform(color, gamma, red_color, green_color, blue_color, strength):
    # Áp dụng gamma encode
    c = np.power(color, gamma)
    # Áp dụng ma trận màu
    transformed = (
        c[..., 0:1] * red_color +
        c[..., 1:2] * green_color +
        c[..., 2:3] * blue_color
    )
    # Gamma decode
    corrected = np.power(transformed, 1.0 / 2.2)
    # Nội suy giữa màu gốc và màu đã chỉnh
    mixed = (1.0 - strength) * color + strength * corrected
    return np.clip(mixed, 0.0, 1.0)

def generate_lut64_file(filename, gamma, red_color, green_color, blue_color, strength):
    size = 64
    # Tạo LUT 3D: (64, 64, 64, 3)
    r = np.linspace(0, 1, size)
    g = np.linspace(0, 1, size)
    b = np.linspace(0, 1, size)
    rr, gg, bb = np.meshgrid(r, g, b, indexing='ij')
    colors = np.stack([rr, gg, bb], axis=-1)

    transformed = apply_color_transform(colors, gamma, red_color, green_color, blue_color, strength)
    transformed = (transformed * 255.0).astype(np.uint8)
    transformed.tofile(filename)
    print(f"✅ Saved {filename}")

if __name__ == "__main__":
    gamma = 2.0

    red_color   = np.array([0.80, 0.135, 0.195])
    green_color = np.array([0.275, 0.64, 0.155])
    blue_color  = np.array([-0.075, 0.225, 0.65])

    strengths = [0.0, 0.25, 0.5, 0.75, 1.0]

    for i, strength in enumerate(strengths):
        filename = f"lut64_rtk_{i:.1f}.bin"
        generate_lut64_file(filename, gamma, red_color, green_color, blue_color, strength)