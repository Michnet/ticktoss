export default function manifest() {
  return {
    name: 'TickToss — Deals on a Clock',
    short_name: 'TickToss',
    description: "Uganda's Urgency Marketplace. Every listing is time-limited — the best deals rise to the top.",
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F5F7',
    theme_color: '#FF4D00',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
