vaxInit();
            
const cubeletSz = 5;
camera.position.set(0,0,50); // Set position like this
camera.lookAt(new THREE.Vector3(0,0,0)); // Set look at coordinate like this

var cubelets = [];
var cube = new THREE.Group();

var stickerGeometry = new THREE.PlaneGeometry(4.5, 4.5);

function createCube(){
    var boxSideGeometry = new THREE.BoxGeometry(cubeletSz, cubeletSz, cubeletSz);
    var boxSideMaterial = new THREE.MeshBasicMaterial({
        color: 'black',
        shininess: 50
    });

    var cubelet = new THREE.Mesh(boxSideGeometry, boxSideMaterial);

    for(let i = -1; i < 2; i++){
        for(let j = -1; j < 2; j++){
            for(let k = -1; k < 2; k++){
                var newCubelet = cubelet.clone();
                cubelets.push(newCubelet);
                newCubelet.position.set(i * (cubeletSz + 0.5), j * (cubeletSz + 0.5), k * (cubeletSz + 0.5));
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

//local
function getSide(side){
    var group = [];

    for(let i = 0; i < cubelets.length; i++){
        var obj = cubelets[i];

        if(side == 'F'){    
            if(Math.abs(obj.position.z - 5.5) < 0.1){
                group.push(cubelets[i]);
            }
        }else if(side == 'B'){
            if(Math.abs(-obj.position.z - 5.5) < 0.1){
                group.push(cubelets[i]);
            }
        }else if(side == 'L'){
            if(Math.abs(-obj.position.x - 5.5) < 0.1){
                group.push(cubelets[i]);    
            }
        }else if(side == 'R'){
            if(Math.abs(obj.position.x - 5.5) < 0.1){
                group.push(cubelets[i]);
            }
        } else if(side == 'U'){
            if(Math.abs(obj.position.y - 5.5) < 0.1){
                group.push(cubelets[i]);
            }
        } else if(side == 'D'){
            if(Math.abs(-obj.position.y - 5.5) < 0.1){
                group.push(cubelets[i]);
            }
        }
    }
    return group;
}

function placeStickersOnSide(face){
    const faceColors = {'F' : 'red', 'L': 'white', 'U' : 'blue', 'R' : 'yellow', 'B' : 'orange', 'D' : 'green'};
    
    var side = getSide(face);
    var sticker = new THREE.Mesh(stickerGeometry, new THREE.MeshBasicMaterial({color:faceColors[face]}));
    
    for(const s of side){
        var st = sticker.clone();
    
        if(face == 'F'){
            st.position.set(0, 0, 2.6);
        }else if(face == 'L'){
            st.rotation.set(0, -Math.PI/2, 0);
            st.position.set(-2.6, 0, 0);
        }else if(face == 'R'){
            st.rotation.set(0, Math.PI/2, 0);
            st.position.set(2.6, 0, 0);
        }else if(face == 'B'){
            st.rotation.set(-Math.PI, 0, 0);
            st.position.set(0, 0, -2.6);
        }else if(face == 'U'){
            st.rotation.set(-Math.PI/2, 0, 0);
            st.position.set(0, 2.6, 0);
        }else if(face == 'D'){
            st.rotation.set(Math.PI/2, 0, 0);
            st.position.set(0, -2.6, 0);
        }
        s.add(st);
    }    
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
    var axis = sideToAxes[side];
    var basisX = new THREE.Vector3(0, 0, 0); //maps to 
    var basisY = new THREE.Vector3(0, 0, 0);
    var basisZ = new THREE.Vector3(0, 0, 0);

    var matrix = cube.matrix;
    matrix.extractBasis(basisX, basisY, basisZ);
    var basisX_n = basisX.clone().negate();
    var basisY_n = basisY.clone().negate();
    var basisZ_n = basisZ.clone().negate();
    
    const sideToBases = {
        'F': basisZ,
        'B': basisZ_n,
        'L': basisX_n,
        'R': basisX,
        'U': basisY,
        'D': basisY_n,
    }

    var smallestAngle = Math.PI;
    var closestAxis = null;
    for(const side in sideToBases){
        var basis = sideToBases[side];
        var angle = Math.abs(basis.angleTo(axis));
        
        if(angle < smallestAngle){
            smallestAngle = angle;
            closestAxis = side;
        }
    }
    return closestAxis;
}

function rotateSide(side, angle){
    var s = getClosestAxis(side);
    var local = getSide(s);

    for(const el of local){
        const v = new THREE.Vector3(el.position.x, el.position.y, el.position.z);
        var axis = sideToAxes[s];
        v.applyAxisAngle(axis, angle);
        el.position.set(v.x, v.y, v.z);
        el.rotateOnWorldAxis(axis, angle);
    }
}

var canvas = renderer.domElement;
canvas.addEventListener('mousemove', onMouseMove);
var mouseDown = false;

document.body.onmousedown = function() { 
    mouseDown = true;
}

document.body.onmouseup = function() {
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

document.body.addEventListener("touchend", (e) => {
    previousTouch = null;
});

function onTouchMove(e) {
    if (e.type == 'touchmove') {
        const touch = e.touches[0];
        if (previousTouch) {
            // be aware that these only store the movement of the first touch in the touches array
            e.movementX = touch.pageX - previousTouch.pageX;
            e.movementY = touch.pageY - previousTouch.pageY;

            cube.rotation.y += e.movementX * 0.005;
            cube.rotation.x += e.movementY * 0.005;
        };

        previousTouch = touch;
    }
}

function onDocumentKeyDown(event) {
    var code = (event.keyCode);
    if (code >= 37 && code <= 40 && !animation && !mouseDown) {
        sideToRotate = keyToFace[code];
        animation = true;
    }
}

function onMouseMove(event) {
    if(mouseDown && !animation && !scrambleAnimation) {
        cube.rotation.y += event.movementX * 0.005;
        cube.rotation.x += event.movementY * 0.005;
    }
}

createCube();
scene.add(cube);
cube.rotateY(Math.PI/4);

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

const d_angle = -Math.PI/50;
const d_angle_scramble = -Math.PI/20;
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
};

function turnAnimation(side){
    return function(){
        if(!animation && !scrambleAnimation && !mouseDown){
            sideToRotate = side;
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

function animate( t ) {
    if(animation){
        if(angle + d_angle > -Math.PI/2){
            rotateSide(sideToRotate, d_angle);
            angle += d_angle;
        }
        else{
            rotateSide(sideToRotate, -Math.PI/2 - angle);
            animation = false;
            angle = 0;
        }
    }
    else if(scrambleAnimation){
        if(angle + d_angle > -Math.PI/2){
            rotateSide(sideToRotate, d_angle_scramble);
            angle += d_angle_scramble;
        }
        else{
            rotateSide(sideToRotate, -Math.PI/2 - angle);
            scrambleIdx++;
            sideToRotate = chooseRandomSide();
            angle = 0;
        }

        if(scrambleIdx == 30){
            scrambleAnimation = false;
            scrambleIdx = 0;
        }
    }
                
}