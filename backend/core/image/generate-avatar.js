'use strict';

var Canvas = require('canvas');
var Font = Canvas.Font;
var path = require('path');

var DEFAULT_AVATAR_SIZE = 128;

var FONTS = {
  Ubuntu: {
    name: 'Ubuntu',
    filename: 'Ubuntu-Regular.ttf',
    // to improve perfomance, we precalculate ratio of font
    ratioWithOneChar: 100 / 88 // (avatarSize/fontSize)
  }
};
var DEFAULT_FONT = FONTS.Ubuntu;

// color spec from:
// https://www.google.com/design/spec/style/color.html#color-color-palette
var COLORS = [
  { bgColor: '#F44336', fgColor: 'white' }, // Red
  { bgColor: '#E91E63', fgColor: 'white' }, // Pink
  { bgColor: '#9C27B0', fgColor: 'white' }, // Purple
  { bgColor: '#673AB7', fgColor: 'white' }, // Deep Purple
  { bgColor: '#3F51B5', fgColor: 'white' }, // Indigo
  { bgColor: '#2196F3', fgColor: 'white' }, // Blue
  { bgColor: '#03A9F4', fgColor: 'black' }, // Light Blue
  { bgColor: '#00BCD4', fgColor: 'black' }, // Cyan
  { bgColor: '#009688', fgColor: 'white' }, // Teal
  { bgColor: '#4CAF50', fgColor: 'black' }, // Green
  { bgColor: '#8BC34A', fgColor: 'black' }, // Light Green
  { bgColor: '#CDDC39', fgColor: 'black' }, // Lime
  { bgColor: '#FFEB3B', fgColor: 'black' }, // Yellow
  { bgColor: '#FFC107', fgColor: 'black' }, // Amber
  { bgColor: '#FF9800', fgColor: 'black' }, // Orange
  { bgColor: '#FF5722', fgColor: 'white' }, // Deep Orange
  { bgColor: '#795548', fgColor: 'white' }, // Brown
  { bgColor: '#9E9E9E', fgColor: 'black' }, // Grey
  { bgColor: '#607D8B', fgColor: 'white' } // Blue Grey
];
var COLORS_SIZE = COLORS.length;
var DEFAULT_COLOR = COLORS[0];

if (!Font) {
  throw new Error('Need to compile node-canvas with font support');
}

function fontFile(name) {
  return path.join(__dirname, 'fonts', name);
}

function fontName(size, name) {
  return size + 'px ' + name;
}

/**
 * Calculate approximate font size to draw text to fit the canvas.
 * Note that the canvasContex must be already added the font to be used by
 * addFont method.
 *
 * Inspired by:
 * http://stackoverflow.com/questions/20551534/size-to-fit-font-on-a-canvas
 *
 * More about TextMetrics on:
 * https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics
 * @param  {Context} canvasContext Context instance return by getContext('2d')
 *                                 method of Canvas
 * @param  {Number} canvasSize    size of Canvas
 * @param  {String} canvasFont    font to use in Canvas
 * @param  {String} text          text to be drawn
 * @return {Number}               calculated font size
 */
var calculateFitFontSize = function(canvasContext, canvasSize, canvasFont, text) {
  var fontSize = 0;
  var textMetric, textWidth, textHeight;
  do {
    fontSize++;
    canvasContext.font = fontName(fontSize, canvasFont);
    textMetric = canvasContext.measureText(text);
    textWidth = textMetric.width;
    textHeight = textMetric.emHeightAscent + textMetric.emHeightDescent;
  } while (textWidth < canvasSize && textHeight < canvasSize);

  return fontSize;
};
// export as a private method for testing purpose (still need more discussion)
module.exports._calculateFitFontSize = calculateFitFontSize;


/**
 * Generate avatar from text
 * @param  {Object}  options input object contain:
 *                       - text (String): required, text to be drawn,
 *                       1 -> 2 characters
 *                       - size (Number)
 *                       - bgColor (String)
 *                       - fgColor (String)
 *                       - font (String)
 *                       - toBase64 (String):  set to true to return Base64
 *                       image data of avatar
 * @return {Buffer} Buffer instance of image or null if data is not well-formed
 * @return {String} Base64 image data of avatar if options.toBase64 is set to true
 */
var generateFromText = function(options) {
  if (!options || !options.text) {
    return null;
  }

  var text = String(options.text).substring(0, 2).toUpperCase();
  var avatarSize = parseInt(options.size, 10) || DEFAULT_AVATAR_SIZE;
  var bgColor = options.bgColor || DEFAULT_COLOR.bgColor;
  var fgColor = options.fgColor || DEFAULT_COLOR.fgColor;
  var avatarFont = FONTS[options.font] || DEFAULT_FONT;

  var canvas = new Canvas(avatarSize, avatarSize);
  var ctx = canvas.getContext('2d');

  // Tell the ctx to use the font.
  ctx.addFont(new Font('avatarFont', fontFile(avatarFont.filename)));

  // draw background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, avatarSize, avatarSize);

  var fontSize = 1;
  var textMetric, textWidth, textHeight;

  if (text.length === 1) {
    // use precalculated font ratio to improve perfomance
    fontSize = avatarSize / avatarFont.ratioWithOneChar;

  } else if (text.length > 1) {
    fontSize = calculateFitFontSize(ctx, avatarSize, avatarFont.name, text);
  }

  ctx.font = fontName(fontSize, avatarFont.name);

  // draw text in the center
  ctx.fillStyle = fgColor;
  ctx.textBaseline = 'top';

  textMetric = ctx.measureText(text);
  textWidth = textMetric.width;
  textHeight = textMetric.emHeightAscent + textMetric.emHeightDescent;

  var x = (avatarSize - textWidth) / 2;
  var y = (avatarSize - textHeight) / 2;
  ctx.fillText(text, x, y);

  if (options.toBase64 === true) {
    return canvas.toDataURL();
  } else {
    return canvas.toBuffer();
  }
};

module.exports.generateFromText = generateFromText;


/**
 * Get colors based on 3 last characters of uuid
 * @param  {String} uuid
 * @return {Object}
 */
var getColorsFromUuid = function(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return DEFAULT_COLOR;
  }

  var length = uuid.length;

  if (length < 3) {
    return DEFAULT_COLOR;
  }

  var sum = uuid.charCodeAt(length - 1) +
            uuid.charCodeAt(length - 2) +
            uuid.charCodeAt(length - 3);
  return COLORS[sum % COLORS_SIZE];
};

module.exports.getColorsFromUuid = getColorsFromUuid;

// Work around to node-canvas issue in version 1.2.3:
// https://github.com/Automattic/node-canvas/issues/487
module.exports.Canvas = Canvas;