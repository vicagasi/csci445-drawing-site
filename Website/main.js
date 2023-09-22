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

    var cleared = false;

    verticesList.forEach(e => {
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
        verticesList = verticesListGhost.pop()
        boundingBoxes = boundingBoxesGhost.pop()

        console.log("Undo successfull")
    } else {
        console.log("Can't undo")
    }

    addLines();
}

function updateGhost(){
    verticesListGhost.push(verticesList);
    boundingBoxesGhost.push(boundingBoxes);
    console.log("Updated ghost:");
    console.log(verticesListGhost)
}

function clearCanvas(){
    verticesList = [];
    boundingBoxes = [];
    render(true, 0);
}

function eraseToggle(){
    if(erasing){
        erasing = false;
    } else {
        erasing = true;
    }
    console.log(erasing);
}

function render(clear, points) {

    if(clear){
        gl.clear( gl.COLOR_BUFFER_BIT );
    }

    gl.drawArrays( gl.LINES, 0, points.length);
}