import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function TasksBoard() {
  const [activeView, setActiveView] = useState("team");

  const initialTeamColumns = {
    todo: { name: "To Do", items: [] },
    inprogress: { name: "In Progress", items: [] },
    review: { name: "Review", items: [] },
    done: { name: "Done", items: [] },
  };

  const initialPersonalColumns = {
    todo: { name: "To Do", items: [] },
    inprogress: { name: "In Progress", items: [] },
    done: { name: "Done", items: [] },
  };

  const [teamColumns, setTeamColumns] = useState(() => {
    const saved = localStorage.getItem("teamTasks");
    return saved ? JSON.parse(saved) : initialTeamColumns;
  });

  const [personalColumns, setPersonalColumns] = useState(() => {
    const saved = localStorage.getItem("personalTasks");
    return saved ? JSON.parse(saved) : initialPersonalColumns;
  });

  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    assignedTo: "",
  });

  useEffect(() => {
    localStorage.setItem("teamTasks", JSON.stringify(teamColumns));
  }, [teamColumns]);

  useEffect(() => {
    localStorage.setItem("personalTasks", JSON.stringify(personalColumns));
  }, [personalColumns]);

  const handleAddTask = () => {
    if (!taskData.title.trim()) return alert("Enter task title!");
    const newTask = { id: Date.now().toString(), ...taskData };
    if (activeView === "team") {
      setTeamColumns((prev) => ({
        ...prev,
        todo: { ...prev.todo, items: [...prev.todo.items, newTask] },
      }));
    } else {
      setPersonalColumns((prev) => ({
        ...prev,
        todo: { ...prev.todo, items: [...prev.todo.items, newTask] },
      }));
    }
    setTaskData({ title: "", description: "", assignedTo: "" });
  };

  const handleDeleteTask = (columnId, index) => {
    const columns = activeView === "team" ? { ...teamColumns } : { ...personalColumns };
    columns[columnId].items.splice(index, 1);
    if (activeView === "team") setTeamColumns(columns);
    else setPersonalColumns(columns);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const columns = activeView === "team" ? { ...teamColumns } : { ...personalColumns };
    const sourceCol = columns[source.droppableId];
    const destCol = columns[destination.droppableId];
    const [movedItem] = sourceCol.items.splice(source.index, 1);
    destCol.items.splice(destination.index, 0, movedItem);

    if (activeView === "team") setTeamColumns(columns);
    else setPersonalColumns(columns);
  };

  const currentColumns = activeView === "team" ? teamColumns : personalColumns;

  return (
    <div className="flex-1 flex flex-col w-full h-full bg-gray-900 p-4 overflow-hidden text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-400">
          {activeView === "team" ? "Team Tasks Board" : "My Personal Tasks Board"}
        </h1>
        <div className="space-x-2">
          <button
            onClick={() => setActiveView("team")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeView === "team"
                ? "bg-indigo-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            Team Tasks
          </button>
          <button
            onClick={() => setActiveView("personal")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeView === "personal"
                ? "bg-indigo-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            My Tasks
          </button>
        </div>
      </div>

      <div className="bg-gray-800 shadow-md p-4 rounded-lg mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <input
          type="text"
          placeholder="Task title..."
          value={taskData.title}
          onChange={(e) => setTaskData((prev) => ({ ...prev, title: e.target.value }))}
          className="border rounded-lg px-3 py-2 flex-1 bg-gray-700 text-gray-100 border-gray-600"
        />
        <input
          type="text"
          placeholder="Assigned to..."
          value={taskData.assignedTo}
          onChange={(e) => setTaskData((prev) => ({ ...prev, assignedTo: e.target.value }))}
          className="border rounded-lg px-3 py-2 flex-1 bg-gray-700 text-gray-100 border-gray-600"
        />
        <textarea
          placeholder="Description..."
          value={taskData.description}
          onChange={(e) => setTaskData((prev) => ({ ...prev, description: e.target.value }))}
          className="border rounded-lg px-3 py-2 flex-1 bg-gray-700 text-gray-100 border-gray-600"
        />
        <button
          onClick={handleAddTask}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Add Task
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 h-full">
            {Object.entries(currentColumns).map(([id, column]) => (
              <Droppable key={id} droppableId={id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="bg-gray-800 rounded-xl shadow p-4 flex flex-col h-full"
                  >
                    <h2 className="text-xl font-semibold text-indigo-300 mb-3">
                      {column.name}
                    </h2>
                    <div className="flex-1 overflow-y-auto">
                      {column.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided) => (
                            <div
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                              className="bg-gray-700 rounded-lg p-3 mb-3 shadow hover:bg-gray-600 transition cursor-pointer flex justify-between items-start"
                            >
                              <div>
                                <h3 className="font-semibold text-gray-100">{item.title}</h3>
                                {item.assignedTo && (
                                  <p className="text-sm text-gray-300">👤 {item.assignedTo}</p>
                                )}
                                {item.description && (
                                  <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteTask(id, index)}
                                className="text-red-400 hover:text-red-600 font-bold ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
