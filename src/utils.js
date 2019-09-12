export const imageFromSvg = svgString => {
  let image = new Image();
  const svgInBase64 = btoa(svgString);
  const base64Header = "data:image/svg+xml;base64,";
  image.src = base64Header + svgInBase64;
  return image;
};

/*
 * Returns a random number between 0 and max.
 */
export const random = (max = 1) => {
  return Math.random() * max;
};

/*
 * Gets random int between [min, max).
 */
export const randomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
};

/*
 * Returns distance between two points.
 */
export const getDistance = (a, b) => {
  const xDiff = a.x - b.x;
  const yDiff = a.y - b.y;
  return Math.sqrt(xDiff * xDiff + yDiff * yDiff);
};
