export default function manifest() {
  return {
    name: "SETS — Workout Plan Manager",
    short_name: "SETS",
    description: "AI-powered workout plan manager",
    start_url: "/",
    display: "standalone",
    background_color: "#1B1A17",
    theme_color: "#F0A500",
    orientation: "portrait-primary",
    categories: ["health", "fitness"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
