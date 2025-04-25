import React from "react";
import { useState, createContext, useContext, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

// Context for world control actions
const WorldContext = createContext();

export function useWorld() {
    return useContext(WorldContext);
}

export default function WorldProvider({ children }) {
    const [spawnCommand, setSpawnCommand] = useState(null);
    const [timeState, setTimeState] = useState(0);
    const [temporalRecord, setTemporalRecord] = useState([]); // Store temporal records
    const [altPressed, setAltPressed] = useState(false);
    const [selectedRobot, setSelectedRobot] = useState(null); // Track selected robot
    const [pauseTime, setPauseTime] = useState(false); // Pause time state

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey) setAltPressed(true);
        };
        const handleKeyUp = (e) => {
            if (!e.altKey) setAltPressed(false);
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    const handleSpawn = (type) => {
        if (pauseTime) return; // Don't send commands if time is paused
        setSpawnCommand({ type, id: uuidv4() });
    };

    const robotCommandHandlers = useRef({});

    const sendCommand = (robotId, command) => {
        robotCommandHandlers.current[robotId]?.(command);
    };

    const registerRobotCommandHandler = (robotId, callback) => {
        robotCommandHandlers.current[robotId] = callback;
        return () => delete robotCommandHandlers.current[robotId];
    };

    const [worldObjects, setWorldObjects] = useState([]); // e.g., [{ id, type, position }]

    const updateObjectPosition = (id, newPos, newRotation = [0,0,0], hasBox = false) => {

        setWorldObjects(prev =>
            prev.map(obj =>
                obj.id === id ? { ...obj, position: newPos, hasBox: hasBox, rotation: newRotation } : obj
            )
        );

        // takeSnapshot(); // Take a snapshot after updating position
    };

    const takeSnapshot = () => {
        const snapshot = worldObjects.map(obj => ({
            id: obj.id,
            type: obj.type,
            position: obj.position,
            hasBox: obj.hasBox,
            rotation: obj.rotation,
            color: obj.color,
            object: obj.object, // Include the object reference if needed
        }));
        setTemporalRecord([...temporalRecord, snapshot]);
        console.log("Snapshot taken:", snapshot);
        setTimeState(temporalRecord.length); // Update time state to the new snapshot index
    };

    const setSnapshot = (snapshot) => {
        setWorldObjects(snapshot.map(obj => ({
            id: obj.id,
            type: obj.type,
            position: obj.position,
            hasBox: obj.hasBox,
            rotation: obj.rotation,
            color: obj.color,
            object: obj.object, // Include the object reference if needed
        })));
    };


    const value = {
        spawnCommand,
        timeState,
        setTimeState,
        handleSpawn,
        altPressed,
        selectedRobot,
        setSelectedRobot,
        sendCommand,
        registerRobotCommandHandler,
        updateObjectPosition,
        worldObjects,
        setWorldObjects,
        takeSnapshot,
        temporalRecord,
        setSnapshot,
        pauseTime,
        setPauseTime,
    };

    return (
        <WorldContext.Provider value={value}>
            {children}
        </WorldContext.Provider>
    );
}
