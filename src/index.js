require("./style.scss");
var quantize = require("quantize");

let initializing = false;

let videoSlider = document.querySelector(".videoSlider");
let sliderRightArrow = document.querySelector(".rightArrow");
let sliderLeftArrow = document.querySelector(".leftArrow");

let videos = document.querySelectorAll(".videoInsert");
const canvas = document.createElement("canvas");

function isScrolledIntoView(el, i, length) {
  var rect = el.getBoundingClientRect();
  if (rect.right / 1.1 <= videoSlider.offsetWidth && rect.right > 150) {
    el.children[el.children.length - 1].play();
    if (initializing) {
      if (length && parseFloat(el.id) >= length) {
        sliderRightArrow.hash = `#${1}`;
      } else {
        sliderRightArrow.hash = `#${parseFloat(el.id) + 1}`;
      }
      if (parseFloat(el.id) == 1) {
        sliderLeftArrow.hash = `#${length}`;
      } else {
        sliderLeftArrow.hash = `#${parseFloat(el.id) - 1}`;
      }
    }
  } else {
    el.children[el.children.length - 1].pause();
  }
}

let ifVideoScrolled = () => {
  Object.values(videoSlider.children).map((video, index) => {
    isScrolledIntoView(video, index, videoSlider.children.length);
  });
};
ifVideoScrolled();
videoSlider.addEventListener("scroll", ifVideoScrolled);

// Object.values(videoSlider.children).map((video, index) => {
//   isScrolledIntoView(video, index);
// });

initializing = true;

function validateOptions(options) {
  let { colorCount, quality } = options;

  if (typeof colorCount === "undefined" || !Number.isInteger(colorCount)) {
    colorCount = 10;
  } else if (colorCount === 1) {
    throw new Error(
      "colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()"
    );
  } else {
    colorCount = Math.max(colorCount, 2);
    colorCount = Math.min(colorCount, 20);
  }

  if (
    typeof quality === "undefined" ||
    !Number.isInteger(quality) ||
    quality < 1
  ) {
    quality = 10;
  }

  return {
    colorCount,
    quality,
  };
}

function loadImg(img) {
  return new Promise((resolve, reject) => {
    resolve(img);
  });
}

function getPalette(img, colorCount = 10, quality = 10) {
  const options = validateOptions({
    colorCount,
    quality,
  });

  return new Promise((resolve, reject) => {
    loadImg(img)
      .then((imgData) => {
        const pixelCount = imgData.height * imgData.width;
        const pixelArray = createPixelArray(
          imgData.data,
          pixelCount,
          options.quality
        );

        const cmap = quantize(pixelArray, options.colorCount);
        const palette = cmap ? cmap.palette() : null;

        resolve(palette);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function createPixelArray(imgData, pixelCount, quality) {
  const pixels = imgData;
  const pixelArray = [];

  for (let i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality) {
    offset = i * 4;
    r = pixels[offset + 0];
    g = pixels[offset + 1];
    b = pixels[offset + 2];
    a = pixels[offset + 3];

    // If pixel is mostly opaque and not white
    if (typeof a === "undefined" || a >= 125) {
      if (!(r > 250 && g > 250 && b > 250)) {
        pixelArray.push([r, g, b]);
      }
    }
  }
  return pixelArray;
}

function drawImg(canvas, image) {
  return new Promise((resolve) => {
    canvas.getContext("2d").drawImage(image, 10, 10, 100, 100);
    resolve("resolved");
  });
}

setInterval(() => {
  Object.values(document.querySelectorAll(".progress")).map((progress, i) => {
    progress.value =
      (progress.nextElementSibling.currentTime /
        progress.nextElementSibling.duration) *
      100;
    if (
      progress.nextElementSibling.currentTime ===
      progress.nextElementSibling.duration
    ) {
      if (
        document.querySelectorAll(".progress").length ==
        parseFloat(progress.offsetParent.id)
      ) {
        progress.nextElementSibling.currentTime = 0
        location.hash = "#" + 1;
      } else {
        progress.nextElementSibling.currentTime = 0
        location.hash = "#" + (parseFloat(progress.offsetParent.id) + 1);
      }
    }
  });
}, 10);

let getContrastColors = () => {
  Object.values(videos).map((video, i) => {
    video.crossOrigin = "Anonymous";

    var checkVideo = setInterval(() => {
      if (video.readyState === 4) {
        // video.onloadeddata = videoIsLoaded;
        drawImg(canvas, video);
        runVidImages(canvas.getContext("2d").getImageData(10, 10, 100, 100), i);
        console.log(canvas.getContext("2d").getImageData(10, 10, 100, 100))
        video.currentTime = 0;
        if (i > 0) {
          video.pause();
        }
        clearInterval(checkVideo);
      }
    }, 1);

    // function canvasLoaded(canvas, video) {
    //   drawImg(canvas, video);
    //   runVidImages(canvas.getContext("2d").getImageData(10, 10, 100, 100), i);
    //   video.currentTime = 0;
    //   if(i > 0) {
    //     video.pause()
    //   }
    // }

    // function videoIsLoaded() {
    //   video.currentTime = video.duration - 1;
    //   canvas.onloadeddata = canvasLoaded(canvas, video);
    // }
  });
};

function runVidImages(img, i) {
  let colors = getPalette(img);
  videoSlider.children[i].children[0].style.opacity = 1;

  colors.then((data) => {
    function luminanace(r, g, b) {
      var a = [r, g, b].map(function(v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }
    function contrast(rgb1, rgb2) {
      var lum1 = luminanace(rgb1[0], rgb1[1], rgb1[2]);
      var lum2 = luminanace(rgb2[0], rgb2[1], rgb2[2]);
      var brightest = Math.max(lum1, lum2);
      var darkest = Math.min(lum1, lum2);
      return (brightest + 0.05) / (darkest + 0.05);
    }

    let mostContrast = [];

    let val = 0;

    data.map((a) => {
      data.map((b) => {
        mostContrast[val] = {
          color1: a,
          color2: b,
          contrast: contrast(a, b),
        };
        val++;
      });
    });
    mostContrast = mostContrast.sort((a, b) =>
      a.contrast > b.contrast ? 1 : b.contrast > a.contrast ? -1 : 0
    )[mostContrast.length - 1];

    videoSlider.children[
      i
    ].children[0].style.backgroundColor = `rgba(${mostContrast.color1}, 1)`;
    videoSlider.children[i].children[0].style.color = `rgb(${
      mostContrast.contrast > 2.5 ? mostContrast.color2 : "#fff"
    })`;
    videoSlider.children[i].children[0].style.width = `100vw`;
    videoSlider.children[i].children[0].style.opacity = `1`;
    videoSlider.children[i].children[1].style.opacity = `1`;
  });
}

getContrastColors();
