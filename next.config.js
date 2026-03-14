/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Permissions-Policy", value: "camera=*" },
      ]
    }];
  },
  webpack: (config, { isServer }) => {
    // Prevent MediaPipe from being bundled server-side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@mediapipe/face_mesh': 'commonjs @mediapipe/face_mesh',
        '@mediapipe/camera_utils': 'commonjs @mediapipe/camera_utils',
        '@mediapipe/drawing_utils': 'commonjs @mediapipe/drawing_utils',
      });
    }
    return config;
  }
};

module.exports = nextConfig;
