// =============================================================================
// Euclid.js | Overlap utilities
// (c) Mathigon
// =============================================================================

import {Circle} from './circle';
import {intersections} from './intersection';
import {Line, Segment} from './line';
import {Point} from './point';
import {Polygon} from './polygon';
import {GeoElement, GeoShape} from './utilities';


/** Whether two GeoElements overlap */
export function overlap(a: GeoShape | Point | GeoElement, b: GeoShape | Point | GeoElement) {
  if (isGeoShape(a)) {
    if (isGeoShape(b)) {
      return geoShapeOverlap(a, b);
    } else {
      return contains(a, b);
    }
  }
  if (a instanceof Point) {
    if (b instanceof Point) {
      return Point.equals(a, b);
    }
    if (isGeoShape(b)) {
      return contains(b, a);
    }
  }
  return false;
}

export function contains(a: GeoShape, b: GeoElement) {
  if (b instanceof Point) {
    return a.contains(b);
  } else {
    return false;
  }
}

function geoShapeOverlap(a: GeoShape, b: GeoShape) {
  if (a instanceof Polygon) {
    if (b instanceof Polygon) {
      for (const bEdge of b.edges) {
        for (const aEdge of a.edges) {
          if (lineLineOverlap(bEdge, aEdge)) return true;
        }
      }
    }
    if (b instanceof Line) {
      for (const edge of a.edges) {
        if (lineLineOverlap(edge, b)) return true;
      }
    }
    if (b instanceof Circle) {
      return polygonCircleOverlap(a, b);
    }
  }
  if (a instanceof Line) {
    if (b instanceof Polygon) {
      for (const edge of b.edges) {
        if (lineLineOverlap(edge, a)) return true;
      }
    }
    if (b instanceof Line) {
      return lineLineOverlap(a, b);
    }
    if (b instanceof Circle) {
      return b.intersect(a);
    }
  }
  if (a instanceof Circle) {
    if (b instanceof Polygon) {
      return polygonCircleOverlap(b, a);
    }
    if (b instanceof Line) {
      return a.intersect(b);
    }
    if (b instanceof Circle) {
      return circleCircleOverlap(a, b);
    }
  }
  // TODO: Handle others
  return false;
}

function circleCircleOverlap(a: Circle, b: Circle) {
  return Point.distance(a.c, b.c) < a.r + b.r;
}

function polygonCircleOverlap(poly: Polygon, circ: Circle) {
  for (const edge of poly.edges) {
    if (circ.intersect(edge)) return true;
  }
  return false;
}

function lineLineOverlap<A extends Line, B extends Line>(a: A, b: B): boolean {
  if (a instanceof Segment) {
    if (b instanceof Segment) {
      return segmentSegmentOverlap(a, b);
    } else {
      return segmentLineOverlap(a, b);
    }
  } else if (b instanceof Segment) {
    return segmentLineOverlap(b, a);
  } else if (a.equals(b)) {
    return true;
  } else {
    return intersections(a, b).length > 0;
  }
  // TODO: handle rays
}

function segmentLineOverlap(a: Segment, b: Line) {
  const p1 = b.project(a.p1);
  const p2 = b.project(a.p2);
  const s = new Segment(p1, p2);
  return segmentSegmentOverlap(a, s);
}

function segmentSegmentOverlap(a: Segment, b: Segment) {
  const o1 = getOrientation(a.p1, a.p2, b.p1);
  const o2 = getOrientation(a.p1, a.p2, b.p2);
  const o3 = getOrientation(b.p1, b.p2, a.p1);
  const o4 = getOrientation(b.p1, b.p2, a.p2);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  } else if (o1 === 'collinear' && a.contains(b.p1)) {
    return true;
  } else if (o2 === 'collinear' && a.contains(b.p2)) {
    return true;
  } else if (o3 === 'collinear' && b.contains(a.p1)) {
    return true;
  } else if (o4 === 'collinear' && b.contains(a.p2)) {
    return true;
  } else {
    return false;
  }
}

function isGeoShape(o: GeoElement | GeoShape): o is GeoShape {
  if ('project' in o && typeof o.project === 'function') {
    return true;
  }
  return false;
}

type Orientation =
  'clockwise' |
  'counterclockwise' |
  'collinear';

// Based on: https://www.geeksforgeeks.org/check-if-two-given-line-segments-intersect/
function getOrientation(a: Point, b: Point, c: Point): Orientation {
  const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
  if (val === 0) {
    return 'collinear';
  } else if (val > 0) {
    return 'clockwise';
  } else {
    return 'counterclockwise';
  }
}
