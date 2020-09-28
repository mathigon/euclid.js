// =============================================================================
// Euclid.js | Bounds Class
// (c) Mathigon
// =============================================================================


import {Point} from './point';
import {Rectangle} from './rectangle';


export class Bounds {

  constructor(public xMin: number, public xMax: number, public yMin: number,
    public yMax: number) {
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
}
