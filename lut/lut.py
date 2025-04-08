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
    gamma = 2.2
    red_color = np.array([0.8125, 0.0, 0.1875])
    green_color = np.array([0.125, 0.75, 0.125])
    blue_color = np.array([0.0625, 0.25, 0.6875])

    for i, strength in enumerate([0.0, 0.25, 0.5, 0.75, 1.0]):
        filename = f"lut64_gbc_{int(strength * 100):03}.bin"
        generate_lut64_file(filename, gamma, red_color, green_color, blue_color, strength)
