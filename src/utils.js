export const imageFromSvg = svgString => {
  let image = new Image();
  const svgInBase64 = btoa(svgString);
  const base64Header = "data:image/svg+xml;base64,";
  image.src = base64Header + svgInBase64;
  return image;
};
