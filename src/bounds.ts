// =============================================================================
// Euclid.js | Bounds Class
// (c) Mathigon
// =============================================================================


import {isBetween} from '@mathigon/fermat';
import {Point} from './point';
import {Rectangle} from './rectangle';


export class Bounds {

  /**
   * Use the `errorHandling` option to decide how to deal with cases where the
   * min and max values are in the wrong order.
   */
  constructor(public xMin: number, public xMax: number, public yMin: number,
    public yMax: number, errorHandling?: 'swap'|'center') {
    if (errorHandling === 'swap') {
      if (this.dx < 0) [this.xMin, this.xMax] = [xMax, xMin];
      if (this.dy < 0) [this.yMin, this.yMax] = [yMax, yMin];
    } else if (errorHandling === 'center') {
      if (this.dx < 0) this.xMin = this.xMax = (xMin + xMax) / 2;
      if (this.dy < 0) this.yMin = this.yMax = (yMin + yMax) / 2;
    }
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

  resize(dx: number, dy: number) {
    return new Bounds(this.xMin, this.xMax + dx, this.yMin, this.yMax + dy);
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

  extend(top: number, right = top, bottom = top, left = right) {
    return new Bounds(this.xMin - left, this.xMax + right, this.yMin - top, this.yMax + bottom);
  }

  get rect() {
    return new Rectangle(new Point(this.xMin, this.yMin), this.dx, this.dy);
  }

  get center() {
    return new Point(this.xMin + this.dx / 2, this.yMin + this.dy / 2);
  }

  get flip() {
    return new Bounds(this.yMin, this.yMax, this.xMin, this.xMax);
  }
}
