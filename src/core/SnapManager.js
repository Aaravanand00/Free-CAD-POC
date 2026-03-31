import { PointType } from './GeometryEngine';

export class SnapManager {
  constructor(geometryEngine) {
    this.geometryEngine = geometryEngine;
    this.snapThreshold = 20; // 20 pixels
  }

  resolveSnap(x, y) {
    const shapes = this.geometryEngine.getShapes();
    let bestSnap = null;
    let minDistance = this.snapThreshold;

    // Snapping priority logic: Vertex (highest priority) > Center > Midpoint
    const priorityMap = {
      [PointType.VERTEX]: 1,
      [PointType.CENTER]: 2,
      [PointType.MIDPOINT]: 3,
    };

    for (const shape of shapes) {
      const semanticPoints = this.geometryEngine.getSemanticPoints(shape);

      for (const p of semanticPoints) {
        const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));

        if (dist <= this.snapThreshold) {
          // If we found a closer point OR same distance but higher priority, update it
          // OR if we already have a snap, but this point has a higher priority (smaller value in priorityMap)
          const betterCandidate = !bestSnap || 
            (dist < minDistance && priorityMap[p.type] <= priorityMap[bestSnap.type]) ||
            (priorityMap[p.type] < priorityMap[bestSnap.type]);

          if (betterCandidate) {
            minDistance = dist;
            bestSnap = p;
          }
        }
      }
    }

    return bestSnap;
  }
}
