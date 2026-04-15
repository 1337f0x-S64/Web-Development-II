document.addEventListener("DOMContentLoaded", () => {
  /* add code after this comment */

  //   const imageNode = document.querySelector("#imgManipulated img");
  //   const emNode = document.querySelector("figcaption em");
  //   const spanNode = document.querySelector("figcaption span");

  //   const resetFilters = document.querySelector("#resetFilters");
  //   resetFilters.addEventListener("click", () => {
  //     imageNode.style.filter = "none";
  //   });

  //   const thumbnails = document.querySelectorAll("#thumbBox img");
  //   for (const thumb of thumbnails) {
  //     thumb.addEventListener("click", (e) => {
  //       imageNode.src = thumbnails.src.replace("small", "medium");
  //       emNode.textContent = thumb.alt;
  //       spanNode.textContent = thumb.title;
  //     });
  //   }

  //   function setOpacity(imageNode, value) {
  //     imageNode.style.filter = `opacity(${value / 100})`;
  //   }

  //   const sliderOpacity = document.getElementById("sliderOpacity");
  //   sliderOpacity.addEventListener("change", (e) => {
  //     setOpacity(imageNode, e.target.value);
  //     const numOpacity = document.getElementById("numOpacity");
  //     numOpacity.textContent = `${e.target.value}`;
  //   });

  //   function setSaturation(imageNode, value) {
  //     imageNode.style.filter = `saturate(${value / 100})`;
  //   }

  //   const sliderSaturation = document.getElementById("sliderSaturation");
  //   sliderSaturation.addEventListener("change", (e) => {
  //     setSaturation(imageNode, e.target.value);
  //     const numSaturation = document.getElementById("numSaturation");
  //     numSaturation.textContent = `${e.target.value}`;
  //   });

  //   function setBrightness(imageNode, value) {
  //     imageNode.style.filter = `brightness(${value / 100})`;
  //   }

  //   const sliderBrightness = document.getElementById("sliderBrightness");
  //   sliderBrightness.addEventListener("change", (e) => {
  //     setBrightness(imageNode, e.target.value);
  //     const numBrightness = document.getElementById("numBrightness");
  //     numBrightness.textContent = `${e.target.value}`;
  //   });

  //   function setHue(imageNode, value) {
  //     imageNode.style.filter = `hue-rotate(${value + 1} Deg)`;
  //   }

  //   const sliderHue = document.getElementById("sliderHue");
  //   sliderHue.addEventListener("change", (e) => {
  //     setHue(imageNode, e.target.value);
  //     const numHue = document.getElementById("numHue");
  //     numHue.textContent = `${e.target.value}`;
  //   });

  //   function setGray(imageNode, value) {
  //     imageNode.style.filter = `grayscale(${value / 100})`;
  //   }

  //   const sliderGray = document.getElementById("sliderGray");
  //   sliderGray.addEventListener("change", (e) => {
  //     setGray(imageNode, e.target.value);
  //     const numGray = document.getElementById("numGray");
  //     numGray.textContent = `${e.target.value}`;
  //   });

  const thumbnail = document.querySelector("#imgManipulated img");

  const resetFilters = document.querySelector("#resetFilters");
  resetFilters.addEventListener("click", () => {
    thumbnail.style.filter = "none";
  });

  const thumbnails = document.querySelectorAll("#thumbBox img");
  for (const img of thumbnails) {
    img.addEventListener("click", (e) => {
      const imgPath = img.getAttribute("src");
      thumbnail.setAttribute("src", imgPath.replace("small", "medium"));

      document.querySelector("figcaption em").textContent =
        img.getAttribute("title");
      document.querySelector("figcaption span").textContent =
        img.getAttribute("alt");
    });
  }

  const sliderBox = document.querySelector("#sliderBox");
  sliderBox.addEventListener("change", (e) => {
    if (e.target && e.target.nodeName == "INPUT") {
      thumbnail.style.filter =
        "opacity(" +
        document.querySelector("#sliderOpacity").value +
        "%)" +
        "saturate(" +
        document.querySelector("#sliderSaturation").value +
        "%)" +
        "brightness(" +
        document.querySelector("#sliderBrightness").value +
        "%)" +
        "hue-rotate(" +
        document.querySelector("#sliderHue").value +
        "deg)" +
        "grayscale(" +
        document.querySelector("#sliderGray").value +
        "%)" +
        "blur(" +
        document.querySelector("#sliderBlur").value +
        "px)";

      refreshValueLabels();
    }

    function refreshValueLabels() {
      document.querySelector("#numOpacity").textContent =
        document.querySelector("#sliderOpacity").value;
      document.querySelector("#numSaturation").textContent =
        document.querySelector("#sliderSaturation").value;
      document.querySelector("#numBrightness").textContent =
        document.querySelector("#sliderBrightness").value;
      document.querySelector("#numHue").textContent =
        document.querySelector("#sliderHue").value;
      document.querySelector("#numGray").textContent =
        document.querySelector("#sliderGray").value;
      document.querySelector("#numBlur").textContent =
        document.querySelector("#sliderBlur").value;
    }
  });
});
