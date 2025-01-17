import { converter } from "../../node_modules/culori/bundled/culori.mjs";
import type { Rgb, Okhsl, Okhsv, Oklch } from "../../node_modules/culori/bundled/culori.mjs";

import { debugMode } from "./constants";
import { clampNumber, roundWithDecimal } from "./others";

const convertToRgb = converter("rgb");
const convertToP3 = converter("p3");
const convertToOkhsl = converter("okhsl");
const convertToOkhsv = converter("okhsv");
const convertToOklch = converter("oklch");

export function colorConversion(from: string, to: string, param1: number, param2: number, param3: number, fileColorProfile: string): [number, number, number] {
  if (debugMode) { console.log(`UI: colorConversion(${from}, ${to}, ${param1}, ${param2}, ${param3})`); }

  let culoriResult: Rgb | Okhsl | Okhsv | Oklch;
  let result: [number, number, number] = [0, 0, 0];

  // No need to go all through color conversion if we have a white of black color, we can manually find the corresponding values.
  // Also this is useful because if the color is white and we don't do this, we'll get a value with a hue of 90 and a saturation of 56 in OkHSL.
  if (from === "rgb") {
    if (param1 > 254 && param2 > 254 && param3 > 254) {
      result[0] = 0;
      result[1] = 0;
      result[2] = 100;

      return result;
    }
    else if (param1 === 0 && param2 === 0 && param3 === 0) {
      result[0] = 0;
      result[1] = 0;
      result[2] = 0;
      
      return result;
    }
  }

  // Edit for now we don't do it because for example with #00FF00, if we move the L param from 83 to 84 and 85, we'll get a color with too much difference at 84 compared to 83 and 85.
  // We do this before calling convertToRgb() to send back the correct peak values. If we don't to this, convertToRgb() will not send peak rgb values when needed.
  // if (from === "okhsl" || from === "okhsv") {

  //   const pickColorRgb: { [key: string]: [number, number, number] } = {
  //     "red": [255, 0, 0],
  //     "green": [0, 255, 0],
  //     "blue": [0, 0, 255],
  //     "yellow": [255, 255, 0],
  //     "pink": [255, 0, 255],
  //     "cyan": [0, 255, 255],
  //   }

  //   const pickColorConditions: { [key: string]: { [key: string]: boolean } } = {
  //     "okhsl": {
  //       "red": (from === "okhsl" && param1 === 29 && param2 > 99 && param3 === 57),
  //       "green": (from === "okhsl" && param1 === 142 && param2 > 99 && param3 === 84),
  //       "blue": (from === "okhsl" && param1 === 264 && param2 > 99 && param3 === 37),
  //       "yellow": (from === "okhsl" && param1 === 110 && param2 > 99 && param3 === 96),
  //       "pink": (from === "okhsl" && param1 === 328 && param2 > 99 && param3 === 65),
  //       "cyan": (from === "okhsl" && param1 === 195 && param2 > 99 && param3 === 89)
  //     },
  //     "okhsv": {
  //       "red": (from === "okhsv" && param1 === 29 && param2 > 99 && param3 > 99),
  //       "green": (from === "okhsv" && param1 === 142 && param2 > 99 && param3 > 99),
  //       "blue": (from === "okhsv" && param1 === 264 && param2 > 99 && param3 > 99),
  //       "yellow": (from === "okhsv" && param1 === 110 && param2 > 99 && param3 > 99),
  //       "pink": (from === "okhsv" && param1 === 328 && param2 > 99 && param3 > 99),
  //       "cyan": (from === "okhsv" && param1 === 195 && param2 > 99 && param3 > 99)
  //     }
  //   };

  //   let currentKey;

  //   for (let i = 0; i < Object.keys(pickColorRgb).length; i++) {
  //     currentKey = Object.keys(pickColorRgb)[i];

  //     if (pickColorConditions.okhsl[currentKey] || pickColorConditions.okhsv[currentKey]) {
  //       result = pickColorRgb[currentKey];
  //       return result;
  //     }
  //   }
  // }

  // convertToRgb() and convertToP3() needs these values between 0 and 1.
  if (to === "rgb") {
    param2 = param2 / 100;
    param3 = param3 / 100;
  }

  // Same here, we need the RGB values between 0 and 1.
  if (from === "rgb") {
    param1 = param1 / 255;
    param2 = param2 / 255;
    param3 = param3 / 255;
  }

  // color() function in CSS use different names for the color profile than the one used in this plugin.
  let colorFunctionSpace: string;

  if (fileColorProfile === "p3") {
    colorFunctionSpace = "display-p3";
  }
  else {
    colorFunctionSpace = "srgb";
  }

  // We have to use formatHex for converting from RGB because if not we get wrong saturation values (like 0.5 instead of 1).
  if (from === "okhsl" && to === "rgb" && fileColorProfile === "rgb") { culoriResult = convertToRgb({mode: "okhsl", h: param1, s: param2, l: param3}); }
  else if (from === "okhsv" && to === "rgb" && fileColorProfile === "rgb") { culoriResult = convertToRgb({mode: "okhsv", h: param1, s: param2, v: param3}); }
  else if ((from === "oklch" || from === "oklchCss") && to === "rgb" && fileColorProfile === "rgb") { culoriResult = convertToRgb({mode: "oklch", h: param1, c: param2, l: param3}); }

  else if (from === "okhsl" && to === "rgb" && fileColorProfile === "p3") { culoriResult = convertToP3({mode: "okhsl", h: param1, s: param2, l: param3}); }
  else if (from === "okhsv" && to === "rgb" && fileColorProfile === "p3") { culoriResult = convertToP3({mode: "okhsv", h: param1, s: param2, v: param3}); }
  else if ((from === "oklch" || from === "oklchCss") && to === "rgb" && fileColorProfile === "p3") { culoriResult = convertToP3({mode: "oklch", h: param1, c: param2, l: param3}); }

  // We alway use srgb for OkHSL and OkHSV because they are not intended to be used in P3 and if we try, we get out of range value like a saturation of 103.
  else if (from === "rgb" && to === "okhsl") { culoriResult = convertToOkhsl(`color(srgb ${param1} ${param2} ${param3})`); }
  else if (from === "rgb" && to === "okhsv") { culoriResult = convertToOkhsv(`color(srgb ${param1} ${param2} ${param3})`); }
  else if (from === "rgb" && (to === "oklch" || to === "oklchCss")) { culoriResult = convertToOklch(`color(${colorFunctionSpace} ${param1} ${param2} ${param3})`); }

  if (to === "rgb") {
    if (param3 === 0) {
      // If we have a black color (luminosity / value = 0), convertToRgb() return NaN for the RGB values so we fix this.
      result[0] = 0;
      result[1] = 0;
      result[2] = 0;
    }
    else {
      result[0] = clampNumber(culoriResult.r*255, 0, 255);
      result[1] = clampNumber(culoriResult.g*255, 0, 255);
      result[2] = clampNumber(culoriResult.b*255, 0, 255);      
    }
  }
  else if (to === "okhsl") {
    result[0] = Math.round(culoriResult.h);
    result[1] = Math.round(culoriResult.s*100);
    result[2] = Math.round(culoriResult.l*100);
  }
  else if (to === "okhsv") {
    result[0] = Math.round(culoriResult.h);
    result[1] = Math.round(culoriResult.s*100);
    result[2] = Math.round(culoriResult.v*100);
  }
  else if (to === "oklch") {
    result[0] = Math.round(culoriResult.h);
    result[1] = roundWithDecimal(culoriResult.c*100, 1);
    result[2] = Math.round(culoriResult.l*100);
  }
  else if (to === "oklchCss") {
    result[0] = roundWithDecimal(culoriResult.h, 1);
    result[1] = roundWithDecimal(culoriResult.c, 3);
    result[2] = roundWithDecimal(culoriResult.l*100, 1);
  }
  
  // We need to do this because if for example we get a color like #888888, we will get Nan for result[0], also, with others gray values we'll sometimes get a hue of 90 or 0.
  // The reason we use roundWithDecimal() is because without it we can have for example param1 = 123.99995 and param2 = 123.99994.
  if (from === "rgb" && roundWithDecimal(param1, 3) === roundWithDecimal(param2, 3) && roundWithDecimal(param1, 3) === roundWithDecimal(param3, 3) && roundWithDecimal(param2, 3) === roundWithDecimal(param3, 3)) {
    result[0] = 0;
  }

  // Temporary fix of #0000FF being out of the triangle shape (same problem with oklch.com, see https://github.com/evilmartians/oklch-picker/issues/78. Might come from CuloriJS, but on https://bottosson.github.io/misc/colorpicker/#0000ff we have it also, if we insert #0000FF in the HEx input then change the H input on OkLCH from 265 back to 264, the OkLCH triangle shape doesn't render the same.)
  // if (from === "rgb" && to === "oklch" && param1 <= 5/255 && param2 <= 5/255 && param3 <= 255/255) {
  //  result[0] = 265;
  // }

  return result;
}
