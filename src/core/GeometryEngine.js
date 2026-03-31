export const ShapeType = {
  LINE: 'line',
  CIRCLE: 'circle',
  RECTANGLE: 'rectangle',
};

export const PointType = {
  VERTEX: 'vertex',
  CENTER: 'center',
  MIDPOINT: 'midpoint',
};

export class GeometryEngine {
  constructor() {
    this.shapes = [];
    this.counters = {
      [ShapeType.LINE]: 1,
      [ShapeType.CIRCLE]: 1,
      [ShapeType.RECTANGLE]: 1,
    };
  }

  addShape(type, params) {
    const id = `${type.charAt(0).toUpperCase()}${type.slice(1)}${this.counters[type]++}`;
    const shape = { id, type, params };
    this.shapes.push(shape);
    return shape;
  }

  updateShape(id, params) {
    const shapeIndex = this.shapes.findIndex(s => s.id === id);
    if (shapeIndex !== -1) {
      this.shapes[shapeIndex].params = { ...this.shapes[shapeIndex].params, ...params };
    }
  }

  getShapes() {
    return this.shapes;
  }

  getShapeById(id) {
    return this.shapes.find(s => s.id === id);
  }

  getSemanticPoints(shape) {
    const { type, params, id } = shape;
    const points = [];

    switch (type) {
      case ShapeType.LINE:
        points.push({ x: params.p1.x, y: params.p1.y, type: PointType.VERTEX, ref: `${id}@p1` });
        points.push({ x: params.p2.x, y: params.p2.y, type: PointType.VERTEX, ref: `${id}@p2` });
        points.push({
          x: (params.p1.x + params.p2.x) / 2,
          y: (params.p1.y + params.p2.y) / 2,
          type: PointType.MIDPOINT,
          ref: `${id}@midpoint`
        });
        break;

      case ShapeType.CIRCLE:
        points.push({ x: params.center.x, y: params.center.y, type: PointType.CENTER, ref: `${id}@center` });
        break;

      case ShapeType.RECTANGLE:
        const { p1, p2 } = params;
        const x1 = Math.min(p1.x, p2.x);
        const y1 = Math.min(p1.y, p2.y);
        const x2 = Math.max(p1.x, p2.x);
        const y2 = Math.max(p1.y, p2.y);

        points.push({ x: x1, y: y1, type: PointType.VERTEX, ref: `${id}@top_left` });
        points.push({ x: x2, y: y1, type: PointType.VERTEX, ref: `${id}@top_right` });
        points.push({ x: x1, y: y2, type: PointType.VERTEX, ref: `${id}@bottom_left` });
        points.push({ x: x2, y: y2, type: PointType.VERTEX, ref: `${id}@bottom_right` });
        points.push({ x: (x1 + x2) / 2, y: (y1 + y2) / 2, type: PointType.CENTER, ref: `${id}@center` });
        points.push({ x: (x1 + x2) / 2, y: y1, type: PointType.MIDPOINT, ref: `${id}@mid_top` });
        points.push({ x: (x1 + x2) / 2, y: y2, type: PointType.MIDPOINT, ref: `${id}@mid_bottom` });
        points.push({ x: x1, y: (y1 + y2) / 2, type: PointType.MIDPOINT, ref: `${id}@mid_left` });
        points.push({ x: x2, y: (y1 + y2) / 2, type: PointType.MIDPOINT, ref: `${id}@mid_right` });
        break;
    }

    return points;
  }
}
