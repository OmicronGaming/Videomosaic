var bCheckEnabled = true;
var bFinishCheck = false;

var img;
var imgArray = [];
var i = 0;

var interval = setInterval(loadimage, 1);

function loadimage() {

    if (bFinishCheck) {

        clearInterval(interval);
        return
    }

    if (bCheckEnabled) {

        bCheckEnabled = false;

        img = new Image();
        img.onload = fExists;
        img.onerror = fDoesntExist;
        img.src = i + '.png';

    }

}

function fExists() {
    console.log(img.src);
    imgArray.push(img);
    console.log(imgArray);
    i++;
    bCheckEnabled = true;

}

function fDoesntExist() {

    bFinishCheck = true;

}