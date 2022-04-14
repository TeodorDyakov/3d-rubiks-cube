vaxInit();
            
camera.position.set(30,20,30); // Set position like this
camera.lookAt(new THREE.Vector3(0,0,0)); // Set look at coordinate like this

var n = 3;
var half = Math.floor(n/2);
var cubeletSz = 5 * 3 / n;
var gapSz = 0.6 / n;
var stickerSz = 4.8 * 3 / n;
var cubelets = [];
var cube = new THREE.Group();
var stickerGeometry = new THREE.PlaneGeometry(stickerSz, stickerSz);
var sideToRotate;
var previousTouch;
var turnDir = -1;
var isCtrlPressed = 0;
var clickedCubelet1 = null, clickedCubelet2 = null;

function createCube(n){
    scene.clear();
    cube = new THREE.Group();
    cubelets = [];
    half = Math.floor(n/2);
    cubeletSz = 5 * 3 / n;
    gapSz = 0.2 * 3 / n;
    stickerSz = 4.8 * 3 / n;
    scene.add(cube);
 
    animation = false;
    scrambleAnimation = false;
    scrambleFrame = 0;
    scrambleIdx = 0;
    
    var boxSideGeometry = new THREE.BoxGeometry(cubeletSz, cubeletSz, cubeletSz);
    var boxSideMaterial = new THREE.MeshBasicMaterial({color:'black'});

    stickerGeometry = new THREE.PlaneGeometry(stickerSz, stickerSz);
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

        const pos = cubeletSz/2 + 0.02;
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
    return v.round();
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

function closestAxis(vec){
    var closest;
    var maxDot = -100;
    const axis = [
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 1)
    ];
    
    for(const a of axis){
        var dot = a.dot(vec);
        if(dot > maxDot){
            maxDot = dot;
            closest = a;
        }
    }
    return closest;
}
//this function returns -1 if the user has chosen two cubelets that form invalid rotation, or
//if the users has selected two stickers of same cubelet
function getSideByTwoStickers(sticker1, sticker2){
    if(!sticker1 || !sticker2){
        return -1;
    }
    if(!sticker1.object.isSticker || !sticker2.object.isSticker){
        return -1;
    }
    
    //check if two stickers are on same side
    
    const normal = getNormalVectorOfSticker(sticker1.object);
    const normal2 = getNormalVectorOfSticker(sticker2.object);
    
    if(!normal2.equals(normal)){
        return -1;
    }

    const point1 = sticker1.point;
    const point2 = sticker2.point;
    
    const mat = cube.matrix.clone().invert();
    
    point1.applyMatrix4(mat);
    point2.applyMatrix4(mat);

    const swipeVector = point2.sub(point1);
    
    const direction = closestAxis(swipeVector);

    //direction is invalid if it has more than coordinate that is not (almost)zero
    const nonZeroIdx = indexesOfNotZero(direction);

    if(nonZeroIdx.length > 1){
        return -1;
    }

    rotationAxis = normal.clone().cross(direction);
    
    const axis = indexesOfNotZero(rotationAxis)[0];
    
    const val = sticker1.object.parent.position.toArray()[axis];
    return getSideByCoord(axis, val);
}

const sideToAxes = {
    'F': new THREE.Vector3(0, 0, 1),
    'B': new THREE.Vector3(0, 0, -1),
    'L': new THREE.Vector3(-1, 0, 0),
    'R': new THREE.Vector3(1, 0, 0),
    'U': new THREE.Vector3(0, 1, 0),
    'D': new THREE.Vector3(0, -1, 0),
}

function getClosestAxis(side){
    var m = new THREE.Matrix4();
    m.extractRotation(camera.matrix);
    var axis = sideToAxes[side].clone();
    axis.applyMatrix4(m);
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

function getClickLength(click1, click2){
    return click2.point.clone().sub(click1.point).length();
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
        v.applyAxisAngle(axis,  turnDir * angle);
        el.position.set(v.x, v.y, v.z);
        el.rotateOnWorldAxis(axis, turnDir * angle);
    }
}

const controls = new THREE.OrbitControls( camera, renderer.domElement );

var canvas = renderer.domElement;

controls.enabled = true;


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
    } else if (e.type == 'mousedown' || e.type == 'mouseup' || e.type == 'mousemove') {
        x = e.clientX;
        y = e.clientY;
    }
    pointer.x = ( x / window.innerWidth ) * 2 - 1;
	pointer.y = - (y / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( pointer, camera );

    const intersects = raycaster.intersectObjects( scene.children );
    if(intersects[0]){
        return intersects[0];
    }
    return null;
}

function doMove(){ 
    if(!animation && !scrambleAnimation){
        sideToRotate = getSideByTwoStickers(clickedCubelet1, clickedCubelet2);
        if(sideToRotate != -1){
            turnDir = 1;
            rotationAxis = rotationAxis.normalize();
            animation = true;
        }
    }   
    clickedCubelet2 = null;
    clickedCubelet1 = null;
}

function onMouseDown(e) {
    clickedCubelet1 = getClickedObjects(e);

    if(!clickedCubelet1){
        controls.enabled = true;
    }else{
        controls.enabled = false;
    }
}

function onTouchMove(e) {
    if(clickedCubelet1){
        clickedCubelet2 = getClickedObjects(e);
        if(clickedCubelet2 && clickedCubelet2.object.isSticker && 
            getClickLength(clickedCubelet1, clickedCubelet2) > 3/n){
            doMove();
        } 
    }
    if(e.type == "touchmove"){
        const touch = e.touches[0];
        previousTouch = touch;
    }
}

function onTouchEnd(){
    controls.enabled = true;
    clickedCubelet1 = null;
    clickedCubelet2 = null;
    previousTouch = null;
}



const keyToFace = {
    37 : 'L',
    38 : 'U',
    39 : 'R',
    40 : 'D'
}

document.body.addEventListener("touchstart", onMouseDown);
document.body.addEventListener("mousedown", onMouseDown);

document.body.addEventListener("touchmove", onTouchMove);
document.body.addEventListener('mousemove', onTouchMove);

document.body.addEventListener("touchend", onTouchEnd);
document.body.addEventListener("mouseup", onTouchEnd);

document.body.addEventListener("keyup", onDocumentKeyUp, false);
document.body.addEventListener("keydown", onDocumentKeyDown, false);

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
    '3x3' : createNewCubeGui(3),
    '5x5' : createNewCubeGui(5),
    '7x7' : createNewCubeGui(7)
};

function createNewCubeGui(n){
    return function(){
        createCube(n);
    } 
}
function turnAnimation(side){
    return function(){
        if(!animation && !scrambleAnimation){
            if(isCtrlPressed){
                turnDir = 1;
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
gui.add( myObject, '3x3'); // Button
gui.add( myObject, '5x5'); // Button
gui.add( myObject, '7x7'); // Button

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
    var d_angle = delta * 5;

    controls.update();

    if(animation){
        if(angle + d_angle < Math.PI/2){
            rotateSide(sideToRotate, d_angle, rotationAxis);
            angle += d_angle;
        }

        else{
            rotateSide(sideToRotate, Math.PI/2 - angle, rotationAxis);
            animation = false;
            turnDir = -1;
            angle = 0;
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