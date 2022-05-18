// =============================================================================
// Euclid.js | PointGrid Class
// (c) Mathigon
// =============================================================================


import {Point} from './point';


const BUCKETS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 0], [0, 1], [1, -1], [1, 0], [1, 1]];

function* flatMap<S, T>(input: Iterable<S>, callback: (t: S) => Iterable<T>|undefined): Iterable<T> {
  for (const i of input) {
    const items = callback(i);
    if (!items) continue;
    for (const t of items) yield t;
  }
}


export class PointGrid<T> {
  private cells = new Map<string, Array<[T, Point]>>();

  constructor(objects: Iterable<[T, Iterable<Point>]>, readonly gridSize = 10) {
    for (const obj of objects) {
      for (const p of obj[1]) {
        const key = `${Math.floor(p.x / gridSize)},${Math.floor(p.y / gridSize)}`;
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key)!.push([obj[0], p]);
      }
    }
  }

  findClosest(points: Iterable<Point>, maxDistance = Infinity, minBailDistance = 1) {
    let distanceTest = maxDistance;
    let targetTest: [T, Point]|undefined;
    let shiftTest: Point|undefined;

    for (const p of points) {
      const x = Math.floor(p.x / this.gridSize);
      const y = Math.floor(p.y / this.gridSize);
      const targets = flatMap(BUCKETS, b => this.cells.get(`${x + b[0]},${y + b[1]}`));
      for (const t of targets) {
        const d = Point.distance(t[1], p);
        if (d < minBailDistance) return [t[0], t[1], t[1].subtract(p)];
        if (d < distanceTest) {
          targetTest = t;
          distanceTest = d;
          shiftTest = t[1].subtract(p);
        }
      }
    }

    return targetTest ? [targetTest[0], targetTest[1], shiftTest!] : undefined;
  }
}
