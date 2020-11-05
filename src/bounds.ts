// =============================================================================
// Euclid.js | Bounds Class
// (c) Mathigon
// =============================================================================


import {isBetween} from '@mathigon/fermat';
import {Point} from './point';
import {Rectangle} from './rectangle';


export class Bounds {

  constructor(public xMin: number, public xMax: number, public yMin: number,
    public yMax: number) {
  }

  contains(p: Point) {
    return this.containsX(p) && this.containsY(p);
  }

  containsX(p: Point) {
    return isBetween(p.x, this.xMin, this.xMax);
  }

  containsY(p: Point) {
    return isBetween(p.y, this.yMin, this.yMax);
  }

  get dx() {
    return this.xMax - this.xMin;
  }

  get dy() {
    return this.yMax - this.yMin;
  }

  get xRange(): [number, number] {
    return [this.xMin, this.xMax];
  }

  get yRange(): [number, number] {
    return [this.yMin, this.yMax];
  }

  get rect() {
    return new Rectangle(new Point(this.xMin, this.xMin), this.dx, this.dy);
  }

  get center() {
    return new Point(this.xMin + this.dx / 2, this.yMin + this.dy / 2);
  }
}
