import React from "react";
import { useState, createContext, useContext, useEffect } from "react";

// Context for world control actions
const WorldContext = createContext();

export function useWorld() {
    return useContext(WorldContext);
}

export default function WorldProvider({ children }) {
    const [spawnCommand, setSpawnCommand] = useState(null);
    const [timeState, setTimeState] = useState(0);
    const [altPressed, setAltPressed] = useState(false);
    const [selectedRobot, setSelectedRobot] = useState(null); // Track selected robot

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
        setSpawnCommand({ type, timestamp: Date.now() });
    };

    const sendCommand = (robotId, command) => {
        console.log(`Sending ${command} to robot ${robotId}`);
        // You can replace this with actual state changes or pub/sub later
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
      };

    return (
        <WorldContext.Provider value={value}>
            {children}
        </WorldContext.Provider>
    );
}
