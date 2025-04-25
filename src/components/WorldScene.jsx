import React, { useState, createContext, useContext, useEffect, useRef, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls as DreiOrbitControls } from "@react-three/drei";
import * as THREE from 'three';
import { useLoader } from "@react-three/fiber";
import { useWorld } from "./WorldContext";
import Robot from "./Robot";
import { FLOOR_SIZE } from "../config";


const COLORS = [
    "blue", // Blue
    "red", // Red
    "green", // Green
    "orange", // Orange
    "purple", // Purple
    "yellow", // Yellow
    "cyan", // Cyan
    "brown", // Brown
    "pink"  // Pink
];

function DraggableCube({ id, type, position, size = [1, 1, 1], children }) {
    const meshRef = useRef();

    const heightOffset = size[1] / 2;
    const initialPosition = [position[0], position[1] + heightOffset, position[2]];

    const [localPosition, setLocalPosition] = useState(initialPosition);
    const { camera, mouse, raycaster } = useThree();
    const { altPressed } = useWorld();
    const [dragging, setDragging] = useState(false);
    const { updateObjectPosition, worldObjects } = useWorld();


    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -heightOffset);
    const intersection = new THREE.Vector3();

    const [justDragged, setJustDragged] = useState(false);

    useEffect(() => {
        setLocalPosition([
            position[0],
            position[1] + heightOffset,
            position[2]
        ]);
    }, []);

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

    const isStacking = (position) => {
        // Check to see if the position argument is coinciding with a shelf or box position
        return worldObjects.some(obj => {
            if (obj.id === id) return false; // Ignore the current object
            return ((type === "box" && obj.type === "shelf") || (type === "shelf" && obj.type === "box")) &&
                obj.position[0] === position[0] && obj.position[2] === position[2];
        });
    }

    useEffect(() => {
        if (justDragged) {
            const snappedX = snapToGrid(localPosition[0]);
            const snappedZ = snapToGrid(localPosition[2]);
            const isStacked = isStacking([snappedX, 0, snappedZ]);
            if (isStacked && type === "box") {
                // If the box is stacked on a shelf, set the shelf to have a box
                console.log("Box stacked on shelf at", snappedX, snappedZ);
                const shelf = worldObjects.find(obj => obj.type === "shelf" && obj.position[0] === snappedX && obj.position[2] === snappedZ);
                if (shelf) {
                    updateObjectPosition(shelf.id, shelf.position, true); // Set the shelf to have a box
                }

                setLocalPosition([snappedX, heightOffset + 0.5, snappedZ]);
                updateObjectPosition(id, [snappedX, heightOffset + 0.5, snappedZ], isStacked && type === "shelf");
            } else if (isStacked && type === "shelf") {
                // If the shelf is stacked on a box, the box needs to be updated to be above the shelf, and the shelf should be at 0
                console.log("Shelf stacked on box at", snappedX, snappedZ);
                const box = worldObjects.find(obj => obj.type === "box" && obj.position[0] === snappedX && obj.position[2] === snappedZ);
                if (box) {
                    updateObjectPosition(box.id, [snappedX, 0.8, snappedZ], false); // Set the box to be above the shelf
                }
                setLocalPosition([snappedX, heightOffset, snappedZ]);
                updateObjectPosition(id, [snappedX, heightOffset, snappedZ], true);

            } else {
                // If the object is not stacked, just update its position
                setLocalPosition([snappedX, heightOffset, snappedZ]);
                updateObjectPosition(id, [snappedX, heightOffset, snappedZ], false);
            }

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
            {/* <boxGeometry args={size} />
            <meshStandardMaterial color={color} /> */}
            {children}
        </mesh>
    );
}

function Box({ id, position, color }) {
    const size = [0.6, 0.6, 0.6];

    return (
        <DraggableCube id={id} type="box" position={position} size={size}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} />
        </DraggableCube>
    );
}

function Shelf({ id, position }) {
    return <DraggableCube id={id} type="shelf" position={position} color="green" size={[1, 0.5, 0.5]}>
        <group>
            {/* Table top */}
            <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[1, 0.1, 1]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>

            {/* Table legs */}
            <mesh position={[-0.4, 0, -0.4]}>
                <boxGeometry args={[0.1, 0.5, 0.1]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0.4, 0, -0.4]}>
                <boxGeometry args={[0.1, 0.5, 0.1]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[-0.4, 0, 0.4]}>
                <boxGeometry args={[0.1, 0.5, 0.1]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
            <mesh position={[0.4, 0, 0.4]}>
                <boxGeometry args={[0.1, 0.5, 0.1]} />
                <meshStandardMaterial color="#8B4513" />
            </mesh>
        </group>
    </DraggableCube>
}

function CheckerFloor() {
    const texture = useLoader(THREE.TextureLoader, '/checker.png');

    // Repeat the texture across the plane
    useMemo(() => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(2, 2); // Adjust the repeat value as needed
        texture.needsUpdate = true; // Ensure the texture is updated
    }, [texture]);

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, 0, -0.5]}>
            <planeGeometry args={[FLOOR_SIZE + 1, FLOOR_SIZE + 1]} color="blue" />
            <meshStandardMaterial map={texture} transparent={true} opacity={0.5} />
        </mesh>
    );
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
    const { spawnCommand, setWorldObjects, worldObjects, takeSnapshot, pauseTime } = useWorld();
    const [counter, setCounter] = useState(0);

    // console.log("WorldScene render", spawnCommand, worldObjects);

    const usedPositions = new Set(worldObjects.map((obj) => JSON.stringify(obj.position)));

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

        // console.log(`Spawning ${spawnCommand.type} at ${pos}`);

        setCounter(prev => prev + 1);

        setWorldObjects(prev => [...prev, {
            id: spawnCommand.id,
            type: spawnCommand.type,
            position: pos,
            hasBox: false,
            rotation: [0, 0, 0],
            color: COLORS[counter % COLORS.length]
        }]);
    }, [spawnCommand]);

    useEffect(() => {
        if (pauseTime) return; // Don't take a snapshot if time is paused
        //short delay for any laggy inputs
        const timeout = setTimeout(() => {
            if (worldObjects.length > 0) {
                takeSnapshot();
            }
        }, 100);
        return () => clearTimeout(timeout);

    }, [worldObjects]);

    return (
        <>
            <ambientLight intensity={1.5} />
            <pointLight position={[10, 10, 10]} />
            <CheckerFloor size={10} />
            <OrbitControls />
            {worldObjects.map((obj, idx) => {
                const key = `${obj.type}-${idx}`;
                if (obj.type === "robot") {
                    return <Robot key={key} position={obj.position} id={obj.id} color={COLORS[idx % COLORS.length]} object={obj.object} rotation={obj.rotation} />;
                }
                if (obj.type === "box") {
                    return <Box key={key} position={obj.position} id={obj.id} color={obj.color} />;
                }
                if (obj.type === "shelf") {
                    return <Shelf key={key} position={obj.position} id={obj.id} color={obj.color} />;
                }
                return null;
            })}
        </>
    );
}
