import { debugMode } from "./constants";

export const clampNumber = function(num: number, min: number, max: number): number {
  if (debugMode) { console.log("UI: clampNumber()"); }

  if (num < min) {
    return min;
  }
  else if (num > max) {
    return max;
  }
  return num;
};

// To constrain the handlers in their limits.
export const limitMouseHandlerValue = function(value: number): number {
  if (debugMode) { console.log("UI: limitMouseHandlerValue()"); }

  if (value < 0.0001) {
    return 0.0001;
  } else if (value > 1-0.0001) {
    return 1-0.0001;
  } else {
    return value;
  }
};