/* 
Code is a little scuffed lol
*/

// Global Vars

let width = 500,
    height = 0,
    filter = 'none',
    streaming = false,
    numphotos = 154,
    tileSize = 9, // length of one side of square in pixels
    qualityup = 2,
    videoon = false,
    intervalID = null;

// DOM elements

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const photos = document.getElementById('photos');
const photoButton = document.getElementById('photo-button');
const videoButton = document.getElementById('video-button');
const clearButton = document.getElementById('clear-button');

// Get media stream

navigator.mediaDevices.getUserMedia({video: true, audio: false})
    .then(function(stream) {

        // Link to video source
        video.srcObject = stream;
        // Play video
        video.play();
        video.play();

    })
    .catch(function(err) {

        console.log(`Error: ${err}`);

    });

    // Play when ready
    video.addEventListener('canplay', function(e) {
        if(!streaming) {
            // Set video / canvas height
            height = video.videoHeight / (video.videoWidth / width);
            video.setAttribute('width', width);
            video.setAttribute('height', height);
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);

            tileSize = Math.round(Math.min(height, width) / 35);

            streaming = true;
        }

    /*clearButton.addEventListener('click', function() {
        // Clear photos
        photos.innerHTML = '';
    }, false);
    }*/});

function imageToRGB(image) {

    let canvas2 = document.createElement('canvas');
    const ctx = canvas2.getContext('2d');

    // console.log(image.width);
    // console.log(image.height);

    canvas2.width = image.width;
    canvas2.height = image.height;

    ctx.drawImage(image, 0, 0);
    let imageData = ctx.getImageData(0, 0, canvas2.width, canvas2.height);

    let data = imageData.data;
    let rgbArray = [];

    for (let i = 0; i < data.length; i +=4) {

        let red = data[i];
        let green = data[i+1];
        let blue = data[i+1];
        rgbArray.push([red,green,blue]);
    }

    return rgbArray;

}

function getAvgRGB(imgarray) {

    let rgb = {r:0, g:0, b:0},
        rgbblock = 1, // if need to save data on avgrgb
        i = rgbblock * -1,
        length = imgarray.length,
        count = 0;

    while ((i += 1 * rgbblock) < length) {

        count++;
        rgb.r += imgarray[i][0];
        rgb.g += imgarray[i][1];
        rgb.b += imgarray[i][2];


    }

    rgb.r = Math.round(rgb.r / count);
    rgb.g = Math.round(rgb.g / count);
    rgb.b = Math.round(rgb.b / count);

    return rgb;

}

function findNearestTile(rgblist, tilelist, tileData) {

    let length = tilelist.length,
        tileAvg = getAvgRGB(tileData),
        i = 0,
        temp = 0,
        minDist = 10000,
        image = null;

    while (i < length) {
        temp = rgblist[i];
        let dist = Math.sqrt((tileAvg.r - temp.r)**2 + (tileAvg.g - temp.g)**2 + (tileAvg.b - temp.b)**2)


        if (dist < minDist) {

            minDist = dist;
            image = tilelist[i];

        }

        i++;
    }

    return image;
}

function buildArraysPart2(tilenames) { // Scuffed code? Me? I would never

    let tilergbs = [];
    let rgbarray = 0;
    let j = 0;

    // Get nearest arrays

    while (j < tilenames.length) {
        rgbarray = imageToRGB(tilenames[j]);
        tilergbs[j] = getAvgRGB(rgbarray);
        // console.log(rgbarray);
        j++;
    }
    
    console.log(tilergbs);
    console.log(tilenames);
    return [tilergbs, tilenames];

}

async function buildArrays() {
    return new Promise(resolve => {

        let tilenames = [];
    
        let i = 0;
        let imageLoadCount = 0;

        while (i < numphotos) {
            let image = new Image();
            image.src = i + '.jpg';
            tilenames[i] = image;
            i++;
        }

        tilenames.forEach(image => {
            if (image.complete) {
                imageLoadCount++;
            }

            image.addEventListener('load', () => {
                imageLoadCount++;


                if (imageLoadCount === numphotos) { // Need all images to load in order to build rgb arrays

                    console.log("Images loaded")
                    rtrnvalue = buildArraysPart2(tilenames);
                    resolve(rtrnvalue);

                }
            })
        })

        /*tilenames.forEach(image => { // Test to see photos load

            photos.appendChild(image);

        })*/

    });
}

buildArrays().then(rtrnvalue => {

    let tilergbs = rtrnvalue[0];
    let tilenames = rtrnvalue[1];

    const inputcanvas = document.createElement('canvas');
    const outputcanvas = document.createElement('canvas');

    const ctxi = inputcanvas.getContext('2d');
    const ctxo = outputcanvas.getContext('2d');

    console.log("Ready to mosaic!");

    photoButton.addEventListener('click', function(error) {

        MakeVideoStream(inputcanvas, outputcanvas, ctxi, ctxo, tilergbs, tilenames);

        error.preventDefault();

    }, false);
});

function MakeVideoStream(inputcanvas, outputcanvas, ctxi, ctxo, tilergbs, tilenames) {

    photos.innerHTML = '';

    inputcanvas.setAttribute('width', width);
    inputcanvas.setAttribute('height', height);

    ctxi.drawImage(video, 0, 0, width, height);

    let numRows = Math.ceil(inputcanvas.height / tileSize);
    let numCols = Math.ceil(inputcanvas.width / tileSize);

    let outputwidth = qualityup*numCols * tileSize;
    let outputheight = qualityup*numRows * tileSize;

    outputcanvas.setAttribute('width', outputwidth);
    outputcanvas.setAttribute('height', outputheight);

    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {

            let xcoord = c * tileSize;
            let ycoord = r * tileSize;

            let dataOfTile = ctxi.getImageData(xcoord, ycoord, tileSize, tileSize);

            let data = dataOfTile.data;
            let tilergbArray = [];

            for (let k = 0; k < data.length; k +=4) {

                let red = data[k];
                let green = data[k+1];
                let blue = data[k+1];
                tilergbArray.push([red,green,blue]);
            }

            let nearestimage = findNearestTile(tilergbs, tilenames, tilergbArray);
            ctxo.drawImage(nearestimage, qualityup*xcoord, qualityup*ycoord, qualityup*tileSize, qualityup*tileSize);
        }
    }

    const outputUrl = outputcanvas.toDataURL('image/png');

    // Create img element
    const outputimg = document.createElement('img');

    // Set img src
    outputimg.setAttribute('src', outputUrl);

    // Add img to photos
    photos.appendChild(outputimg);

}

function AutoClick() {

    photoButton.click();

}

videoButton.addEventListener('click', function(error) {

    if (videoon == false) {

        videoon = true;
        document.getElementById("video-button").className = 'btn-off';
        document.getElementById("video-button").innerHTML = "Stop Video Stream"
        
        intervalID = setInterval(AutoClick, 200); // scuffed function call, i know
        console.log(intervalID);
        console.log(videoon);

    } else {
        videoon = false;
        document.getElementById("video-button").className = 'btn-on';
        document.getElementById("video-button").innerHTML = "Start Video Stream"
        try {

            clearInterval(intervalID);

        } catch(error) {

            console.log(error);
       }
    }

    error.preventDefault();
}, false);
