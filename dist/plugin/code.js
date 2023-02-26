"use strict";let t="fill",S=!1,k={hasFillStroke:{fill:!1,stroke:!1},colors:{fill:{r:255,g:255,b:255,opacity:0},stroke:{r:255,g:255,b:255,opacity:0}}},e=JSON.parse(JSON.stringify(k));function h(){var p,n;e=JSON.parse(JSON.stringify(k));const r=["BOOLEAN_OPERATION","COMPONENT","ELLIPSE","FRAME","INSTANCE","LINE","POLYGON","RECTANGLE","STAR","TEXT","VECTOR","SHAPE_WITH_TEXT","HIGHLIGHT"],s=figma.currentPage.selection;if(!s[0])return a("noSelection"),!1;for(const i of s)if(!r.includes(i.type))return a("notSupportedType",i.type),!1;const o=s[0].fills[0],l=s[0].strokes[0];if(!o&&!l)return a("noColorInShape"),!1;if((o==null?void 0:o.type)!=="SOLID"&&(l==null?void 0:l.type)!=="SOLID")return a("noSolidColor"),!1;if((o==null?void 0:o.type)==="SOLID"&&(e.hasFillStroke.fill=!0,e.colors.fill.r=o.color.r*255,e.colors.fill.g=o.color.g*255,e.colors.fill.b=o.color.b*255,e.colors.fill.opacity=Math.round(o.opacity*100)),(l==null?void 0:l.type)==="SOLID"&&(e.hasFillStroke.stroke=!0,e.colors.stroke.r=l.color.r*255,e.colors.stroke.g=l.color.g*255,e.colors.stroke.b=l.color.b*255,e.colors.stroke.opacity=Math.round(l.opacity*100)),s.length>1){let i=0,f=0;for(const g of s)((p=g.fills[0])==null?void 0:p.type)==="SOLID"&&i++,((n=g.strokes[0])==null?void 0:n.type)==="SOLID"&&f++;if(s.length!==i&&s.length!==f)return a("notAllShapesHaveFillOrStroke"),!1;f<i?e.hasFillStroke.stroke=!1:i<f&&(e.hasFillStroke.fill=!1)}return!0}function c(r=!1){figma.ui.postMessage({shapeInfos:e,currentFillOrStroke:t,shouldRenderColorPickerCanvas:r,message:"new shape color"})}function a(r,s=""){figma.ui.postMessage({message:"Display UI Message",UIMessageCode:r,nodeType:s})}figma.showUI(__html__,{width:240,height:346,themeColors:!0});function y(){h()&&(e.hasFillStroke.fill?t="fill":t="stroke",c(!0))}y();figma.on("selectionchange",()=>{h()&&(t=="fill"&&!e.hasFillStroke.fill?t="stroke":t=="stroke"&&!e.hasFillStroke.stroke&&(t="fill"),c(!0))});figma.on("documentchange",r=>{if(S)return;if(r.documentChanges[0].type=="PROPERTY_CHANGE"){const o=r.documentChanges[0].properties[0];if(o=="fills"||o=="strokes"){let l=Object.assign({},e.hasFillStroke);if(!h())return;if(JSON.stringify(l)!==JSON.stringify(e.hasFillStroke)){t=="fill"&&!e.hasFillStroke.fill?t="stroke":t=="stroke"&&!e.hasFillStroke.stroke&&(t="fill"),c(!0);return}t=="fill"&&o=="strokes"||t=="stroke"&&o=="fills"?c():c(!0)}}});let u;figma.ui.onmessage=r=>{if(r.type=="Update shape color"){S=!0;const s=r.newColor.r/255,o=r.newColor.g/255,l=r.newColor.b/255,p=r.newColor.opacity/100;let n;const i=t+"s";for(const f of figma.currentPage.selection)i in f&&(n=JSON.parse(JSON.stringify(f[i])),n[0].color.r=s,n[0].color.g=o,n[0].color.b=l,n[0].opacity=p,f[i]=n);u&&clearTimeout(u),u=setTimeout(()=>{S=!1},500)}else r.type=="Sync currentFillOrStroke"&&(t=r.currentFillOrStroke)};
