import React from 'react';
import { Canvas } from '@react-three/fiber';
import WorldProvider from './WorldContext';
import ControlPanel from './ControlPanel';
import WorldScene from './WorldScene';

export default function RoboticsWorld() {
    return (
        <WorldProvider>
            <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 p-2 overflow-hidden">
                <ControlPanel />

                <div className="row-span-1 col-span-1 bg-black rounded-xl overflow-hidden">
                    <Canvas className="w-full h-full" shadows camera={{ position: [10, 10, 10], fov: 50 }}>
                        <WorldScene />
                    </Canvas>
                </div>

                <div className="col-span-1 row-span-2"></div>
            </div>
        </WorldProvider>
    );
}