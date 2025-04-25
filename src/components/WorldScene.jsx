import React, { useState, createContext, useContext, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import * as THREE from 'three';
import { useWorld } from "./WorldContext";
import Robot from "./Robot";


function DraggableCube({ position, color, size = [1, 1, 1] }) {
    const meshRef = useRef();
    
    const heightOffset = size[1] / 2;
    const initialPosition = [position[0], position[1] + heightOffset, position[2]];

    const [localPosition, setLocalPosition] = useState(initialPosition);
    const { camera, mouse, raycaster } = useThree();
    const { altPressed } = useWorld();
    const [dragging, setDragging] = useState(false);



    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -heightOffset);
    const intersection = new THREE.Vector3();

    const [justDragged, setJustDragged] = useState(false);

    useFrame(() => {
        if (dragging) {
            raycaster.setFromCamera(mouse, camera);
            raycaster.ray.intersectPlane(plane, intersection);
            setLocalPosition([intersection.x, heightOffset, intersection.z]);
        }
    });

    const snapToGrid = (value, gridSize = 1) => {
        return Math.round(value / gridSize) * gridSize;
    };

    const handlePointerUp = (e) => {
        e.stopPropagation();
        setJustDragged(true);
        setDragging(false);
    };

    useEffect(() => {
        if (justDragged) {
            const snappedX = snapToGrid(localPosition[0]);
            const snappedZ = snapToGrid(localPosition[2]);
            setLocalPosition([snappedX, heightOffset, snappedZ]);
            setJustDragged(false);
        }
    }, [justDragged]);

    return (
        <mesh
            ref={meshRef}
            position={localPosition}
            onPointerDown={(e) => {
                e.stopPropagation();
                if (!altPressed) setDragging(true);
            }}
            onPointerUp={handlePointerUp}
            onPointerMissed={() => setDragging(false)}
        >
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
}

function Box({ position }) {
    return <DraggableCube position={position} color="red" size={[0.6, 0.6, 0.6]}/>;
}

function Shelf({ position }) {
    return <DraggableCube position={position} color="green" size={[1, 1, 0.5]} />;
}

function CheckerFloor({ size = 20 }) {
    const tiles = [];
    for (let x = -size; x < size; x++) {
        for (let z = -size; z < size; z++) {
            const isDark = (x + z) % 2 === 0;
            tiles.push(
                <mesh key={`${x}-${z}`} position={[x, 0, z]} receiveShadow>
                    <boxGeometry args={[1, 0.1, 1]} />
                    <meshStandardMaterial color={isDark ? '#777' : '#ccc'} />
                </mesh>
            );
        }
    }
    return <>{tiles}</>;
}

function OrbitControls() {
    const { altPressed } = useWorld();
    const controlsRef = useRef();
    useFrame(() => {
        if (controlsRef.current) {
            controlsRef.current.enabled = altPressed;
        }
    });
    return <DreiOrbitControls ref={controlsRef} />;
}

export default function WorldScene() {
    const { spawnCommand } = useWorld();
    const [objects, setObjects] = useState([]);

    const usedPositions = new Set(objects.map((obj) => JSON.stringify(obj.position)));

    const getNextAvailablePosition = () => {
        for (let x = -5; x <= 5; x++) {
            for (let z = -5; z <= 5; z++) {
                const pos = [x * 2, 0, z * 2];
                if (!usedPositions.has(JSON.stringify(pos))) return pos;
            }
        }
        return null;
    };

    useEffect(() => {
        if (!spawnCommand) return;

        const pos = getNextAvailablePosition();
        if (!pos) return;

        setObjects((prev) => [...prev, { type: spawnCommand.type, position: pos }]);
    }, [spawnCommand]);

    return (
        <>
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} />
            <CheckerFloor size={10} />
            <OrbitControls />
            {objects.map((obj, idx) => {
                const key = `${obj.type}-${idx}`;
                if (obj.type === "robot") return <Robot key={key} position={obj.position} />;
                if (obj.type === "box") return <Box key={key} position={obj.position} />;
                if (obj.type === "shelf") return <Shelf key={key} position={obj.position} />;
                return null;
            })}
        </>
    );
}
