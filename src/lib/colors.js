export function getCategoryColor(name, colorStr = null) {
  if (colorStr && colorStr !== 'null') {
    return colorStr;
  }
  
  if (!name) return '#FFB800'; // Default gold
  
  // A unified palette of muted/brand colors instead of a full rainbow
  const palette = [
    '#FF6A00', // TT Flame 2
    '#FFB800', // TT Gold
    '#8E8E93', // Muted
    '#FF4D00', // TT Flame
    '#636366', // Muted 2
  ];

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

/**
 * Helper to convert hex to rgba for glow effects
 * If the color is already rgba/rgb, it returns it as is or tries to wrap it.
 */
export function getGlowColor(color, opacity = 0.25) {
  if (!color) return `rgba(255, 184, 0, ${opacity})`;
  
  // If it's a hex color
  if (color.startsWith('#')) {
    let r = 0, g = 0, b = 0;
    if (color.length === 4) {
      r = parseInt(color[1] + color[1], 16);
      g = parseInt(color[2] + color[2], 16);
      b = parseInt(color[3] + color[3], 16);
    } else if (color.length === 7) {
      r = parseInt(color.substring(1, 3), 16);
      g = parseInt(color.substring(3, 5), 16);
      b = parseInt(color.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // For css vars or other strings, just use a fallback or rely on color-mix if we were in CSS
  // Here we just return the default glow if we can't parse it, or let the browser handle it if possible.
  // A safe fallback if it's already a var(--some-color)
  if (color.startsWith('var')) {
     return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
  }
  
  return color;
}
