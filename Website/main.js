// Structure
var gl;
var canvas;
var vertices = [];
var verticesList = [];
var boundingBoxes = [];
var program;

// Position
var startX;
var startY;
var endX;
var endY;

// Bools
var erasing = false;
var canGhost = true;

// Undo
var verticesListGhost = [];
var boundingBoxesGhost = [];
var colorsArrayGhost = [];

// Color
var color = new Uint8Array(4);
var colorsArray = [];
var colorSelected = 0;
var vertexColors = [
    vec4( 0.0, 0.0, 0.0, 1.0 ),  // black
    vec4( 1.0, 0.0, 0.0, 1.0 ),  // red
    vec4( 1.0, 1.0, 0.0, 1.0 ),  // yellow
    vec4( 0.0, 1.0, 0.0, 1.0 ),  // green
    vec4( 0.0, 0.0, 1.0, 1.0 ),  // blue
    vec4( 1.0, 0.0, 1.0, 1.0 ),  // magenta
    vec4( 1.0, 1.0, 1.0, 1.0 ),  // white
    vec4( 0.0, 1.0, 1.0, 1.0 ),  // cyan
];

window.onload = function main() {

    canvas = document.getElementById("canvas");

    // Initialize the GL context
    gl = WebGLUtils.setupWebGL(canvas);
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //  Configure WebGL
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
     
    //  Load shaders and initialize attribute buffers
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    window.addEventListener("mousedown", mouseStart);
    window.addEventListener("mouseup", mouseEnd);
}

function mouseStart(mouse){
    startX = (-1 + 2 * mouse.clientX/canvas.width)
    startY = (-1 + 2 *(canvas.height - mouse.clientY)/canvas.height)
}

function mouseEnd(mouse){
    endX = (-1 + 2 * mouse.clientX/canvas.width)
    endY = (-1 + 2 *(canvas.height - mouse.clientY)/canvas.height)

    if(!erasing){
        makeLine();
    } else {
        erase();
    }
}

function makeLine(){
    vertices = [
        vec2 = [startX, startY],
        vec2 = [endX, endY]
    ]
    makeBoundingBox();
    verticesList.push(vertices);
    addLines();
}

function makeBoundingBox(){
    var box = {
        x1:startX,
        y1:startY,
        x2:endX,
        y2:endY
    }

    boundingBoxes.push(box);
    console.log(box);
}

function erase(){

    boundingBoxes.forEach(e => {
        // If coords are within the bounding box...
        if((((e.x1 <= startX && e.x2 >= startX) || (e.x1 >= startX && e.x2 <= startX)) ||
        ((e.y1 <= startY && e.y2 >= startY) || (e.y1 >= startY && e.y2 <= startY))) ||
        (((e.x1 <= endX && e.x2 >= endX) || (e.x1 >= endX && e.x2 <= endX)) ||
        ((e.y1 <= startY && e.y2 >= endY) || (e.y1 >= startY && e.y2 <= endY)))
        ){

            // if there is only one thing possible to erase
            if(verticesList.length < 2){
                verticesList = [];
                boundingBoxes = [];
            } else {
                var i = boundingBoxes.indexOf(e);
                var temp = boundingBoxes.splice(i, 1);
                temp = verticesList.splice(i, 1);
                temp = colorsArray.splice(i, 1);
                console.log("Deleting: ", verticesList[i])
                console.log(verticesList)
            }

            addLines();
        }
    });
}

function addLines(){

    // protection for adding list to ghost after undo
    if(canGhost){
        updateGhost();
    } else {
        canGhost = true;
    }

    // assigns currently selected color to line
    assignLineColor();

    var cleared = false;
    var i = 0;
    verticesList.forEach(e => {
        // Associate our color with our data
        var cBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(colorsArray[i]), gl.STATIC_DRAW );
        i++;

        var vColor = gl.getAttribLocation( program, "vColor" );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        // Load the data into the GPU
        var bufferId = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
        gl.bufferData( gl.ARRAY_BUFFER, flatten(e), gl.STATIC_DRAW);

        // Associate out shader variables with our data buffer
        var vPosition = gl.getAttribLocation( program, "vPosition" );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );

        if(!cleared){
            cleared = true;
            render(true, e)
        } else {
            render(false, e)
        }
    });
}

function undo(){
    if(!(verticesListGhost.length < 1)){
        verticesList = verticesListGhost.pop();
        boundingBoxes = boundingBoxesGhost.pop();
        colorsArray = colorsArrayGhost.pop();

        console.log("Undo successfull")
    } else {
        console.log("Can't undo")
    }

    addLines();
}

function updateGhost(){
    //verticesListGhost.push(verticesList);
    //boundingBoxesGhost.push(boundingBoxes);
    //colorsArrayGhost.push(colorsArray);
    console.log("Updated ghost:");
    // console.log(verticesListGhost)
}

function clearCanvas(){
    verticesList = [];
    boundingBoxes = [];
    colorsArray = [];
    verticesListGhost = [];
    boundingBoxesGhost = [];
    colorsArrayGhost = [];
    render(true, 0);
}

function eraseToggle(){
    var eraseButton = document.getElementById("erase");
    if(erasing){
        erasing = false;
        eraseButton.classList.remove("show");
    } else {
        erasing = true;
        eraseButton.classList.add("show");
    }
    console.log(erasing);
}

function render(clear, points) {

    if(clear){
        gl.clear( gl.COLOR_BUFFER_BIT );
    }

    gl.drawArrays( gl.LINES, 0, points.length);
}

function assignLineColor(){
    colorsArray.push(vertexColors[colorSelected]);
    console.log(vertexColors[colorSelected]);
}

function selectColor(x){
    switch (x) {
        case 1:
            colorSelected = 1; //Red
            console.log("Color is now RED")
            break;
        case 2:
            colorSelected = 2; //Yellow
            console.log("Color is now YELLOW")
            break;
        case 3:
            colorSelected = 3; //Green
            break;
        case 4:
            colorSelected = 4; //Blue
            break;
        case 5:
            colorSelected = 5; //Magenta
            break;
        case 6:
            colorSelected = 6; //White
            break;
        case 7:
            colorSelected = 7; //Cyan
            break;
        default:
            colorSelected = 0; //Black
            console.log("Color is now BLACK")
            break;
    }
    
}