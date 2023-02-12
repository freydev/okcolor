import { signal } from "@preact/signals";
import { useRef } from "preact/hooks";

import { colorConversion } from "../lib/bottosson/colorconversion";
import { render, render_okhsl } from "../lib/bottosson/render";
import { eps } from "../lib/bottosson/constants";

import { UIMessageTexts } from "./ui-messages";

// We don't use the picker_size constant from the constants file because if we modify we got a display bug with the results from the render function in render.js
const picker_size = 240;

// We use a different value for the slider as they take less room.
const slider_size = 148;

const okhxyValues = {
  hue: signal(0),
  x: signal(0),
  y: signal(0)
};

const opacitySliderStyle = signal("");

const opacityValue = signal(100);

export function App() { 

  /*
  ** VARIABLES DECLARATIONS
  */

  const opacitysliderBackgroundImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAwIAAABUCAYAAAAxg4DPAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJMSURBVHgB7dlBbQNAEATBcxQky5+Sl4pjAHmdLPnRVQTm3ZrH8/l8nQszc27s7rlhz549e/bs2bNnz569z+39HAAAIEcIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgCAhAAAAQUIAAACCHq+3c2F3z42ZOTfs2bNnz549e/bs2bP3uT2PAAAABAkBAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAEDQ7+6eGzNzbtizZ8+ePXv27NmzZ+/7ex4BAAAIEgIAABAkBAAAIEgIAABAkBAAAIAgIQAAAEFCAAAAgoQAAAAECQEAAAgSAgAAECQEAAAgSAgAAECQEAAAgKDH6+1c2N1zY2bODXv27NmzZ+8/9uzZs2fvbs8jAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABD0u7vnxsycG/bs2bNnz549e/bs2fv+nkcAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABAkBAAAIEgIAABAkBAAAIOjxejsXdvfcmJlzw549e/bs2bNnz549e5/b8wgAAECQEAAAgCAhAAAAQUIAAACChAAAAAQJAQAACBICAAAQJAQAACBICAAAQJAQAACAICEAAABBQgAAAIKEAAAABP0BZxb7duWmOFoAAAAASUVORK5CYII=";

  // We could use one canvas element but better no to avoid flickering when user change color model 
  const fillOrStrokeSelector = useRef(null);
  const fillOrStrokeSelector_fill = useRef(null);
  const fillOrStrokeSelector_stroke = useRef(null);
  const colorPickerUIMessage = useRef(null);
  const colorPicker = useRef(null);
  const hueSlider = useRef(null);
  const opacitySlider = useRef(null);
  const manipulatorColorPicker = useRef(null);
  const manipulatorHueSlider = useRef(null);
  const manipulatorOpacitySlider = useRef(null);

  let init = true;

  let UIMessageOn = false;

  let currentColor = {
    r: 255,
    g: 255,
    b: 255,
    opacity: 0
  };

  // Default choice unless selected shape on launch has no fill.
  let currentFillOrStroke = "fill";
  let currentColorModel = "okhsl";

  let activeMouseHandler = null;

  // This var is to let user move the manipulators outside of their zone, if not the event of the others manipulator will trigger if keep the mousedown and go to other zones.
  let mouseHandlerEventTargetId = "";

  let shapeInfos = {
    hasFillStroke: {
      fill: false,
      stroke: false
    },
    colors: {
      fill: {
        r: 255,
        g: 255,
        b: 255,
        opacity: 0,
      },
      stroke: {
        r: 255,
        g: 255,
        b: 255,
        opacity: 0
      }
    }
  }


  /*
  ** HELPER FUNCTIONS
  */

  function clamp(num, min, max) {
    if (num < min) {
      return min;
    }
    else if (num > max) {
      return max;
    }
    return num;
  }

  function limitMouseHandlerValue(x) {
    return x < eps ? eps : (x > 1-eps ? 1-eps : x);
  }

  const UIMessage = {
    hide() {
      UIMessageOn = false;

      manipulatorColorPicker.current.classList.remove("u-display-none");
      colorPickerUIMessage.current.classList.add("u-display-none");
    },
    show(messageCode) {
      UIMessageOn = true;

      let ctx = colorPicker.current.getContext("2d");
      ctx.clearRect(0, 0, colorPicker.current.width, colorPicker.current.height);

      manipulatorColorPicker.current.classList.add("u-display-none");

      colorPickerUIMessage.current.classList.remove("u-display-none");
      colorPickerUIMessage.current.children[0].innerHTML = UIMessageTexts[messageCode];
    }
  }


  function switchFillOrStrokeSelector() {
    if (currentFillOrStroke == "fill") {
      currentFillOrStroke = "stroke";
      fillOrStrokeSelector.current.setAttribute("data-active", "stroke");
    }
    else {
      currentFillOrStroke = "fill";
      fillOrStrokeSelector.current.setAttribute("data-active", "fill");
    }
  }


  function updateOkhxyValuesFromCurrentColor() {
    // console.log("convert Rgb To Okhxy Values");

    let newOkhxy = colorConversion("srgb", currentColorModel, currentColor.r, currentColor.g, currentColor.b);

    okhxyValues.hue.value = newOkhxy[0];
    okhxyValues.x.value = newOkhxy[1];
    okhxyValues.y.value = newOkhxy[2];
  }


  function renderColorPickerCanvas() {
    // console.log("render Color Picker Canvas");

    let results;
    let ctx = colorPicker.current.getContext("2d");

    // If we don't to this and for exemple we start the plugin with a [0, 0, 0] fill, the color picker hue will be red while the hue picker will be orange. Seems to be an inconsistency with the render functions.
    if (currentColor.r == 0 && currentColor.g == 0 && currentColor.b == 0) {
      currentColor.r = currentColor.g = currentColor.b = 0.01;
    }

    if (currentColorModel == "okhsl") {
      results = render_okhsl(currentColor.r, currentColor.g, currentColor.b);
      ctx.putImageData(results["okhsl_sl"], 0, 0);
    }
    else if (currentColorModel == "okhsv") {
      results = render(currentColor.r, currentColor.g, currentColor.b);
      ctx.putImageData(results["okhsv_sv"], 0, 0);
    }
    // else if (colorModel == "oklch") {
    //   results = render(currentColor.r, currentColor.r, currentColor.r);
    //   ctx.putImageData(results["oklch_lc"], 0, 0);
    // }
  }

  function renderOpacitySliderCanvas() {
    // console.log("render opacity Slider Canvas");
    opacitySliderStyle.value = `background-image: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(${currentColor.r}, ${currentColor.g}, ${currentColor.b}, 1)), url(${opacitysliderBackgroundImg})`;
  }

  function renderFillOrStrokeSelector() {
    if (shapeInfos.hasFillStroke.fill) {
      fillOrStrokeSelector_fill.current.setAttribute("fill", `rgb(${shapeInfos.colors.fill.r}, ${shapeInfos.colors.fill.g}, ${shapeInfos.colors.fill.b})`);
    }
    if (shapeInfos.hasFillStroke.stroke) {
      fillOrStrokeSelector_stroke.current.setAttribute("fill", `rgb(${shapeInfos.colors.stroke.r}, ${shapeInfos.colors.stroke.g}, ${shapeInfos.colors.stroke.b})`);
    }
  }

  function syncFillOrStrokeSelector() {
    // console.log("syncWithNewShapeFillStrokeInfo");

    if (shapeInfos.hasFillStroke.fill) { fillOrStrokeSelector.current.setAttribute("data-has-fill", "true") }
    else { fillOrStrokeSelector.current.setAttribute("data-has-fill", "false") }

    if (shapeInfos.hasFillStroke.stroke) { fillOrStrokeSelector.current.setAttribute("data-has-stroke", "true") }
    else { fillOrStrokeSelector.current.setAttribute("data-has-stroke", "false") }

    if (!shapeInfos.hasFillStroke.fill || !shapeInfos.hasFillStroke.stroke) { fillOrStrokeSelector.current.classList.add("u-pointer-events-none"); }
    else { fillOrStrokeSelector.current.classList.remove("u-pointer-events-none"); }

  }


  

  /* 
  ** UPDATES TO UI
  */

  const updateManipulatorPositions = {

    colorPicker() {
      // console.log("update Manipulator Positions - color picker");
      let x = okhxyValues.x.value / 100;
      let y = okhxyValues.y.value / 100;
      document.getElementById(manipulatorColorPicker.current.transform.baseVal.getItem(0).setTranslate(picker_size*x, picker_size*(1-y)));
    },
    hueSlider() {
      // console.log("update Manipulator Positions - hue slider");
      let hue = okhxyValues.hue.value / 360;
      document.getElementById(manipulatorHueSlider.current.transform.baseVal.getItem(0).setTranslate((slider_size*hue)+6, -1));
    },
    opacitySlider() {
      // console.log("update Manipulator Positions - opacity slider");
      let opacity = opacityValue.value / 100;
      document.getElementById(manipulatorOpacitySlider.current.transform.baseVal.getItem(0).setTranslate((slider_size*opacity)+6, -1));
    },
    all() {
      this.colorPicker();
      this.hueSlider();
      this.opacitySlider();
    }
    
  }


  /* 
  ** UPDATES FROM UI
  */

  function fillOrStrokeHandle() {
    // console.log("fill Or Stroke Handle");

    switchFillOrStrokeSelector();

    if (currentFillOrStroke == "fill") {
      currentColor = shapeInfos.colors.fill;
    }
    if (currentFillOrStroke == "stroke") {
      currentColor = shapeInfos.colors.stroke;
    }

    opacityValue.value = currentColor.opacity;

    updateOkhxyValuesFromCurrentColor();
    renderOpacitySliderCanvas();
    updateManipulatorPositions.all();
    renderColorPickerCanvas();

    syncCurrentFillOrStrokeWithBackend();
  }


  function colorModelHandle(event) {
    // console.log("color Model Handle");

    currentColorModel = event.target.value;
    
    updateOkhxyValuesFromCurrentColor();
    updateManipulatorPositions.colorPicker();
    renderColorPickerCanvas();
  }


  function setupHandler(canvas) {
    // console.log("setup Handler - " + canvas.id);

    const mouseHandler = (event) => {
      let rect = canvas.getBoundingClientRect();

      let canvas_x: number;
      let canvas_y: number;

      if (mouseHandlerEventTargetId == "") {
        mouseHandlerEventTargetId = event.target.id;
      }

      if (mouseHandlerEventTargetId == "okhxy-xy-canvas") {
        canvas_x = event.clientX - rect.left;
        canvas_y = event.clientY - rect.top;
        okhxyValues.x.value = Math.round(limitMouseHandlerValue(canvas_x/picker_size) * 100);
        okhxyValues.y.value = Math.round(limitMouseHandlerValue(1 - canvas_y/picker_size) * 100);

        Object.assign(currentColor, colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value));

        // Temp note - oklch code 1
        
        updateManipulatorPositions.colorPicker();
        renderFillOrStrokeSelector();
        renderOpacitySliderCanvas();
      }
      else if (mouseHandlerEventTargetId == "okhxy-h-canvas") {
        canvas_y = event.clientX - rect.left;
        okhxyValues.hue.value = Math.round(limitMouseHandlerValue(canvas_y/slider_size) * 360);

        // We do this to be abble to change the hue value on the color picker canvas when we have a white or black value. If we don't to this fix, the hue value will always be the same on the color picker canvas.
        let x = clamp(okhxyValues.x.value, 0.1, 99.9);
        let y = clamp(okhxyValues.y.value, 0.1, 99.9);

        Object.assign(currentColor, colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, x, y));

        // Temp note - oklch code 2
      
        updateManipulatorPositions.hueSlider();
        renderFillOrStrokeSelector();
        renderOpacitySliderCanvas();

        renderColorPickerCanvas();
      }
      else if (mouseHandlerEventTargetId == "opacity-canvas") {
        canvas_y = event.clientX - rect.left;
        opacityValue.value = Math.round(limitMouseHandlerValue(canvas_y/slider_size) * 100);

        currentColor.opacity = opacityValue.value;

        updateManipulatorPositions.opacitySlider();
      }

      sendNewShapeColorToBackend();

    };

    canvas.addEventListener("mousedown", function(event) {
      activeMouseHandler = mouseHandler;
      activeMouseHandler(event);
    });
  }

  document.addEventListener("mousemove", function(event) {
    if (activeMouseHandler !== null) {
      activeMouseHandler(event);  
    }
  });

  function cancelMouseHandler() {
    if (activeMouseHandler !== null) {
      activeMouseHandler = null;
      mouseHandlerEventTargetId = "";
    }
  }

  document.addEventListener("mouseup", cancelMouseHandler);
  document.addEventListener("mouseleave", cancelMouseHandler);



  function hxyInputHandle(event) {
    // console.log("hxy Input Handle");

    let eventTargetId = event.target.id;
    let eventTargetValue = parseInt(event.target.value);
    
    // We test user's value and adjust it if enter one outside allowed range.
    if (eventTargetId == "hue") {
      eventTargetValue = clamp(eventTargetValue, 0, 360);
    }
    else if (eventTargetId == "x" || eventTargetId == "y") {
      eventTargetValue = clamp(eventTargetValue, 0, 100);
    }

    if (Number.isNaN(eventTargetValue)) {
      eventTargetValue = 0;
    }

    okhxyValues[eventTargetId].value = eventTargetValue;

    if (event.target.id == "hue") {
      let x = clamp(okhxyValues.x.value, 0.01, 99.99);
      let y = clamp(okhxyValues.y.value, 0.01, 99.99);
      Object.assign(currentColor, colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, x, y));
    }
    else {
      Object.assign(currentColor, colorConversion(currentColorModel, "srgb", okhxyValues.hue.value, okhxyValues.x.value, okhxyValues.y.value));
    }

    sendNewShapeColorToBackend();

    if (event.target.id == "hue") {
      renderColorPickerCanvas();
      updateManipulatorPositions.hueSlider();
    }
    else {
      updateManipulatorPositions.colorPicker();
    }

    if (event.target.id != "opacity") {
      renderOpacitySliderCanvas();
      renderFillOrStrokeSelector();
    }
  }

  function opacityInputHandle(event) {
    let eventTargetValue = clamp(parseInt(event.target.value), 0, 100);

    if (Number.isNaN(eventTargetValue)) {
      eventTargetValue = 100;
    }

    opacityValue.value = eventTargetValue;
    currentColor.opacity = opacityValue.value;
    updateManipulatorPositions.opacitySlider();

    sendNewShapeColorToBackend();
  }


  /* 
  ** UPDATES TO BACKEND
  */

  function sendNewShapeColorToBackend() {
    // console.log("update Shape Color");
    parent.postMessage({ pluginMessage: { type: "Update shape color", "newColor": currentColor } }, '*');
  }

  function syncCurrentFillOrStrokeWithBackend() {
    parent.postMessage({ pluginMessage: { type: "Sync currentFillOrStroke", "currentFillOrStroke": currentFillOrStroke } }, '*');
  }


  /* 
  ** UPDATES FROM BACKEND
  */

  onmessage = (event) => {
    const pluginMessage = event.data.pluginMessage.message;

    if (init) {
      // console.log("- Init function");

      setupHandler(colorPicker.current);
      setupHandler(hueSlider.current);
      setupHandler(opacitySlider.current);

      // console.log("- End init function");
      init = false;
    }

    if (pluginMessage == "new shape color") {
      // console.log("Update from backend - new shape color");

      // This value is false by default.
      let shouldRenderColorPickerCanvas = event.data.pluginMessage.shouldRenderColorPickerCanvas;

      if (UIMessageOn) {
        UIMessage.hide();
        shouldRenderColorPickerCanvas = true;
      }

      if (currentFillOrStroke != event.data.pluginMessage.currentFillOrStroke) {
        switchFillOrStrokeSelector();
        shouldRenderColorPickerCanvas = true;
      }
      
      currentFillOrStroke = event.data.pluginMessage.currentFillOrStroke;
      shapeInfos = event.data.pluginMessage.shapeInfos;
      
      syncFillOrStrokeSelector();

      if (currentFillOrStroke == "fill") {
        currentColor = event.data.pluginMessage.shapeInfos.colors.fill;
      }
      if (currentFillOrStroke == "stroke") {
        currentColor = event.data.pluginMessage.shapeInfos.colors.stroke;
      }

      opacityValue.value = currentColor.opacity;

      updateOkhxyValuesFromCurrentColor();
      renderOpacitySliderCanvas();
      updateManipulatorPositions.all();
      renderFillOrStrokeSelector();

      // We don't render colorPicker if for example user has just deleted the stroke of a shape that had both.
      if (shouldRenderColorPickerCanvas) {
        renderColorPickerCanvas();
      }
    }

    else if (pluginMessage == "Display UI Message") {
      UIMessage.show(event.data.pluginMessage.UIMessageCode);
    }
  }


  
  return (
    <>
      <div class="color-picker">

        <div ref={colorPickerUIMessage} class="color-picker__message-wrapper u-display-none">
          <p class="color-picker__message-text"></p>
        </div>

        <canvas ref={colorPicker} class="color-picker__canvas" id="okhxy-xy-canvas" width="240" height="240"></canvas>

        <svg class="color-picker__handler" width="240" height="240">
          <g transform="translate(0,0)">
            <g ref={manipulatorColorPicker} transform="translate(0,0)">
              <circle cx="0" cy="0" r="5" fill="none" stroke-width="1.5" stroke="#ffffff" ></circle>
              <circle cx="0" cy="0" r="6" fill="none" stroke-width="1" stroke="#e0e0e0" ></circle>
            </g>
          </g>
        </svg>

      </div>

      <div class="bottom-controls">

        <div class="u-flex" style="align-items: center;">

          <div ref={fillOrStrokeSelector} onClick={fillOrStrokeHandle} class="fill-stroke-selector" data-has-fill="true" data-has-stroke="true" data-active="fill" >
            
            <div class="fill-stroke-selector__fill">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle ref={fillOrStrokeSelector_fill} cx="11" cy="11" r="10.5" fill="#504CFB" stroke="#8E8E8E"/>
              </svg>
            </div>

            <div class="fill-stroke-selector__stroke">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path ref={fillOrStrokeSelector_stroke} d="M17.5 11C17.5 14.5899 14.5899 17.5 11 17.5C7.41015 17.5 4.5 14.5899 4.5 11C4.5 7.41015 7.41015 4.5 11 4.5C14.5899 4.5 17.5 7.41015 17.5 11ZM11 21.5C16.799 21.5 21.5 16.799 21.5 11C21.5 5.20101 16.799 0.5 11 0.5C5.20101 0.5 0.5 5.20101 0.5 11C0.5 16.799 5.20101 21.5 11 21.5Z" fill="#4CFBD1" stroke="#8E8E8E"/>
              </svg>
            </div>

          </div>

          <div class="sliders" style="margin-left: auto;">

            <div class="hue-slider">
              <div class="hue-slider__canvas">
                <div ref={hueSlider} id="okhxy-h-canvas"></div>
              </div>

              <svg class="hue-slider__handler" width="160" height="12"> 
                <g transform="translate(0,7)">
                  <g ref={manipulatorHueSlider} transform="translate(0,0)">
                    <circle cx="0" cy="0" r="4.5" fill="none" stroke-width="1.5" stroke="#ffffff" ></circle>
                    <circle cx="0" cy="0" r="5.5" fill="none" stroke-width="1" stroke="#e0e0e0" ></circle>
                  </g>
                </g>
              </svg>
            </div>

            <div class="opacity-slider">
              <div class="opacity-slider__canvas" style={opacitySliderStyle}>
                <div ref={opacitySlider} id="opacity-canvas"></div>
              </div>

              <svg class="opacity-slider__handler" width="160" height="12"> 
                <g transform="translate(0,7)">
                  <g ref={manipulatorOpacitySlider} transform="translate(0,0)">
                    <circle cx="0" cy="0" r="4.5" fill="none" stroke-width="1.5" stroke="#ffffff" ></circle>
                    <circle cx="0" cy="0" r="5.5" fill="none" stroke-width="1" stroke="#e0e0e0" ></circle>
                  </g>
                </g>
              </svg>
            </div>

          </div>

        </div>

        <div class="u-flex" style="margin-top: 20px;">
          <select onChange={colorModelHandle} name="color_model" id="color_model">
            <option value="okhsv">OkHSV</option>
            <option value="okhsl" selected>OkHSL</option>
          </select>

          <input class="valueInput" onChange={hxyInputHandle} id="hue" value={okhxyValues.hue} spellcheck={false} />
          <input class="valueInput" onChange={hxyInputHandle} id="x" value={okhxyValues.x} spellcheck={false} />
          <input class="valueInput" onChange={hxyInputHandle} id="y" value={okhxyValues.y} spellcheck={false} />
          <input class="valueInput" onChange={opacityInputHandle} id="opacity" value={opacityValue} spellcheck={false} />
        </div>

      </div>

    </>
  )
}