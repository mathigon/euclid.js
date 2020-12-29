// =============================================================================
// Euclid.js | Polygon and Polyline Classes
// (c) Mathigon
// =============================================================================


import {toLinkedList, tabulate, last} from '@mathigon/core';
import {nearlyEquals} from '@mathigon/fermat';
import {Circle} from './circle';
import {intersections} from './intersection';
import {Line, Segment} from './line';
import {ORIGIN, Point} from './point';
import {GeoShape, TransformMatrix, TWO_PI} from './utilities';


/** A polygon defined by its vertex points. */
export class Polygon implements GeoShape {
  readonly type: string = 'polygon';
  readonly points: Point[];

  constructor(...points: Point[]) {
    this.points = points;
  }

  get circumference() {
    if (this.points.length <= 1) return 0;
    let length = Point.distance(this.points[0], last(this.points));
    for (let i = 1; i < this.points.length; ++i) {
      length += Point.distance(this.points[i - 1], this.points[i]);
    }
    return length;
  }

  /**
   * The (signed) area of this polygon. The result is positive if the vertices
   * are ordered clockwise, and negative otherwise.
   */
  get signedArea() {
    const p = this.points;
    const n = p.length;
    let A = p[n - 1].x * p[0].y - p[0].x * p[n - 1].y;

    for (let i = 1; i < n; ++i) {
      A += p[i - 1].x * p[i].y - p[i].x * p[i - 1].y;
    }

    return A / 2;
  }

  get area() {
    return Math.abs(this.signedArea);
  }

  get centroid() {
    const p = this.points;
    const n = p.length;

    let Cx = 0;
    for (let i = 0; i < n; ++i) Cx += p[i].x;

    let Cy = 0;
    for (let i = 0; i < n; ++i) Cy += p[i].y;

    return new Point(Cx / n, Cy / n);
  }

  get edges() {
    const p = this.points;
    const n = p.length;

    const edges = [];
    for (let i = 0; i < n; ++i) edges.push(new Segment(p[i], p[(i + 1) % n]));
    return edges;
  }

  get radius() {
    const c = this.centroid;
    const radii = this.points.map(p => Point.distance(p, c));
    return Math.max(...radii);
  }

  /** The oriented version of this polygon (vertices in clockwise order). */
  get oriented(): this {
    if (this.signedArea >= 0) return this;
    const points = [...this.points].reverse();
    return new (<any> this.constructor)(...points);
  }

  /**
   * The intersection of this and another polygon, calculated using the
   * Weiler–Atherton clipping algorithm
   */
  intersect(polygon: Polygon) {
    // TODO Support intersections with multiple disjoint overlapping areas.
    // TODO Support segments intersecting at their endpoints
    const points = [toLinkedList<Point>(this.oriented.points),
      toLinkedList<Point>(polygon.oriented.points)];

    const max = this.points.length + polygon.points.length;
    const result: Point[] = [];

    let which = 0;
    let active = points[which].find(p => polygon.contains(p.val))!;
    if (!active) return undefined;  // No intersection

    while (active.val !== result[0] && result.length < max) {
      result.push(active.val);

      const nextEdge = new Segment(active.val, active.next!.val);
      active = active.next!;

      for (const p of points[1 - which]) {
        const testEdge = new Segment(p.val, p.next!.val);
        const intersect = intersections(nextEdge, testEdge)[0];
        if (intersect) {
          which = 1 - which;  // Switch active polygon
          active = {val: intersect, next: p.next};
          break;
        }
      }
    }

    return new Polygon(...result);
  }

  /** Checks if two polygons p1 and p2 collide. */
  static collision(p1: Polygon, p2: Polygon) {
    // Check if one of the vertices is in one of the polygons.
    if (p1.points.some(q => p2.contains(q))) return true;
    if (p2.points.some(q => p1.contains(q))) return true;

    // Check if any of the edges overlap.
    for (const e1 of p1.edges) {
      for (const e2 of p2.edges) {
        if (intersections(e1, e2)[0]) return true;
      }
    }

    return false;
  }

  /** Creates a regular polygon. */
  static regular(n: number, radius = 1) {
    const da = TWO_PI / n;
    const a0 = Math.PI / 2 - da / 2;

    const points = tabulate((i) => Point.fromPolar(a0 + da * i, radius), n);
    return new Polygon(...points);
  }

  /** Interpolates the points of two polygons */
  static interpolate(p1: Polygon, p2: Polygon, t = 0.5) {
    // TODO support interpolating polygons with different numbers of points
    const points = p1.points.map(
        (p, i) => Point.interpolate(p, p2.points[i], t));
    return new Polygon(...points);
  }

  // ---------------------------------------------------------------------------

  /**
   * Checks if a point p lies inside this polygon, by using a ray-casting
   * algorithm and calculating the number of intersections.
   */
  contains(p: Point) {
    let inside = false;

    for (const e of this.edges) {
      // Exclude points lying *on* the edge.
      if (e.p1.equals(p) || e.contains(p)) return false;
      if ((e.p1.y > p.y) === (e.p2.y > p.y)) continue;

      const det = (e.p2.x - e.p1.x) / (e.p2.y - e.p1.y);
      if (p.x < det * (p.y - e.p1.y) + e.p1.x) inside = !inside;
    }

    return inside;
  }

  at(t: number) {
    return Point.interpolateList([...this.points, this.points[0]], t);
  }

  project(p: Point) {
    let q: Point|undefined = undefined;
    let d = Infinity;

    for (const e of this.edges) {
      const q1 = e.project(p);
      const d1 = Point.distance(p, q1);
      if (d1 < d) {
        q = q1;
        d = d1;
      }
    }

    return q || this.points[0];
  }

  // ---------------------------------------------------------------------------

  transform(m: TransformMatrix): this {
    return new (<any> this.constructor)(...this.points.map(p => p.transform(m)));
  }

  rotate(a: number, center = ORIGIN): this {
    if (nearlyEquals(a, 0)) return this;
    const points = this.points.map(p => p.rotate(a, center));
    return new (<any> this.constructor)(...points);
  }

  reflect(line: Line): this {
    const points = this.points.map(p => p.reflect(line));
    return new (<any> this.constructor)(...points);
  }

  scale(sx: number, sy = sx): this {
    const points = this.points.map(p => p.scale(sx, sy));
    return new (<any> this.constructor)(...points);
  }

  shift(x: number, y = x): this {
    const points = this.points.map(p => p.shift(x, y));
    return new (<any> this.constructor)(...points);
  }

  translate(p: Point) {
    return this.shift(p.x, p.y);
  }

  equals(_other: Polygon) {
    // TODO Implement
    return false;
  }
}


/** A polyline defined by its vertex points. */
export class Polyline extends Polygon {
  readonly type = 'polyline';

  get length() {
    let length = 0;
    for (let i = 1; i < this.points.length; ++i) {
      length += Point.distance(this.points[i - 1], this.points[i]);
    }
    return length;
  }

  /** @returns {Segment[]} */
  get edges() {
    const edges = [];
    for (let i = 0; i < this.points.length - 1; ++i) {
      edges.push(new Segment(this.points[i], this.points[i + 1]));
    }
    return edges;
  }
}


/** A triangle defined by its three vertices. */
export class Triangle extends Polygon {
  readonly type = 'triangle';

  get circumcircle() {
    const [a, b, c] = this.points;

    const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));

    const ux = (a.x ** 2 + a.y ** 2) * (b.y - c.y) +
               (b.x ** 2 + b.y ** 2) * (c.y - a.y) +
               (c.x ** 2 + c.y ** 2) * (a.y - b.y);

    const uy = (a.x ** 2 + a.y ** 2) * (c.x - b.x) +
               (b.x ** 2 + b.y ** 2) * (a.x - c.x) +
               (c.x ** 2 + c.y ** 2) * (b.x - a.x);

    const center = new Point(ux / d, uy / d);
    const radius = Point.distance(center, this.points[0]);

    return new Circle(center, radius);
  }

  get incircle() {
    const edges = this.edges;
    const sides = edges.map(e => e.length);
    const total = sides[0] + sides[1] + sides[2];
    const [a, b, c] = this.points;

    const ux = sides[1] * a.x + sides[2] * b.x + sides[0] * c.x;
    const uy = sides[1] * a.y + sides[2] * b.y + sides[0] * c.y;

    const center = new Point(ux / total, uy / total);
    const radius = center.distanceFromLine(edges[0]);

    return new Circle(center, radius);
  }

  get orthocenter() {
    const [a, b, c] = this.points;
    const h1 = new Line(a, b).perpendicular(c);
    const h2 = new Line(a, c).perpendicular(b);
    return intersections(h1, h2)[0];
  }
}
