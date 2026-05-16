import React, { useState, useEffect, useMemo } from 'react';
import { Clock, BookOpen, CheckCircle, AlertTriangle, Calendar, Trash2, Edit, Plus, X, Brain, Target } from 'lucide-react';

interface Task {
  id_canvas: string;
  title: string;
  course_name: string;
  due_at: string;
  points_possible: number;
  dificultad: 'baja' | 'media' | 'alta';
  importancia: number; 
  completada: boolean;
}

// Fechas dinámicas basadas en el momento actual para evitar bloqueos algorítmicos
const getMockTasks = (): Task[] => {
  const now = new Date();
  return [
    {
      id_canvas: "12345",
      title: "Proyecto Final de Programación",
      course_name: "Programación Orientada a Objetos",
      due_at: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Vence en 5 días
      points_possible: 20,
      dificultad: "alta", 
      importancia: 5,
      completada: false
    },
    {
      id_canvas: "12346",
      title: "Control de Lectura 3",
      course_name: "Ingeniería de Software",
      due_at: new Date(now.getTime() + 31 * 60 * 60 * 1000).toISOString(), // Vence en 31 horas
      points_possible: 10,
      dificultad: "media", 
      importancia: 4,
      completada: false
    },
    {
      id_canvas: "12348",
      title: "Ensayo sobre Ética",
      course_name: "Ética Profesional",
      due_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // Atrasada por 1 día
      points_possible: 10,
      dificultad: "baja", 
      importancia: 2,
      completada: false
    }
  ];
};

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem('organitec_tasks');
      if (savedTasks) {
        return JSON.parse(savedTasks);
      }
    } catch (error) {
      console.error("Error al leer el localStorage:", error);
    }
    return getMockTasks();
  });

  useEffect(() => {
    localStorage.setItem('organitec_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [filterCourse, setFilterCourse] = useState<string>('TODAS');

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id_canvas !== id));
  };

  const toggleComplete = (id: string) => {
    setTasks(prev => prev.map(t => t.id_canvas === id ? { ...t, completada: !t.completada } : t));
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Forzar formateo correcto a ISO string para evitar desfases de fechas
    const inputDate = formData.get('due_at') as string;
    const formattedDate = inputDate ? new Date(inputDate).toISOString() : new Date().toISOString();

    const newTask: Task = {
      id_canvas: editingTask ? editingTask.id_canvas : Date.now().toString(),
      title: formData.get('title') as string,
      course_name: formData.get('course_name') as string,
      due_at: formattedDate,
      points_possible: 20,
      dificultad: formData.get('dificultad') as 'baja' | 'media' | 'alta',
      importancia: Number(formData.get('importancia')),
      completada: editingTask ? editingTask.completada : false
    };

    if (editingTask) {
      setTasks(prev => prev.map(t => t.id_canvas === editingTask.id_canvas ? newTask : t));
    } else {
      setTasks(prev => [...prev, newTask]);
    }
    closeTaskModal();
  };

  // Cálculos reactivos de secciones
  const { pending, completed, urgent, overdue, courses } = useMemo(() => {
    const now = new Date();
    let pendingCount = 0;
    let completedCount = 0;
    const urgentTasksTemp: (Task & { hoursLeft: number })[] = [];
    const overdueTasksTemp: Task[] = [];
    const uniqueCourses = new Set<string>();

    tasks.forEach(task => {
      uniqueCourses.add(task.course_name);
      if (task.completada) {
        completedCount++;
      } else {
        pendingCount++;
        const dueDate = new Date(task.due_at);
        const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 0) {
          overdueTasksTemp.push(task);
        } else if (hoursDiff <= 48) {
          urgentTasksTemp.push({ ...task, hoursLeft: hoursDiff });
        }
      }
    });

    return { 
      pending: pendingCount, 
      completed: completedCount, 
      urgent: urgentTasksTemp.sort((a, b) => a.hoursLeft - b.hoursLeft), 
      overdue: overdueTasksTemp,
      courses: ['TODAS', ...Array.from(uniqueCourses)]
    };
  }, [tasks]);

  // Algoritmo HU-09 Ponderado corregido
  const suggestedTask = useMemo(() => {
    const pendingTasksList = tasks.filter(t => !t.completada);
    if (pendingTasksList.length === 0) return null;

    const now = new Date();
    const scoredTasks = pendingTasksList.map(t => {
      const diffMap = { alta: 3, media: 2, baja: 1 };
      const diffScore = diffMap[t.dificultad] || 1;
      const impScore = t.importancia;
      
      const dueDate = new Date(t.due_at);
      const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      let timeScore = 0;
      if (hoursDiff < 0) timeScore = 15; // Mayor peso si ya expiró
      else if (hoursDiff <= 24) timeScore = 10;
      else if (hoursDiff <= 48) timeScore = 5;

      return { ...t, score: diffScore + impScore + timeScore };
    });

    return [...scoredTasks].sort((a, b) => b.score - a.score)[0];
  }, [tasks]);

  // Bloques de estudio de la HU-11
  const studyBlocks = useMemo(() => {
    const tasksToPlan = [...overdue, ...urgent].slice(0, 4);
    if (tasksToPlan.length === 0 && suggestedTask) {
      tasksToPlan.push(suggestedTask);
    }
    return tasksToPlan.map(t => {
      let pomodoros = t.dificultad === 'alta' ? 4 : t.dificultad === 'media' ? 2 : 1;
      return { task: t, pomodoros, time: `${pomodoros * 30} min` };
    });
  }, [urgent, overdue, suggestedTask]);

  // Filtrado de la lista principal por curso
  const filteredTasks = useMemo(() => {
    if (filterCourse === 'TODAS') return tasks;
    return tasks.filter(t => t.course_name === filterCourse);
  }, [tasks, filterCourse]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-800 pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hola, Estudiante 👋</h1>
            <p className="text-slate-500 mt-1">Aquí tienes el resumen de tu estado académico hoy.</p>
          </div>
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Nueva Tarea
          </button>
        </header>

        {/* HU-09: Cuadro de Sugerencia */}
        {suggestedTask && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-start gap-4 shadow-sm">
            <div className="bg-indigo-100 p-2 rounded-full mt-1">
              <Brain className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-indigo-900">Basado en tus prioridades, deberías empezar con:</h3>
              <p className="text-indigo-700 text-lg font-bold mt-1 underline decoration-2">
                {suggestedTask.title}
              </p>
              <p className="text-xs text-indigo-500 mt-1">Curso: {suggestedTask.course_name} | Dificultad: {suggestedTask.dificultad}</p>
            </div>
          </div>
        )}

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center col-span-1 md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-indigo-500" /> Carga Académica Semanal
            </h2>
            <div className="flex justify-around items-center mb-6">
              <div className="text-center">
                <span className="block text-4xl font-bold text-slate-800">{pending}</span>
                <span className="text-sm font-medium text-slate-500">Pendientes</span>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                <span className="block text-4xl font-bold text-emerald-600">{completed}</span>
                <span className="text-sm font-medium text-slate-500">Completadas</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md p-6 text-white flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-indigo-100" /> Plan de Estudio (HU-11)
              </h2>
            </div>
            <button 
              onClick={() => setIsPlanModalOpen(true)}
              className="mt-6 bg-white text-indigo-600 w-full py-2.5 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
            >
              Ver Plan Diario (HU-11)
            </button>
          </div>
        </div>

        {/* Tarjetas Atrasadas */}
        {overdue.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-600" /> Tareas Atrasadas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overdue.map(task => (
                <div key={task.id_canvas} className="bg-rose-50 rounded-xl p-5 border border-rose-200 shadow-sm relative">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600"></div>
                  <h3 className="font-semibold text-rose-900 line-clamp-2">{task.title}</h3>
                  <p className="text-sm text-rose-700 mt-1">{task.course_name}</p>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-rose-200">
                    <button onClick={() => toggleComplete(task.id_canvas)} className="text-rose-700 hover:underline text-sm font-medium">
                      Completar
                    </button>
                    <button onClick={() => deleteTask(task.id_canvas)} className="text-rose-400 hover:text-rose-700">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tarjetas Urgentes */}
        {urgent.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-orange-500" /> Prioridad Inmediata
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgent.map(task => (
                <div key={task.id_canvas} className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm relative">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
                  <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded">
                    Vence en {Math.max(0, Math.ceil(task.hoursLeft))}h
                  </span>
                  <h3 className="font-semibold text-slate-800 mt-2 line-clamp-2">{task.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{task.course_name}</p>
                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                    <button onClick={() => toggleComplete(task.id_canvas)} className="text-indigo-600 hover:underline text-sm font-medium">
                      Completar
                    </button>
                    <button onClick={() => deleteTask(task.id_canvas)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabla General "Mis Cursos" con Filtros de la HU-04 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-500" /> Mis Cursos
            </h2>
            <div className="flex gap-2">
              {courses.map(c => (
                <button 
                  key={c} 
                  onClick={() => setFilterCourse(c)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${filterCourse === c ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
                  <th className="p-4 font-medium">Estado</th>
                  <th className="p-4 font-medium">Tarea</th>
                  <th className="p-4 font-medium">Curso</th>
                  <th className="p-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id_canvas} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="p-4">
                      <button onClick={() => toggleComplete(task.id_canvas)} className={task.completada ? 'text-emerald-500' : 'text-slate-300'}>
                        <CheckCircle className="w-6 h-6" />
                      </button>
                    </td>
                    <td className={`p-4 font-medium ${task.completada ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {task.title}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{task.course_name}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openEditModal(task)} className="text-slate-400 hover:text-indigo-600">
                          <Edit className="w-5 h-5" />
                        </button>
                        <button onClick={() => deleteTask(task.id_canvas)} className="text-slate-400 hover:text-rose-600">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Modal Formulario */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
              <button onClick={closeTaskModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título de la Tarea</label>
                <input required name="title" defaultValue={editingTask?.title} type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Curso</label>
                <input required name="course_name" defaultValue={editingTask?.course_name} type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Entrega</label>
                <input required name="due_at" defaultValue={editingTask ? new Date(editingTask.due_at).toISOString().slice(0,16) : ''} type="datetime-local" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dificultad</label>
                  <select name="dificultad" defaultValue={editingTask?.dificultad || 'media'} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Importancia (1-5)</label>
                  <input required name="importancia" defaultValue={editingTask?.importancia || 3} type="number" min="1" max="5" className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeTaskModal} className="px-4 py-2 text-slate-600 font-medium">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">Guardar Tarea</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Plan Diario */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="font-bold text-xl flex items-center gap-2"><Target className="w-6 h-6" /> Plan de Estudio Sugerido</h3>
                <p className="text-indigo-100 text-sm mt-1">Bloques generados basados en dificultad y urgencia (Técnica Pomodoro).</p>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {studyBlocks.map((block, idx) => (
                <div key={idx} className="flex items-center justify-between border border-slate-200 p-4 rounded-xl bg-slate-50">
                  <div>
                    <h4 className="font-semibold text-slate-800 line-clamp-1">{block.task.title}</h4>
                    <p className="text-sm text-slate-500">{block.task.course_name} • {block.pomodoros} Pomodoros</p>
                  </div>
                  <div className="bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg text-sm">
                    {block.time}
                  </div>
                </div>
              ))}
              <button onClick={() => setIsPlanModalOpen(false)} className="w-full mt-4 bg-slate-900 text-white py-3 rounded-lg font-medium">
                Entendido, empezaré ahora
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}