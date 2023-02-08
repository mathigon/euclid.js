// =============================================================================
// Euclid.js | Ellipse Tests
// (c) Mathigon
// =============================================================================


import {nearlyEquals} from '@mathigon/fermat';
import tape from 'tape';
import {Ellipse, Line, ORIGIN, Point} from '../src';


tape('horizontal', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1);
  const f1 = new Point(-Math.sqrt(3), 0);
  const f2 = new Point(Math.sqrt(3), 0);
  test.true(f1.equals(ellipse.f1));
  test.true(f2.equals(ellipse.f2));
  test.end();
});

tape('vertical', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1, Math.PI / 2);
  const f1 = new Point(0, -Math.sqrt(3));
  const f2 = new Point(0, Math.sqrt(3));
  test.true(f1.equals(ellipse.f1));
  test.true(f2.equals(ellipse.f2));
  test.end();
});

tape('scale', (test) => {
  const ellipse = new Ellipse(new Point(1, 1), 2, 1);
  const scaled = ellipse.scale(2);
  test.true(scaled.f1.equals(new Point(2 - Math.sqrt(12), 2)));
  test.true(scaled.f2.equals(new Point(2 + Math.sqrt(12), 2)));
  test.true(scaled.c.equals(new Point(2, 2)));
  test.end();
});

tape('fromFoci', (test) => {
  const f1 = new Point(-Math.sqrt(3), 0);
  const f2 = new Point(Math.sqrt(3), 0);
  const ellipse = Ellipse.fromFoci(f1, f2, 4);
  test.true(nearlyEquals(ellipse.a, 2));
  test.true(nearlyEquals(ellipse.b, 1));
  test.end();
});

tape('vertical ellipses', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1);
  const f1 = new Point(-Math.sqrt(3), 0);
  const f2 = new Point(Math.sqrt(3), 0);
  test.true(nearlyEquals(ellipse.a, 2));
  test.true(nearlyEquals(ellipse.b, 1));
  test.true(f1.equals(ellipse.f1));
  test.true(f2.equals(ellipse.f2));
  test.end();
});

tape('project', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1);
  const p1 = new Point(3, 0);
  const p2 = new Point(0, 3);
  test.true(ellipse.project(p1).equals(new Point(2, 0)));
  test.true(ellipse.project(p2).equals(new Point(0, 1)));
  test.end();
});

tape('at', (test) => {
  const f1 = new Point(-Math.sqrt(3), 0);
  const f2 = new Point(Math.sqrt(3), 0);
  const ellipse = Ellipse.fromFoci(f1, f2, 4);
  test.true(ellipse.at(0).equals(new Point(2, 0)));
  test.true(ellipse.at(0.25).equals(new Point(0, 1)));
  test.end();
});

tape('contains', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1);
  const p1 = new Point(1, 0);
  const p2 = new Point(0, 0.5);
  test.true(ellipse.contains(p1));
  test.true(ellipse.contains(p2));
  test.false(ellipse.contains(new Point(0, -2)));
  test.false(ellipse.contains(new Point(0, 2)));
  test.end();
});

tape('rotate', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1);
  const rotated = ellipse.rotate(Math.PI / 2);
  test.true(rotated.f1.equals(new Point(0, -Math.sqrt(3))));
  test.true(rotated.f2.equals(new Point(0, Math.sqrt(3))));
  test.end();
});

tape('reflect', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1);
  const reflected = ellipse.reflect(new Line(new Point(0, 0), new Point(1, 1)));
  test.true(reflected.f1.equals(new Point(0, -Math.sqrt(3))));
  test.true(reflected.f2.equals(new Point(0, Math.sqrt(3))));
  test.end();
});

tape('scale', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1);
  const scaled = ellipse.scale(2);
  test.true(scaled.f1.equals(new Point(-Math.sqrt(3) * 2, 0)));
  test.true(scaled.f2.equals(new Point(Math.sqrt(3) * 2, 0)));
  test.end();
});

tape('shift', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1);
  const shifted = ellipse.shift(1, 1);
  test.true(shifted.f1.equals(new Point(-Math.sqrt(3) + 1, 1)));
  test.true(shifted.f2.equals(new Point(Math.sqrt(3) + 1, 1)));
  test.equals(shifted.a, 2);
  test.equals(shifted.b, 1);
  test.end();
});

tape('translate', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1);
  const translated = ellipse.translate(new Point(1, 1));
  test.true(translated.f1.equals(new Point(-Math.sqrt(3) + 1, 1)));
  test.true(translated.f2.equals(new Point(Math.sqrt(3) + 1, 1)));
  test.equals(translated.a, 2);
  test.equals(translated.b, 1);
  test.end();
});

tape('equals', (test) => {
  const ellipse = new Ellipse(ORIGIN, 2, 1);
  const ellipse2 = Ellipse.fromFoci(ellipse.f1, ellipse.f2, ellipse.a * 2);
  test.true(ellipse.equals(ellipse2));
  test.end();
});
