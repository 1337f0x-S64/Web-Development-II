const photos = JSON.parse(content);

/* put your code after this */

function createFigure(img, alt, title, desc, colors) {
  const figureNode = document.createElement("figure");
  const imageNode = document.createElement("img");
  const figcapNode = document.createElement("figcaption");
  const h2Node = document.createElement("h2");
  const p = document.createElement("p");

  imageNode.src = img;
  imageNode.alt = alt;

  h2Node.textContent = title;
  p.textContent = desc;

  figcapNode.appendChild(h2Node);
  figcapNode.appendChild(p);

  for (const color of colors) {
    const spanNode = document.createElement("span");
    spanNode.style.backgroundColor = color.hex;
    figcapNode.appendChild(spanNode);
  }

  figureNode.appendChild(imageNode);
  figureNode.appendChild(figcapNode);

  return figureNode;
}

const selector = document.getElementById("parent");

for (const photo of photos) {
  const newFigureNode = createFigure(
    `images/${photo.filename}`,
    photo.title,
    photo.title,
    photo.description,
    photo.colors,
  );

  selector.appendChild(newFigureNode);
}
// function createImage(photo) {
//   const image = document.createElement("img");
//   image.setAttribute("src", `images/${photo.filename}`);
//   image.setAttribute("alt", `${photo.title}`);
//   return image;
// }

// function createCaption(photo) {
//   const caption = document.createElement("figcaption");
//   caption.appendChild(createHeader(photo));
//   caption.appendChild(createParagraph(photo));
//   createColorScheme(caption, photo);
//   return caption;
// }

// function createColorScheme(caption, photo) {
//   for (const c of photo.colors) {
//     const span = document.createElement("span");
//     span.style.backgroundColor = c.hex;
//     caption.appendChild(span);
//   }
// }

// function createHeader(photo) {
//   const h2 = document.createElement("h2");
//   const h2Text = document.createTextNode(photo.title);
//   h2.appendChild(h2Text);
//   return h2;
// }

// function createParagraph(photo) {
//   const p = document.createElement("p");
//   const pText = document.createTextNode(photo.description);
//   p.appendChild(pText);
//   return p;
// }

// const parent = document.querySelector("#parent");

// for (const ph of photos) {
//   const figure = document.createElement("figure");
//   figure.appendChild(createImage(ph));
//   figure.appendChild(createCaption(ph));
//   parent.appendChild(figure);
// }
