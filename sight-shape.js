// Rounded square sight: trim only the four outer corner cells; use the same shape for AI and shading.
export function withinSightShape(dx,dy,radius){dx=Math.abs(dx);dy=Math.abs(dy);return Math.max(dx,dy)<=radius&&dx+dy<=radius*2-1;}
