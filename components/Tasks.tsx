import React, { useState, useCallback } from 'react';

type Task = {
  id: string;
  text: string;
  completed: boolean;
  isEditing?: boolean;
};

interface TasksProps {
  onExit: () => void;
}

const Tasks: React.FC<TasksProps> = ({ onExit }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const addTask = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setTasks(prev => [
      ...prev,
      { id: crypto.randomUUID(), text: trimmed, completed: false }
    ]);
    setInput('');
  }, [input]);

  const toggleComplete = (id: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const startEditing = (id: string) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, isEditing: true } : { ...task, isEditing: false }));
  };

  const saveTask = (id: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed) return;
    setTasks(prev => prev.map(task => task.id === id ? { ...task, text: trimmed, isEditing: false } : task));
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const onDragStart = (id: string) => {
    setDraggedTaskId(id);
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const onDrop = (dropId: string) => {
    if (!draggedTaskId || draggedTaskId === dropId) return;
    setTasks(prev => {
      const fromIndex = prev.findIndex(task => task.id === draggedTaskId);
      const toIndex = prev.findIndex(task => task.id === dropId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDraggedTaskId(null);
  };

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <h2 className="text-white text-xl font-bold mb-4">Tasks</h2>
      <div className="flex gap-2 mb-5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a new task"
          className="flex-1 p-3 rounded-xl border border-white/20 bg-white/10 text-white outline-none"
        />
        <button onClick={addTask} className="px-4 rounded-xl bg-white/20 text-white hover:bg-white/30 transition">Add</button>
      </div>

      <div className="mb-5">
        <button onClick={onExit} className="w-full py-3 rounded-xl bg-orange-500/20 text-orange-100 border border-orange-300 hover:bg-orange-500/40 transition">
          Exit
        </button>
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            draggable
            onDragStart={() => onDragStart(task.id)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(task.id)}
            className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-black/30"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleComplete(task.id)}
              className="w-4 h-4"
            />
            {task.isEditing ? (
              <input
                autoFocus
                value={task.text}
                onChange={e => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, text: e.target.value } : t))}
                onBlur={() => saveTask(task.id, task.text)}
                onKeyDown={e => e.key === 'Enter' && saveTask(task.id, task.text)}
                className="flex-1 p-2 rounded-lg bg-white/10 border border-white/20 text-white outline-none"
              />
            ) : (
              <span onDoubleClick={() => startEditing(task.id)} className={`flex-1 cursor-move select-none ${task.completed ? 'line-through text-white/40' : 'text-white'}`}>
                {task.text}
              </span>
            )}
            <button onClick={() => startEditing(task.id)} className="px-2 py-1 text-[10px] border border-white/20 rounded-lg text-white/80">Edit</button>
            <button onClick={() => removeTask(task.id)} className="px-2 py-1 text-[10px] border border-red-400 rounded-lg text-red-300">Del</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;
