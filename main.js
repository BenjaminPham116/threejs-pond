import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import noiseLibrary from './shaders/libraries/noiseLibrary.glsl';
import vertexShader from './shaders/vertex.glsl'
import floatShader from './shaders/floatVert.glsl'
import fragShader from './shaders/frag.glsl'
import flowerShader from './shaders/flowerFrag.glsl'
import lilyShader from './shaders/lilyFrag.glsl'
import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass";
import {Vector3} from "three";

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
    uTexture: {value: textureLoader.load('/textures/FlowerPetal.jpg')}
};


// FBX Loader with Basic Material
const gltfLoader = new GLTFLoader();
gltfLoader.load(
    '/models/Water.glb', // Replace with your FBX file path
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
        '/models/Flower.glb', // Replace with your FBX file path
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


function createLilyPad(position, scale, rotation){
    gltfLoader.load(
        '/models/LilyPad.glb', // Replace with your FBX file path
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


createFlower(new Vector3(3.2,0,-1.6), .7, 0);
createFlower(new Vector3(4.2, 0,-1.2), .8, 100);
createFlower(new Vector3(3.9,0,-1.8), 1., 0);
createLilyPad(new Vector3(0,0,0), 1., 0);

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
    
    t += clock.getDelta();
    waterUniform.uTime.value = t;
    flowerUniform.uTime.value = t;
}

animate();
