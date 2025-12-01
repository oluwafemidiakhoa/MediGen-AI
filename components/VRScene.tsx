import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface VRSceneProps {
  videoUrl: string;
  onClose: () => void;
}

export const VRScene: React.FC<VRSceneProps> = ({ videoUrl, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [isPresenting, setIsPresenting] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101010); // Dark background

    // 2. Setup Camera
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 0; // User is at center

    // 3. Setup Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true; // Enable WebXR
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Create Video Texture
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.loop = true;
    video.muted = true; // Video must be muted to autoplay in some contexts, but let's try
    video.play();

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;

    // 5. Create Curved Screen Geometry
    const geometry = new THREE.CylinderGeometry(5, 5, 4.5, 32, 1, true, -Math.PI / 4, Math.PI / 2);
    // Invert geometry so we see it from inside (or flip texture)
    geometry.scale(-1, 1, 1); 
    
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const screen = new THREE.Mesh(geometry, material);
    screen.position.set(0, 0, -6); // Place screen in front of user
    screen.rotation.y = -Math.PI / 2; // Rotate to face user if needed, cylinder defaults are weird
    // Adjust rotation for Cylinder to face camera properly
    screen.rotation.y = Math.PI; 
    
    scene.add(screen);

    // 6. Add Grid Floor for context
    const gridHelper = new THREE.GridHelper(20, 20, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // 7. Render Loop
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // Handle Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.setAnimationLoop(null);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      video.pause();
      video.src = '';
      renderer.dispose();
    };
  }, [videoUrl]);

  const enterVR = async () => {
    if (!rendererRef.current) return;
    try {
      // Check if XR is supported
      if ('xr' in navigator) {
         // This is a manual simplified "Enter VR" flow
         // In a real app we'd use renderer.xr.setSession(session)
         // But Three.js abstracts this if we use their VRButton.
         // Since we don't have VRButton imported, we use the raw API or a mock for this demo.
         const session = await (navigator as any).xr.requestSession('immersive-vr', {
             optionalFeatures: ['local-floor', 'bounded-floor']
         });
         rendererRef.current.xr.setSession(session);
         setIsPresenting(true);
         
         session.addEventListener('end', () => {
           setIsPresenting(false);
         });
      } else {
        alert("WebXR not supported on this device/browser.");
      }
    } catch (e) {
      console.error("Failed to enter VR:", e);
      alert("Could not enter VR mode. Ensure you are on a compatible device (Quest, Cardboard, Mobile).");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div ref={containerRef} className="absolute inset-0" />
      
      {/* VR UI Overlay */}
      {!isPresenting && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
          <button 
            onClick={enterVR}
            className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-400 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Enter VR Mode
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase"
          >
            Exit
          </button>
        </div>
      )}
      
      <div className="absolute top-6 left-6 pointer-events-none">
         <h2 className="text-cyan-400 font-tech text-xl">VR Immersive View</h2>
         <p className="text-slate-500 text-xs">WebGL Renderer Active</p>
      </div>
    </div>
  );
};
