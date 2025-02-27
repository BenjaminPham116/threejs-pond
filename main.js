import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {FontLoader} from 'three/src/loaders/FontLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import noiseLibrary from './shaders/libraries/noiseLibrary.glsl';
import vertexShader from './shaders/vertex.glsl'
import floatShader from './shaders/floatVert.glsl'
import frogShader from './shaders/frogVert.glsl'
import fragShader from './shaders/frag.glsl'
import flowerShader from './shaders/flowerFrag.glsl'
import lilyShader from './shaders/lilyFrag.glsl'
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {TextGeometry, Vector3} from "three";

THREE.ShaderChunk['noiseLibrary'] = noiseLibrary;


//setup
//setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x182020);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 5, 12);
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
    antialias: true});
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
const textureLoader = new THREE.TextureLoader();

const clock = new THREE.Clock();
var t = 0;

// const depthComposer = new EffectComposer(renderer);
// depthComposer.addPass(new ShaderPass(scene, camera));

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting (if you switch to other materials)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// const axes = new THREE.AxesHelper();
// scene.add(axes);


const params = {
    format: THREE.DepthFormat,
    type: THREE.UnsignedShortType,
    samples: 0,
};
// Create render target with depth texture
const format = parseInt( params.format );
const type = parseInt( params.type );
const samples = parseInt( params.samples );

const dpr = renderer.getPixelRatio();
let renderTarget = new THREE.WebGLRenderTarget( window.innerWidth * dpr, window.innerHeight * dpr );
renderTarget.texture.minFilter = THREE.NearestFilter;
renderTarget.texture.magFilter = THREE.NearestFilter;
renderTarget.texture.generateMipmaps = false;
renderTarget.stencilBuffer = ( format === THREE.DepthStencilFormat ) ? true : false;
renderTarget.samples = samples;

renderTarget.depthTexture = new THREE.DepthTexture();
renderTarget.depthTexture.format = format;
renderTarget.depthTexture.type = type;

var waterUniform = {
    uTime: {value: 0.0},
    uDepth: {value: renderTarget.depthTexture},// Texture uniform (if any)
    uNear: {value: .1},// Texture uniform (if any)
    uFar: {value: 1000},// Texture uniform (if any)
    uCameraPos: {value: camera.position},
};

var flowerUniform = {
    uTime: {value: 0.0},
    uTexture: {value: textureLoader.load('./models/FlowerPetal.jpg')}
};

var frogUniform = {
    uTime: {value: 0.0},
    uTexture: {value: textureLoader.load('./models/Frog.jpg')},
    uniform: {value: THREE.UniformsLib['skinning']},
};

function createText(position, text, transparent, opacity, index){
    const fontLoader = new FontLoader();
    fontLoader.load(
        './models/droid_sans_mono_regular.typeface.json', 
        (droidFont) => {
            const textGeometry = new TextGeometry(text, {
                height: .2,
                size: 1,
                font: droidFont,
            });

            const textMaterial = new THREE.MeshPhongMaterial({
                transparent: transparent,
                opacity: opacity,
                depthWrite: false,
            });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            textMesh.position.set(position.x, position.y, position.z);
            textMap.set(index, textMesh);
            scene.add(textMesh);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
            console.error('An error occurred while loading the Font:', error);
        }
    );
}


// FBX Loader with Basic Material
const gltfLoader = new GLTFLoader();
gltfLoader.load(
    './models/Water.glb', // Replace with your FBX file path
    (gltf) => {
        const object = gltf.scene;
        // Apply MeshBasicMaterial to all meshes
        object.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragShader,
                    transparent: true,
                    uniforms: waterUniform,
                    depthWrite: false,
                });
            }
        });
        
        scene.add(object);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
        console.error('An error occurred while loading the FBX model:', error);
    }
);

function createFlower(position, scale, rotation){
    gltfLoader.load(
        './models/Flower.glb', // Replace with your FBX file path
        (gltf) => {
            const object = gltf.scene;

            // Apply MeshBasicMaterial to all meshes
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.ShaderMaterial({
                        vertexShader: floatShader,
                        fragmentShader: flowerShader,
                        uniforms: flowerUniform,
                    });
                }
            });
            object.position.set(position.x, position.y, position.z);
            object.scale.setScalar(scale);
            object.rotation.y = rotation;
            scene.add(object);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
            console.error('An error occurred while loading the FBX model:', error);
        }
    );
}


const padNames = ['LiliPad015','LiliPad019','LiliPad020'];
var curPad = padNames[1];
var lastPad = padNames[1];
var frogLerp = 0;
const padObjects = [];
const padMap = new Map();
const textMap = new Map();
function createLilyPad(position, scale, rotation){
    gltfLoader.load(
        './models/LilyPad.glb', // Replace with your FBX file path
        (gltf) => {
            const object = gltf.scene;

            // Apply MeshBasicMaterial to all meshes
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.ShaderMaterial({
                        vertexShader: floatShader,
                        fragmentShader: lilyShader,
                        uniforms: flowerUniform,
                    });
                }
            });
            object.position.set(position.x, position.y, position.z);
            object.scale.setScalar(scale);
            object.rotation.y = rotation;
            
            padObjects.push(object.getObjectByName(padNames[0]));
            padObjects.push(object.getObjectByName(padNames[1]));
            padObjects.push(object.getObjectByName(padNames[2]));

            padMap.set(padNames[0], object.getObjectByName(padNames[0]));
            padMap.set(padNames[1], object.getObjectByName(padNames[1]));
            padMap.set(padNames[2], object.getObjectByName(padNames[2]));
            
            scene.add(object);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
            console.error('An error occurred while loading the FBX model:', error);
        }
    );
}

const mixers = [];
var jumpAction;
var frogObject;
function createFrog(position, scale, rotation){
    gltfLoader.load(
        './models/Frog.glb', // Replace with your FBX file path
        (gltf) => {
            const object = gltf.scene;

            // Apply MeshBasicMaterial to all meshes
            object.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.ShaderMaterial({
                        vertexShader: frogShader,
                        fragmentShader: flowerShader,
                        uniforms: frogUniform,
                        skinning: true,
                    });
                }
            });
            frogObject = object;
            const padPos = padMap.get(curPad).position;
            object.position.set(padPos.x, padPos.y + .42, padPos.z);
            
            object.scale.setScalar(scale);
            object.rotation.y = rotation;
            const mixer = new THREE.AnimationMixer(object);
            const animations = gltf.animations;
            const anim = THREE.AnimationClip.findByName(animations, 'Jump');
            jumpAction = mixer.clipAction(anim);
            mixers.push(mixer);
            scene.add(object);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
            console.error('An error occurred while loading the FBX model:', error);
        }
    );
}

// Raycaster and mouse
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    // Convert mouse position to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    
}

window.addEventListener('mousemove', onMouseClick);


createFlower(new Vector3(3.2,0,-1.6), .7, 0);
createFlower(new Vector3(4.2, 0,-1.2), .8, 100);
createFlower(new Vector3(3.9,0,-1.8), 1., 0);
createLilyPad(new Vector3(0,0,0), 1., 0);
createFrog(new Vector3(0,.0,0.), .7, 0);
createText(new Vector3(-6.5, 3, 1.5),'Woah',true, 0.,  padNames[0])
createText(new Vector3(-.5, 3, -4), ':D',true, 0., padNames[1])
createText(new Vector3(5, 3, 2),'-_-', true, 0., padNames[2])

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    // First pass: render scene to custom render target to get depth
    controls.update();
    updateUniforms();
    
    waterUniform.uDepth.value = null;
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    
    //second pass
    waterUniform.uDepth.value = renderTarget.depthTexture;
    renderer.setRenderTarget(null);
    renderer.clear();

    // Then use composer for post-processing
    renderer.render(scene, camera);
}

function updateUniforms(){
    
    
    waterUniform.uCameraPos.value = camera.position;
    const delta = clock.getDelta();
    t += delta;
    for ( const mixer of mixers ){
        mixer.update( delta );
    } 
    waterUniform.uTime.value = t;
    flowerUniform.uTime.value = t;
    frogUniform.uTime.value = t;
    frogLerp += delta * 1.6;
    frogLerp = Math.min(frogLerp, 1);
    setFrogPos();
    ChangePad();
    floatText();
}

function setFrogPos(){
    if(!padMap.has(curPad) || !padMap.has(lastPad) || !frogObject) return;
   
    
    let posInterp = new THREE.Vector3(0,0,0);
    let posNext = padMap.get(curPad).position;
    let posCur = padMap.get(lastPad).position;
    posInterp.lerpVectors(posCur, posNext, frogLerp);
    frogObject.position.set(posInterp.x, posInterp.y + .42, posInterp.z);
    if(frogLerp < 1){
        let lookDir = new THREE.Vector3(0,0,0);
        lookDir = lookDir.subVectors(posNext, frogObject.position);
        lookDir.y = 0;
        frogObject.lookAt(lookDir.add(frogObject.position));
    }
    else
        frogObject.rotation.set(0,0,0);
}

function ChangePad(){
    if(!padMap.has(curPad) || !padMap.has(lastPad) || !frogObject || t < 2) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(padObjects, true);
    if (intersects.length > 0) {
        let padName = intersects[0].object.name;
        if(frogLerp >= 1 && intersects[0].object.name !== curPad){
            frogLerp = 0;
            lastPad = curPad;
            curPad = intersects[0].object.name;
            jumpAction.reset();
            jumpAction.setLoop( THREE.LoopOnce );
            jumpAction.play();
            console.log(textMap);

            
        }
    }
}

function floatText(){
    padNames.forEach(pad => {
        let curText = textMap.get(pad);
        if(curText){
            if(pad !== curPad){
                curText.material.opacity = THREE.MathUtils.lerp(curText.material.opacity, 0, frogLerp);
                curText.position.y = (THREE.MathUtils.lerp(3, 0, Math.pow(frogLerp,.2)));
            }
            else{
                curText.material.opacity = THREE.MathUtils.lerp(curText.material.opacity, 1, frogLerp);
                curText.position.y = (THREE.MathUtils.lerp(0, 3, Math.pow(frogLerp,.2)));
            }
        }
    })
}

function animateText(){
    
}

animate();
