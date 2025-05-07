import numpy as np

def apply_shader_logic(color, gamma, darken_screen, profile, strength):
    # Step 1: Gamma encode + darken
    encoded = np.power(color, gamma + (darken_screen * 1.6))

    # Step 2: Apply luminance factor (lum = profile[3][3])
    lum = profile[3, 3]
    encoded *= lum

    # Step 3: Apply color matrix (3x3 from top-left)
    transformed = (
        encoded[..., 0:1] * profile[0, :3] +
        encoded[..., 1:2] * profile[1, :3] +
        encoded[..., 2:3] * profile[2, :3]
    )

    # Step 4: Gamma decode
    decoded = np.power(np.clip(transformed, 0.0, 1.0), 1.0 / gamma)

    # Step 5: Mix with original color
    mixed = (1.0 - strength) * color + strength * decoded
    return np.clip(mixed, 0.0, 1.0)

def generate_lut64_file(filename, gamma, darken_screen, profile, strength):
    size = 64
    r = np.linspace(0, 1, size)
    g = np.linspace(0, 1, size)
    b = np.linspace(0, 1, size)
    rr, gg, bb = np.meshgrid(r, g, b, indexing='ij')
    colors = np.stack([rr, gg, bb], axis=-1)

    transformed = apply_shader_logic(colors, gamma, darken_screen, profile, strength)
    transformed = (transformed * 255.0).astype(np.uint8)
    transformed.tofile(filename)
    print(f"✅ Saved {filename}")

if __name__ == "__main__":
    gamma = 2.2
    strength = 1  # thay đổi tùy nhu cầu

    # GBA DCI profile (từ shader Slang)
    profile = np.array([
        [0.76,   0.125,  0.16,   0.0],
        [0.27,   0.6375, 0.18,   0.0],
        [-0.03,  0.2375, 0.66,   0.0],
        [0.0,    0.0,    0.0,    0.97]  # luminance multiplier
    ])

    darken_screen = [0.0, 0.5, 1.0, 1.5, 2.0]

    for i, darken_screen in enumerate(darken_screen):
        
        filename = f"lut64_cool_{i:.1f}.bin"
        generate_lut64_file(filename, gamma, darken_screen, profile, strength)
