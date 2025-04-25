import React from "react";
import { useWorld } from "./WorldContext";

export default function ControlPanel() {
    const { timeState, setTimeState, handleSpawn, selectedRobot, sendCommand } = useWorld();

    const handleMove = (direction) => {
        if (selectedRobot) {
            sendCommand(selectedRobot.id, `move_${direction}`);
        }
    };

    const handleAction = (action) => {
        if (selectedRobot) {
            sendCommand(selectedRobot.id, action);
        }
    };

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
                </div>

                <div className="mt-4">
                    <p className="text-sm font-medium">Select Time State: {timeState}</p>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={timeState}
                        onChange={(e) => setTimeState(Number(e.target.value))}
                        className="w-full"
                    />
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
                        <button onClick={() => handleMove('up')} className="w-6 h-6 bg-gray-300 rounded">↑</button>
                        <div></div>
                        <button onClick={() => handleMove('left')} className="w-6 h-6 bg-gray-300 rounded">←</button>
                        <div className="w-6 h-6"></div>
                        <button onClick={() => handleMove('right')} className="w-6 h-6 bg-gray-300 rounded">→</button>
                        <div></div>
                        <button onClick={() => handleMove('down')} className="w-6 h-6 bg-gray-300 rounded">↓</button>
                        <div></div>
                    </div>

                    {/* A/B Buttons */}
                    <div className="flex flex-col items-center gap-2">
                        <button onClick={() => handleAction('action_a')} className="w-6 h-6 bg-purple-400 rounded-full text-white text-xs">A</button>
                        <button onClick={() => handleAction('action_b')} className="w-6 h-6 bg-orange-400 rounded-full text-white text-xs">B</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
