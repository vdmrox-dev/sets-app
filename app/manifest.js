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
        src: "/icons/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
