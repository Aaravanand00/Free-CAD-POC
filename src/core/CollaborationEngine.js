export class CollaborationEngine {
  constructor(geometryEngine) {
    this.geometryEngine = geometryEngine;
    this.annotations = [];
    this.counter = 1;
  }

  addAnnotation(ref, text) {
    const id = `Note${this.counter++}`;
    const annotation = {
      id,
      ref,
      text,
      timestamp: Date.now(),
      author: 'User' + Math.floor(Math.random() * 1000), // Simulate user ID
      replies: [],
    };
    this.annotations.push(annotation);
    return annotation;
  }

  addReply(annotationId, text) {
    const annotation = this.annotations.find(a => a.id === annotationId);
    if (annotation) {
      const reply = {
        id: annotation.replies.length + 1,
        text,
        timestamp: Date.now(),
        author: 'User' + Math.floor(Math.random() * 1000),
      };
      annotation.replies.push(reply);
    }
  }

  resolveReference(ref) {
    const [shapeId] = ref.split('@');
    const shape = this.geometryEngine.getShapeById(shapeId);
    if (!shape) return null;

    const points = this.geometryEngine.getSemanticPoints(shape);
    return points.find(p => p.ref === ref);
  }

  getAnnotations() {
    return this.annotations.map(a => {
      const point = this.resolveReference(a.ref);
      return {
        ...a,
        point,
        isValid: !!point,
      };
    });
  }
}
