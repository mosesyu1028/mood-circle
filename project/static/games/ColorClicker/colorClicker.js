// Color Clicker by yu_0901


let scene = 0;
let score = 0;
let timer = 0;
let timeRemaining = 30.0;
let fps = 30;
let clickedLastFrame = true;
let scoreUploaded = false;

// Prevent cheesing (true check is for var - 100 px)
let minScreenSize = 600;


let colorList = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "gray"];
let correctColor = -1;

// list of possible button positions
let bPosX = [];
let bPosY = [];


// why is this legal
let rightButton = new Clickable();
let wrongButton1 = new Clickable();
let wrongButton2 = new Clickable();
let wrongButton3 = new Clickable();
let wrongButton4 = new Clickable();
let wrongButton5 = new Clickable();
let wrongButton6 = new Clickable();
let wrongButton7 = new Clickable();

rightButton.text = "";
wrongButton1.text = "";
wrongButton2.text = "";
wrongButton3.text = "";
wrongButton4.text = "";
wrongButton5.text = "";
wrongButton6.text = "";
wrongButton7.text = "";

rightButton.strokeWeight = 0;
wrongButton1.strokeWeight = 0;
wrongButton2.strokeWeight = 0;
wrongButton3.strokeWeight = 0;
wrongButton4.strokeWeight = 0;
wrongButton5.strokeWeight = 0;
wrongButton6.strokeWeight = 0;
wrongButton7.strokeWeight = 0;



// runs before draw()
function setup() {
  
  // let width = 500;
  // let height = 500;
  
  let width = windowWidth - 100;
  let height = windowHeight - 100;
  
  if (width < minScreenSize || height < minScreenSize) {
    scene = 3;
  }
  
  // Optional: canvas-squaring
  if (width > height) {
    width = height;
  }
  else {
    height = width;
  }
  
  createCanvas(width, height);
  
  frameRate(fps);
  textAlign(CENTER, CENTER);
  
  let bSize = width * 2/13
  
  rightButton.resize(bSize, bSize);
  wrongButton1.resize(bSize, bSize);
  wrongButton2.resize(bSize, bSize);
  wrongButton3.resize(bSize, bSize);
  wrongButton4.resize(bSize, bSize);
  wrongButton5.resize(bSize, bSize);
  wrongButton6.resize(bSize, bSize);
  wrongButton7.resize(bSize, bSize);
  
  bPosX = [width/13, width/13, width/13, width*4/13, width*7/13, width*10/13, width*10/13, width*10/13];
  bPosY = [height*4/13, width*7/13, width*10/13, width*10/13, width*10/13, width*10/13, width*7/13, width*4/13];
}

// loops frameRate() times a second
function draw() {
  
  // Scene 0: Title screen
  if (scene == 0) {
    background(245);
    
    let startButton = new Clickable();
    
    let startButtonSize = width * 2/5;
    
    startButton.resize(startButtonSize, startButtonSize/2);
    startButton.locate(width/2 - startButtonSize/2, height/2 - startButtonSize/4);
    startButton.color = "#FFFFFF";
    startButton.cornerRadius = 0;
    startButton.strokeWeight = 2;
    startButton.stroke = "#000000";
    startButton.text = "Start game";
    startButton.textColor = "#000000";
    startButton.textFont = "sans-serif";
    startButton.textSize = 24;
    startButton.textScaled = true;
    
    startButton.draw();
    
    startButton.onPress = function() {
      scene = 1;
    }
    
  }
  
  // Scene 1: Game
  else if (scene == 1) {
    background(245);
    
    textSize(32);
    
    fill(0);
    text(timeRemaining, width/2, 50);
    
    // Update new buttons
    if (clickedLastFrame) {
      
      correctColorIdx = floor(random(colorList.length));
      correctColor = colorList[correctColorIdx];
      
      print(correctColor);

      
      
      
      let wrongColorIdx = [];
      for (let i = 0; i < colorList.length; i++) {
        if (i != correctColorIdx) {
          wrongColorIdx.push(i);
        }
      }
      print(wrongColorIdx);
      
      rightButton.color = colorNameToHex(correctColor);
      wrongButton1.color = colorList[wrongColorIdx[0]];
      wrongButton2.color = colorList[wrongColorIdx[1]];
      wrongButton3.color = colorList[wrongColorIdx[2]];
      wrongButton4.color = colorList[wrongColorIdx[3]];
      wrongButton5.color = colorList[wrongColorIdx[4]];
      wrongButton6.color = colorList[wrongColorIdx[5]];
      wrongButton7.color = colorList[wrongColorIdx[6]];
      
      
      let loc = randomlyPermute([0, 1, 2, 3, 4, 5, 6, 7]);
      
      rightButton.locate(bPosX[loc[0]], bPosY[loc[0]]);
      wrongButton1.locate(bPosX[loc[1]], bPosY[loc[1]]);
      wrongButton2.locate(bPosX[loc[2]], bPosY[loc[2]]);
      wrongButton3.locate(bPosX[loc[3]], bPosY[loc[3]]);
      wrongButton4.locate(bPosX[loc[4]], bPosY[loc[4]]);
      wrongButton5.locate(bPosX[loc[5]], bPosY[loc[5]]);
      wrongButton6.locate(bPosX[loc[6]], bPosY[loc[6]]);
      wrongButton7.locate(bPosX[loc[7]], bPosY[loc[7]]);
      
      
      clickedLastFrame = false;
    } // End button update
    
    //fill(correctColor);
    text(correctColor, width/2, height/2 + 25);
    
    
    
    rightButton.draw();
    wrongButton1.draw();
    wrongButton2.draw();
    wrongButton3.draw();
    wrongButton4.draw();
    wrongButton5.draw();
    wrongButton6.draw();
    wrongButton7.draw();
    
    
    
    rightButton.onPress = function() {
      score += 1;
      clickedLastFrame = true;
    }
    
    wrongButton1.onPress = pressedWrongButton;
    wrongButton2.onPress = pressedWrongButton;
    wrongButton3.onPress = pressedWrongButton;
    wrongButton4.onPress = pressedWrongButton;
    wrongButton5.onPress = pressedWrongButton;
    wrongButton6.onPress = pressedWrongButton;
    wrongButton7.onPress = pressedWrongButton;    
    
    
    
    
    if (timeRemaining <= 0.0) {
      score *= 100; // scaling with other minigames
      scene = 2;
    }
    
    else if (frameCount % 3 == 0) {
      timeRemaining = round(timeRemaining - 0.1, 1); // floating point error otherwise
      
    }
    
    
  }
  // Scene 2: End screen
  else if (scene == 2) {
    background(245);
    text("Congratulations!\nYour total score is:\n" + score, width/2, height/2);
    
    
    // Upload score to database
    if (!scoreUploaded) { // Run only once
      httpPost("/ul_score", 'json', {
        score: score,
        game: "color_clicker"
      });

      scoreUploaded = true;
    }
    
  }
  // Scene 3: Error screen
  else if (scene == 3) {
    text("Sorry, but your display appears to be\nincompatible with this game!\nPlease try another game.", width/2, height/2);
  }
}

function pressedWrongButton() {
  score -= 0.5;
  clickedLastFrame = true;
}



// from StackOverflow: https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes/24390910
function colorNameToHex(colour)
{
    var colours = {"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4","azure":"#f0ffff",
    "beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd","blue":"#0000ff","blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
    "cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50","cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
    "darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9","darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
    "darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a","darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f","darkturquoise":"#00ced1",
    "darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff","dimgray":"#696969","dodgerblue":"#1e90ff",
    "firebrick":"#b22222","floralwhite":"#fffaf0","forestgreen":"#228b22","fuchsia":"#ff00ff",
    "gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff","gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
    "honeydew":"#f0fff0","hotpink":"#ff69b4",
    "indianred ":"#cd5c5c","indigo":"#4b0082","ivory":"#fffff0","khaki":"#f0e68c",
    "lavender":"#e6e6fa","lavenderblush":"#fff0f5","lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6","lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
    "lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a","lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899","lightsteelblue":"#b0c4de",
    "lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32","linen":"#faf0e6",
    "magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa","mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371","mediumslateblue":"#7b68ee",
    "mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc","mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1","moccasin":"#ffe4b5",
    "navajowhite":"#ffdead","navy":"#000080",
    "oldlace":"#fdf5e6","olive":"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
    "palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee","palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f","pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
    "rebeccapurple":"#663399","red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
    "saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57","seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb","slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f","steelblue":"#4682b4",
    "tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8","tomato":"#ff6347","turquoise":"#40e0d0",
    "violet":"#ee82ee",
    "wheat":"#f5deb3","white":"#ffffff","whitesmoke":"#f5f5f5",
    "yellow":"#ffff00","yellowgreen":"#9acd32"};

    if (typeof colours[colour.toLowerCase()] != 'undefined')
        return colours[colour.toLowerCase()];

    return false;
}

// from StackOverflow: https://stackoverflow.com/questions/18806210/generating-non-repeating-random-numbers-in-js
function randomlyPermute(inputArr) {
  let ranNums = [];
  let i = inputArr.length;
  let j = 0;

  while (i--) {
    j = Math.floor(Math.random() * (i+1));
    ranNums.push(inputArr[j]);
    inputArr.splice(j,1);
  }
  
  return ranNums;
}