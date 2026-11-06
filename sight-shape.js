// Gameplay sight remains a square measured in whole grid cells. Appearance is handled only by scene-lighting.js.
export function withinSightShape(dx,dy,radius){return Math.max(Math.abs(dx),Math.abs(dy))<=radius;}
