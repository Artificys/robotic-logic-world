import React, { useState, useEffect, useRef, useMemo, use } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from 'three';
import { useWorld } from "./WorldContext";


const sharedRoundedShape = (() => {
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
})();

const sharedExtrudeSettings = {
    depth: 0.2,
    bevelEnabled: false,
};


export default function Robot({ position, rotation, id, color, object }) {
    const meshRef = useRef();
    const heightOffset = 0.05;
    const initialPosition = [position[0], position[1] + heightOffset, position[2]];

    const [localPosition, setLocalPosition] = useState(initialPosition);
    const [localRotation, setLocalRotation] = useState(rotation[1]);
    const [commandQueue, setCommandQueue] = useState([]);
    const [isMoving, setIsMoving] = useState(false);
    const { registerRobotCommandHandler, setSelectedRobot, altPressed, worldObjects, updateObjectPosition, setWorldObjects } = useWorld();

    const [grabbedObject, setGrabbedObject] = useState(object || null);

    useEffect(() => {
        setLocalPosition([
            position[0],
            position[1] + heightOffset,
            position[2]
        ]);
    }, []);

    useEffect(() => {
        if (object) {
            setGrabbedObject(object);
        } else {
            setGrabbedObject(null);
        }
    }, [object]);

    useEffect(() => {
        setLocalPosition([
            position[0],
            position[1],
            position[2]
        ]);
    }, [position]);

    useEffect(() => {
        setLocalRotation(rotation[1]);
    }, [rotation]);

    const occupied = useMemo(() => {
        return new Set(
            worldObjects
                .filter(obj => obj.id !== id) // exclude self
                .map(obj => `${obj.position[0]},${obj.position[2]}`)
        );
    }, [worldObjects, id]);

    useEffect(() => {
        const unsubscribe = registerRobotCommandHandler(id, (command) => {
            setCommandQueue((prev) => [...prev, command]);
        });
        return unsubscribe;
    }, [id, registerRobotCommandHandler]);

    useFrame(() => {
        if (!isMoving && commandQueue.length > 0) {
            const nextCommand = commandQueue[0];
            let [x, y, z] = localPosition;
            let newRotation = localRotation;
            let newPos = [x, y, z];

            const dx = Math.sin(localRotation);
            const dz = Math.cos(localRotation);

            switch (nextCommand) {
                case "rotate_left":
                    newRotation += Math.PI / 2;
                    break;
                case "rotate_right":
                    newRotation -= Math.PI / 2;
                    break;
                case "forward":
                    newPos = [
                        Math.round(x + dx),
                        y,
                        Math.round(z + dz)
                    ];
                    break;
                case "backward":
                    newPos = [
                        Math.round(x - dx),
                        y,
                        Math.round(z - dz)
                    ];
                    break;

                case "grab":
                    if (grabbedObject) {
                        console.log("Already holding an object:", grabbedObject);
                        setCommandQueue(q => q.slice(1));
                        return;
                    }

                    const frontPos = [
                        Math.round(x + dx),
                        y,
                        Math.round(z + dz)
                    ];

                    const objectToGrab = worldObjects.find(obj =>
                        obj.position[0] === frontPos[0] &&
                        obj.position[2] === frontPos[2] &&
                        obj.type === "box"
                    );

                    if (objectToGrab) {
                        console.log("Grabbing object:", objectToGrab);
                        setGrabbedObject(objectToGrab);
                        // Remove the grabbed object from world objects
                        setWorldObjects(prev => prev.filter(obj => obj.id !== objectToGrab.id));
                    }

                    setCommandQueue(q => q.slice(1));
                    return; // ✅ important!

                case "place":
                    if (!grabbedObject) {
                        console.log("No object to place.");
                        setCommandQueue(q => q.slice(1));
                        break;
                    }

                    const placePos = [
                        Math.round(x + dx),
                        y,
                        Math.round(z + dz)
                    ];

                    // Check if the position is valid for placement
                    if (placePos[0] < -10 || placePos[0] > 9 || placePos[2] < -10 || placePos[2] > 9) {
                        console.log("Out of bounds, cannot place.");
                        setCommandQueue(q => q.slice(1));
                        break;
                    }

                    // Check if there's a shelf at the target position
                    const shelfAtPosition = worldObjects.find(obj =>
                        obj.position[0] === placePos[0] &&
                        obj.position[2] === placePos[2] &&
                        obj.type === "shelf"
                    );

                    // Check if there's any other object at the target position
                    const otherObjectAtPosition = worldObjects.find(obj =>
                        obj.position[0] === placePos[0] &&
                        obj.position[2] === placePos[2] &&
                        obj.type !== "shelf"
                    );


                    if (otherObjectAtPosition) {
                        console.log("Position occupied, cannot place object.");
                    } else if (shelfAtPosition) {
                        const elevatedPosition = [placePos[0], placePos[1] + 0.4, placePos[2]]; // Adjust height for shelf

                        console.log("Placing object on shelf:", grabbedObject);
                        setWorldObjects(prev => prev.map(obj => {
                            if (obj.id === shelfAtPosition.id) {
                                // Update shelf to indicate it has a box
                                return { ...obj, hasBox: true };
                            }
                            return obj;
                        }).concat({
                            ...grabbedObject,
                            position: elevatedPosition
                        }));
                        setGrabbedObject(null);
                    } else {

                        console.log("Placing object on ground:", grabbedObject);
                        setWorldObjects(prev => [...prev, { ...grabbedObject, position: placePos }]);
                        setGrabbedObject(null);
                    }
                    setCommandQueue(q => q.slice(1));
                    return; // ✅ prevents falling through to movement logic
            }

            // Check if position is within board boundaries
            if (newPos[0] < -10 || newPos[0] > 9 || newPos[2] < -10 || newPos[2] > 9) {
                console.log("Out of bounds, cannot move.");
                setCommandQueue(q => q.slice(1));
                return;
            }

            const key = `${newPos[0]},${newPos[2]}`;
            if (occupied.has(key)) {
                // console.log("Blocked: ", worldObjects);
                setCommandQueue(q => q.slice(1));
                return;
            }

            const hasBox = grabbedObject ? true : false; // Check if the robot has a box

            setIsMoving(true);
            setLocalRotation(newRotation);
            setLocalPosition(newPos);
            updateObjectPosition(id, newPos, [0, newRotation, 0], hasBox);
            setCommandQueue((q) => q.slice(1));

            setTimeout(() => {
                setIsMoving(false);
            }, 200);
        }
    });

    const handleClick = (e) => {
        e.stopPropagation();
        if (!altPressed) {
            console.log(`Selected Robot: ${id} at ${localPosition}`);
            setSelectedRobot({ id, name: `Robot ${color}` });
        }
    };

    useEffect(() => {
        setWorldObjects((prev) =>
            prev.map((obj) => {
                if (obj.id === id) {
                    return { ...obj, object: grabbedObject };
                }
                return obj;
            }
        ));
    }, [grabbedObject]);


    return (
        <mesh
            ref={meshRef}
            position={localPosition}
            rotation={[0, localRotation, 0]}
            onClick={handleClick}
        >
            <group>
                {/* Body */}
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[0.7, 1, 0.5]} />
                    <meshStandardMaterial color={color} />
                </mesh>

                {/* Head */}
                <mesh position={[0, 1.2, 0]}>
                    <boxGeometry args={[0.5, 0.4, 0.5]} />
                    <meshStandardMaterial color="lightblue" />
                </mesh>

                {/* Arms */}
                {!grabbedObject && (
                    <>
                        <mesh position={[-0.4, 0.7, 0]} rotation={[-Math.PI / 3, 0, 0]}>
                            <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
                            <meshStandardMaterial color="gray" />
                        </mesh>

                        <mesh position={[0.4, 0.7, 0]} rotation={[-Math.PI / 3, 0, 0]}>
                            <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
                            <meshStandardMaterial color="gray" />
                        </mesh>
                    </>
                )}

                {/* Arms while grabbed */}
                {grabbedObject && (
                    <>
                        <mesh position={[-0.4, 1.2, 0]} rotation={[0, 0, -Math.PI / 20]}>
                            <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
                            <meshStandardMaterial color="gray" />
                        </mesh>

                        <mesh position={[0.4, 1.2, 0]} rotation={[0, 0, Math.PI / 20]}>
                            <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
                            <meshStandardMaterial color="gray" />
                        </mesh>

                        {/* Grabbed Box */}
                        <mesh position={[0, 1.75, 0]}>
                            <boxGeometry args={[0.5, 0.5, 0.5]} />
                            <meshStandardMaterial color={grabbedObject?.color || "brown"} />
                        </mesh>
                    </>
                )}

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
                <mesh position={[-0.5, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <extrudeGeometry args={[sharedRoundedShape, sharedExtrudeSettings]} />
                    <meshStandardMaterial color="black" />
                </mesh>

                {/* Right Track */}
                <mesh position={[0.3, 0.15, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <extrudeGeometry args={[sharedRoundedShape, sharedExtrudeSettings]} />
                    <meshStandardMaterial color="black" />
                </mesh>
            </group>
        </mesh>
    );
}