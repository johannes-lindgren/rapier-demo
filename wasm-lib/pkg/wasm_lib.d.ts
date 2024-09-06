/* tslint:disable */
/* eslint-disable */
/**
* @param {number} width
* @param {number} height
* @param {number} threshold_fill_float
* @param {number} threshold_hole_float
* @param {Uint8Array} data
* @returns {World}
*/
export function greet(width: number, height: number, threshold_fill_float: number, threshold_hole_float: number, data: Uint8Array): World;
/**
*/
export class World {
  free(): void;
/**
* @param {string} path
* @param {string} holes
*/
  constructor(path: string, holes: string);
/**
*/
  holes: string;
/**
*/
  path: string;
}
