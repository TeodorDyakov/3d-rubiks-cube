vaxInit();
            
camera.position.set(0,0,50); // Set position like this
camera.lookAt(new THREE.Vector3(0,0,0)); // Set look at coordinate like this

var n = 3;
var half = Math.floor(n/2);
var cubeletSz = 5/half;
var gapSz = 0.1/half;
var stickerSz = 4.5/ half;
var cubelets = [];
var cube = new THREE.Group();
var stickerGeometry = new THREE.PlaneGeometry(stickerSz, stickerSz);

function createCube(n){
    scene.clear();
    cube = new THREE.Group();
    cubelets = [];
    half = Math.floor(n/2);
    cubeletSz = 5/half;
    gapSz = 0.2/half;
    stickerSz = 4.5/ half;
    stickerGeometry = new THREE.PlaneGeometry(stickerSz, stickerSz);
    scene.add(cube);
    cube.rotateY(Math.PI/4);
    console.log(gapSz);
    var boxSideGeometry = new THREE.BoxGeometry(cubeletSz, cubeletSz, cubeletSz);
    var boxSideMaterial = new THREE.MeshBasicMaterial({
        color: 'black',
        shininess: 50
    });

    var cubelet = new THREE.Mesh(boxSideGeometry, boxSideMaterial);

    for(let i = -half; i <= half; i++){
        for(let j = -half; j <= half; j++){
            for(let k = -half; k <= half; k++){
                var newCubelet = cubelet.clone();
                cubelets.push(newCubelet);
                newCubelet.position.set(i * (cubeletSz + gapSz), j * (cubeletSz +gapSz), k * (cubeletSz + gapSz));
                cube.add(newCubelet);
            }
        }
    }

    placeStickersOnSide('F');
    placeStickersOnSide('L');
    placeStickersOnSide('R');
    placeStickersOnSide('D');
    placeStickersOnSide('B');
    placeStickersOnSide('U'); 
}


function getSide(side){
    const pos = cubeletSz + gapSz;
    //x -0, y - 1, z - 2
    var faceToAxis = {
        'F': 2,
        'B': 2,
        'U': 1,
        'D' : 1,
        'L' : 0,
        'R' : 0
    }

    var faceToCoordVal = {
        'F': pos * half,
        'B': -pos * half,
        'U': pos * half,
        'D' : -pos * half,
        'L' : -pos * half,
        'R' : pos * half 
    }

    return getSideByCoord(faceToAxis[side], faceToCoordVal[side]);
}

//coordIdx: 0, 1, 2 (x-0, y- 1, z- 2)
// coord value: -5.5, 0, or 5.5. 5.5 == cubeletSz + gapSz
function getSideByCoord(coordIdx, coordValue){
    var group = [];
    for(let i = 0; i < cubelets.length; i++){
        var arr = cubelets[i].position.toArray();
        var cubeletCoordVal = arr[coordIdx];
        if(Math.abs(cubeletCoordVal - coordValue) < 0.1){
            group.push(cubelets[i]);
        }
    }
    return group;
}

function placeStickersOnSide(face){
    const faceColors = {'F' : 'red', 'L': 'white', 'U' : 'blue', 'R' : 'yellow', 'B' : 'orange', 'D' : 'green'};
    
    var side = getSide(face);
    var sticker = new THREE.Mesh(stickerGeometry, new THREE.MeshBasicMaterial({color:faceColors[face]}));
    sticker.isSticker = true;

    for(const s of side){
        var st = sticker.clone();
        
        st.isSticker = true;

        const pos = cubeletSz/2 + 0.1;
        if(face == 'F'){
            st.position.set(0, 0, pos);
        }else if(face == 'L'){
            st.rotation.set(0, -Math.PI/2, 0);
            st.position.set(-pos, 0, 0);
        }else if(face == 'R'){
            st.rotation.set(0, Math.PI/2, 0);
            st.position.set(pos, 0, 0);
        }else if(face == 'B'){
            st.rotation.set(-Math.PI, 0, 0);
            st.position.set(0, 0, -pos);
        }else if(face == 'U'){
            st.rotation.set(-Math.PI/2, 0, 0);
            st.position.set(0, pos, 0);
        }else if(face == 'D'){
            st.rotation.set(Math.PI/2, 0, 0);
            st.position.set(0, -pos, 0);
        }
        s.add(st);
    }    
}

//normal vector in regard to cube. Probably there is a better way to do this.
function getNormalVectorOfSticker(sticker){
    var v = new THREE.Vector3(0, 0, 1);
    v.applyEuler(sticker.rotation);
    v.applyEuler(sticker.parent.rotation);
    return v;
}

function round2(num){
    return Math.round(num * 100) / 100;
}

//returns an array containing index of non-zero elements
function indexesOfNotZero(v3){
    var res = [];
    var arr = v3.toArray();
    for(let i = 0; i < arr.length; i++){
        if(Math.abs(arr[i]) > 0.00001){
            res.push(i);
        }
    }
    return res;
}

function removeFromArr(arr, val){
    const index = arr.indexOf(val);
    if (index > -1) {
      arr.splice(index, 1);
    }
}
//this is global variable - bad
var rotationAxis = null;

//this function returns -1 if the user has chosen two cubelets that form invalid rotation, or
//if the users has selected two stickers of same cubelet
function getSideByTwoStickers(sticker1, sticker2){
    if(!sticker1.isSticker || !sticker2.isSticker){
        return -1;
    }

    if(sticker1.parent == sticker2.parent){
        return -1;
    }
    var normal = getNormalVectorOfSticker(sticker1);
    console.log(normal);

    var cubelet1 = sticker1.parent;
    var cubelet2 = sticker2.parent;
    
    var direction = cubelet2.position.clone().sub(cubelet1.position);
    console.log(direction);
    //TODO
    var dot = direction.clone().normalize().dot(normal);

    if(Math.abs(1 - Math.abs(dot)) < 0.001){
        return -1;  
    }
    //direction is invalid if it has more than coordinate that is not (almost)zero
    var nonZeroIdx = indexesOfNotZero(direction);

    if(nonZeroIdx.length > 1){
        return -1;
    }
    rotationAxis = normal.clone().cross(direction);

    var idx1 = nonZeroIdx[0];
    var idx2 = indexesOfNotZero(normal)[0];

    var axes = [0, 1, 2];

    removeFromArr(axes, idx1);
    removeFromArr(axes, idx2);
    var axis = axes[0];
    
    var val = cubelet1.position.toArray()[axis];
    return getSideByCoord(axis, val);
}


var clickedCubelet1 = null, clickedCubelet2 = null;

const sideToAxes = {
    'F': new THREE.Vector3(0, 0, 1),
    'B': new THREE.Vector3(0, 0, -1),
    'L': new THREE.Vector3(-1, 0, 0),
    'R': new THREE.Vector3(1, 0, 0),
    'U': new THREE.Vector3(0, 1, 0),
    'D': new THREE.Vector3(0, -1, 0),
}

function getClosestAxis(side){
    //we need actually inverse but transpose will do since it is a rotation matrix only
    var cubeMat = new THREE.Matrix4().copy(cube.matrix).transpose();
    var axis = sideToAxes[side].clone();
    axis.applyMatrix4(cubeMat);

    var smallestAngle = Math.PI;
    var closestAxis = null;

    for(const s in sideToAxes){
        var angle = Math.abs(axis.angleTo(sideToAxes[s]));        
        if(angle < smallestAngle){
            smallestAngle = angle;
            closestAxis = s;
        }
    }
    return closestAxis;
}

//a very ugly way to write this function but whatever. It can be called in two different ways:
// first way: axis == null, side is one of 'U', 'L', 'R' etc
//second way: side is array of cubelets and axis is non null.
function rotateSide(side, angle, axis){
    var local = null;

    if(axis == null){
        axis = sideToAxes[side];
        local = getSide(side);
    }else{
        local = side;
    }
    for(const el of local){
        const v = new THREE.Vector3(el.position.x, el.position.y, el.position.z);
        v.applyAxisAngle(axis, angle);
        el.position.set(v.x, v.y, v.z);
        el.rotateOnWorldAxis(axis, angle);
    }
}

var canvas = renderer.domElement;
canvas.addEventListener('mousemove', onMouseMove);
var mouseDown = false;


function getClickedObjects(e){
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    var x, y;
    if(e.type == 'touchstart' || e.type == 'touchmove' || e.type == 'touchend'){
        var touch;
        if(e.type == "touchend"){
            if(!previousTouch){
                return -1;
            }
            touch = previousTouch;
        }else{
            touch = e.touches[0];
        }
        x = touch.pageX;
        y = touch.pageY;
    } else if (e.type == 'mousedown' || e.type == 'mouseup') {
        x = e.clientX;
        y = e.clientY;
    }
    pointer.x = ( x / window.innerWidth ) * 2 - 1;
	pointer.y = - (y / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( pointer, camera );

    const intersects = raycaster.intersectObjects( scene.children );
    return intersects;
}

document.body.onmousedown = function(e) {
    const intersects = getClickedObjects(e);
    
    if(intersects[0]){
        if(clickedCubelet1 == null){
            clickedCubelet1 = intersects[0];
        }
    }else{
        mouseDown = true;
    }
}

function secondStickerMouseUpCallback(e){
    const intersects = getClickedObjects(e);
    
    if(clickedCubelet2 == null && clickedCubelet1 != null && intersects[0]){
        clickedCubelet2 = intersects[0];
        
        if(!animation && !scrambleAnimation){
            sideToRotate = getSideByTwoStickers(clickedCubelet1.object, clickedCubelet2.object);
            if(sideToRotate != -1){
                turnDir = -1;
                rotationAxis = rotationAxis.normalize();
                animation = true;
            }
        }   
        clickedCubelet2 = null;
        clickedCubelet1 = null;
    }
}

document.body.onmouseup = function(e) {
    secondStickerMouseUpCallback(e);
    mouseDown = false;
}

var sideToRotate;

const keyToFace = {
    37 : 'L',
    38 : 'U',
    39 : 'R',
    40 : 'D'
}

var previousTouch;

document.body.addEventListener("keydown", onDocumentKeyDown, false);
document.body.addEventListener("touchmove", onTouchMove);
document.body.addEventListener("touchstart", onTouchStart);
document.body.addEventListener("touchend", onTouchEnd);

document.body.addEventListener("keyup", onDocumentKeyUp, false);

document.body.addEventListener("touchend", (e) => {
    previousTouch = null;
});

function onTouchStart(e){
    const intersects = getClickedObjects(e);
    if(intersects[0]){
        if(clickedCubelet1 == null){
            clickedCubelet1 = intersects[0];
        }
    }
}

function onTouchEnd(e){
    secondStickerMouseUpCallback(e);
}

function onTouchMove(e) {
    if (e.type == 'touchmove') {
        const touch = e.touches[0];
        var intersects = getClickedObjects(e);

        if (previousTouch && intersects.length == 0) {
            // be aware that these only store the movement of the first touch in the touches array
            e.movementX = touch.pageX - previousTouch.pageX;
            e.movementY = touch.pageY - previousTouch.pageY;

            cube.rotation.y += e.movementX * 0.005;
            cube.rotation.x += e.movementY * 0.005;
        };

        previousTouch = touch;
    }
}

var turnDir = 1;
var isCtrlPressed = 0;

function onDocumentKeyDown(event) {
    var code = (event.keyCode);
    
    if(code == 17){
        isCtrlPressed = true;
    }

    if (code >= 37 && code <= 40 && !animation && !scrambleAnimation) {
        sideToRotate = keyToFace[code];
        turnAnimation(sideToRotate)();
    }
}

function onDocumentKeyUp(event) {
    var code = (event.keyCode);
    if(code == 17){
        isCtrlPressed = false;
    }
}

function onMouseMove(event) {
    secondStickerMouseUpCallback(event);
    if(mouseDown) {
        cube.rotation.y += event.movementX * 0.005;
        cube.rotation.x += event.movementY * 0.005;
    }
}

createCube(n);

var animation = false;
var scrambleAnimation = false;
var scrambleIdx = 0;

const sides = ['U', 'D', 'F', 'B', 'L', 'R'];

function scramble(){
    if(!animation && !scrambleAnimation){
        scrambleAnimation = true;
        sideToRotate = chooseRandomSide();
    }
}   

function chooseRandomSide(){
    return sides[THREE.MathUtils.randInt(0, sides.length-1)];
}

var angle = 0;

var gui = new lil.GUI();

const myObject = {
    Scramble : scramble,
    U : turnAnimation('U'), 
    D : turnAnimation('D'),
    F : turnAnimation('F'), 
    B : turnAnimation('B'),
    L : turnAnimation('L'), 
    R : turnAnimation('R'),
    'Create 5x5 cube' : createNewCubeGui(5),
    'Create 7x7 cube' : createNewCubeGui(7)
};

function createNewCubeGui(n){
    // console.log();
    return function(){
        // scene.remove(cube);
        createCube(n);
    } 
}
function turnAnimation(side){
    return function(){
        if(!animation && !scrambleAnimation){
            if(isCtrlPressed){
                turnDir = -1;
            }
            sideToRotate = getClosestAxis(side);
            animation = true;
        }
    }
}

gui.add( myObject, 'Scramble' ); // Button
gui.add( myObject, 'U' ); // Button
gui.add( myObject, 'D' ); // Button
gui.add( myObject, 'F' ); // Button
gui.add( myObject, 'B' ); // Button
gui.add( myObject, 'L' ); // Button
gui.add( myObject, 'R' ); // Button
gui.add( myObject, 'Create 7x7 cube'); // Button
gui.add( myObject, 'Create 5x5 cube'); // Button
// gui.add( myObject, 'Create 3x3 cube'); // Button

var rotationFrame = 0;
const rotationDuration = 25;

var scrambleFrame = 0;
const scrambleDuration = 10;

const d_angle = -Math.PI/(2 * rotationDuration);
const d_angle_scramble = -Math.PI/ (2 * scrambleDuration);

var oldTime = 0;
var clock = new THREE.Clock();
var angle = 0;

function animate( t ) {
    delta = clock.getDelta();

    if(animation){
        if(rotationFrame < rotationDuration){
            rotateSide(sideToRotate, d_angle * turnDir, rotationAxis);
            rotationFrame++;    
        }
        else{
            turnDir = 1;
            rotationFrame = 0;
            animation = false;
            rotationAxis = null;

        }
    }
    else if(scrambleAnimation){
        if(scrambleFrame < scrambleDuration){
            rotateSide(sideToRotate, d_angle_scramble);
            scrambleFrame++;
        }
        else{
            scrambleFrame = 0;
            scrambleIdx++;
            sideToRotate = chooseRandomSide();
        }

        if(scrambleIdx == 30){
            scrambleAnimation = false;
            scrambleIdx = 0;
        }
    }
                
}