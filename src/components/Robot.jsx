import React, { useState, useEffect, useRef, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import * as THREE from 'three';
import { useWorld } from "./WorldContext";

export default function Robot({ position }) {
    const meshRef = useRef();

    const size = [1, 1, 1]; // Size of the robot
    const color = "blue"; // Color of the robot
    const heightOffset = 0.05;//size[1] / 2;
    const initialPosition = [position[0], position[1] + heightOffset, position[2]];

    const [localPosition, setLocalPosition] = useState(initialPosition);
    const { camera, mouse, raycaster } = useThree();
    

    return (
        <mesh
            ref={meshRef}
            position={localPosition}
        >
            <group>
                {/* Body */}
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[0.7, 1, 0.5]} />
                    <meshStandardMaterial color="blue" />
                </mesh>

                {/* Head */}
                <mesh position={[0, 1.2, 0]}>
                    <boxGeometry args={[0.5, 0.4, 0.5]} />
                    <meshStandardMaterial color="lightblue" />
                </mesh>

                {/* Left Arm */}
                <mesh position={[-0.4, 0.7, 0]} rotation={[-Math.PI/3, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
                    <meshStandardMaterial color="gray" />
                </mesh>

                {/* Right Arm */}
                <mesh position={[0.4, 0.7, 0]} rotation={[-Math.PI/3, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
                    <meshStandardMaterial color="gray" />
                </mesh>

                {/* Left Eye */}
                <mesh position={[-0.15, 1.2, 0.25]}>
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshStandardMaterial color="black" />
                </mesh>

                {/* Right Eye */}
                <mesh position={[0.15, 1.2, 0.25]}>
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshStandardMaterial color="black" />
                </mesh>

                {/* Left Track */}
                <RoundedTrack position={[-0.5, 0.15, 0]} />

                {/* Right Track */}
                <RoundedTrack position={[0.3, 0.15, 0]} />
            </group>
        </mesh>
    );
}

function RoundedTrack({ position, color = 'black' }) {
    const shape = useMemo(() => {
        const width = 1;
        const height = 0.3;
        const radius = 0.15;

        const shape = new THREE.Shape();
        shape.absarc(-width / 2 + radius, -height / 2 + radius, radius, Math.PI, Math.PI / 2, true);
        shape.absarc(width / 2 - radius, -height / 2 + radius, radius, Math.PI / 2, 0, true);
        shape.absarc(width / 2 - radius, height / 2 - radius, radius, 0, -Math.PI / 2, true);
        shape.absarc(-width / 2 + radius, height / 2 - radius, radius, -Math.PI / 2, -Math.PI, true);
        shape.closePath();

        return shape;
    }, []);

    const extrudeSettings = useMemo(() => ({
        depth: 0.2,
        bevelEnabled: false,
    }), []);

    return (
        <mesh position={position} rotation={[0, Math.PI / 2, 0]}>
            <extrudeGeometry args={[shape, extrudeSettings]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
}