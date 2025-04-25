import React from "react";
import { useWorld } from "./WorldContext";

export default function ControlPanel() {
    const { timeState, setTimeState, handleSpawn, selectedRobot, sendCommand, temporalRecord, setSnapshot, setPauseTime, pauseTime} = useWorld();
    
    const handleMove = (command) => {
        if (pauseTime) return; // Don't send commands if time is paused
        if (selectedRobot) {
            sendCommand(selectedRobot.id, `${command}`);
        }
    };

    const handleAction = (action) => {
        if (pauseTime) return; // Don't send commands if time is paused
        if (selectedRobot) {
            sendCommand(selectedRobot.id, action);
        }
    };

    const handleTimeChange = (newTimeState) => {
        if (!pauseTime){
            alert("Time is not paused. Please pause time to change the state.");
            return;
        }
        setTimeState(newTimeState);
        
        const snapshot = temporalRecord[newTimeState];
        if (snapshot) {
            setSnapshot(snapshot);
        }
        console.log("Time state changed to:", newTimeState);
        console.log("Snapshot for this time state:", snapshot);
    }

    const unsetTimeState = () => {
        if (pauseTime) setPauseTime(false);

        confirm("Are you sure you want to resume time? Resuming time at an intermediate timestamp will wipe all future events.") && setPauseTime(true);
        // truncate the temporal record to the current time state
        const newTemporalRecord = temporalRecord.slice(0, timeState + 1);
        setTemporalRecord(newTemporalRecord);
        console.log("Temporal record truncated to:", newTemporalRecord);

    }

    return (
        <div className="row-span-1 col-span-1 bg-gray-100 p-4 rounded-xl shadow-xl flex flex-col justify-between h-full">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold mb-2">Control Panel</h2>
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => handleSpawn("robot")}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded"
                    >
                        Spawn Robot
                    </button>
                    <button
                        onClick={() => handleSpawn("box")}
                        className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                    >
                        Spawn Box
                    </button>
                    <button
                        onClick={() => handleSpawn("shelf")}
                        className="text-xs px-2 py-1 bg-green-500 text-white rounded"
                    >
                        Spawn Shelf
                    </button>
                    <button
                        onClick={() => console.log("Temporal Log:", temporalRecord)}
                        className="text-xs px-2 py-1 bg-yellow-500 text-white rounded"
                    >
                        Read Temporal Log
                    </button>
                </div>

                <div className="mt-4">
                    <p className="text-sm font-medium">Select Time State: {timeState}</p>
                    <input
                        type="range"
                        min={0}
                        max={temporalRecord.length - 1}
                        step={1}
                        value={timeState}
                        onChange={(e) => handleTimeChange(e.target.value)}
                        className="w-full"
                    />
                    <button
                        onClick={() => unsetTimeState()}
                        className="mt-2 text-xs px-2 py-1 bg-purple-500 text-white rounded"
                    >
                        {pauseTime ? "Resume" : "Pause"} Time
                    </button>
                </div>
            </div>

            {/* Robot Control Section */}
            <div className="mt-6">
                <p className="text-sm font-semibold text-center mb-2">
                    Now Controlling: {selectedRobot?.name ?? "None"}
                </p>

                <div className="flex justify-center items-center gap-6">
                    {/* D-Pad */}
                    <div className="grid grid-cols-3 grid-rows-3 gap-1">
                        <div></div>
                        <button onClick={() => handleMove('forward')} className="w-6 h-6 bg-gray-300 rounded">↑</button>
                        <div></div>
                        <button onClick={() => handleMove('rotate_left')} className="w-6 h-6 bg-gray-300 rounded">←</button>
                        <div className="w-6 h-6"></div>
                        <button onClick={() => handleMove('rotate_right')} className="w-6 h-6 bg-gray-300 rounded">→</button>
                        <div></div>
                        <button onClick={() => handleMove('backward')} className="w-6 h-6 bg-gray-300 rounded">↓</button>
                        <div></div>
                    </div>

                    {/* A/B Buttons */}
                    <div className="flex flex-col items-center gap-2">
                        <button onClick={() => handleAction('grab')} className="w-6 h-6 bg-purple-400 rounded-full text-white text-xs">A</button>
                        <button onClick={() => handleAction('place')} className="w-6 h-6 bg-orange-400 rounded-full text-white text-xs">B</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
