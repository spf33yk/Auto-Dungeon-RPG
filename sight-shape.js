// Cell centers inside a circle define the shared sight footprint for AI, discovery and shading.
export function withinSightShape(dx,dy,radius){return dx*dx+dy*dy<=radius*radius;}
