export class MeasurementEngine {
  constructor(geometryEngine) {
    this.geometryEngine = geometryEngine;
    this.measurements = [];
    this.counter = 1;
  }

  addMeasurement(ref1, ref2) {
    const id = `Measure${this.counter++}`;
    const measurement = { id, ref1, ref2 };
    this.measurements.push(measurement);
    return measurement;
  }

  resolveReference(ref) {
    const [shapeId, pointType] = ref.split('@');
    const shape = this.geometryEngine.getShapeById(shapeId);
    if (!shape) return null;

    const points = this.geometryEngine.getSemanticPoints(shape);
    return points.find(p => p.ref === ref);
  }

  getMeasurements() {
    return this.measurements.map(m => {
      const p1 = this.resolveReference(m.ref1);
      const p2 = this.resolveReference(m.ref2);

      let distance = 0;
      if (p1 && p2) {
        distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      }

      return {
        ...m,
        p1,
        p2,
        distance: distance.toFixed(2),
        isValid: !!(p1 && p2),
      };
    });
  }
}
