
var renderer, scene, camera, light, stats, t, animate;


function vaxInit()
{
	renderer = new THREE.WebGLRenderer( {antialias: true} );
	document.body.appendChild( renderer.domElement );
	document.body.style.margin = 0;
	document.body.style.overflow = 'hidden';
	
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xb3e6ff);

	camera = new THREE.PerspectiveCamera( 60, 1, 1, 1000 );
	camera.position.set(0,0,100);
	camera.lookAt(new THREE.Vector3(0,0,0));
	
	light = new THREE.PointLight();
	light.position.set(0,150,300);
	scene.add( light );
	
	window.addEventListener( 'resize', onWindowResize, false );
	onWindowResize();
	
	renderer.setAnimationLoop( frame );
}


function onWindowResize( event )
{
	camera.aspect = window.innerWidth/window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight, true );
}			


var oldTime = 0;
var accTime = 0;
function frame( time )
{
	// защита от прекалено голяма скорост, при по-бързи компютри някои анимации
	// ще са прекалено бързи, затова изкуствено се забавя до 60 fps
	accTime += time-oldTime;
	oldTime = time;
	if( accTime < 1000/60 ) return;
	accTime = 0;
	
	if( animate ) animate( time/1000 );
	
	renderer.render( scene, camera );
}

