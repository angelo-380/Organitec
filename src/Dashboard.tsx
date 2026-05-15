import { useMemo, useState } from 'react';
import { Clock, BookOpen, CheckCircle, AlertTriangle, Calendar, X, Edit3, Trash2, Star } from 'lucide-react';

// --- ESTRUCTURA DE DATOS ---
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

interface DashboardData {
  pending: number;
  completed: number;
  urgent: (Task & { hoursLeft: number })[];
  overdue: Task[];                     
  tasksByCourse: Record<string, Task[]>; 
}

const mockTasks: Task[] = [
  {
    "id_canvas": "1",
    "title": "Proyecto Final: React Dashboard",
    "course_name": "Ingeniería de Software",
    "due_at": "2026-05-10T23:59:59Z", // Tarea atrasada (HU-05)
    "points_possible": 20,
    "dificultad": "alta", 
    "importancia": 5,
    "completada": false
  },
  {
    "id_canvas": "2",
    "title": "Control de Lectura 3",
    "course_name": "Ingeniería de Software",
    "due_at": "2026-05-16T23:59:59Z", // Tarea urgente (HU-10)
    "points_possible": 10,
    "dificultad": "media", 
    "importancia": 4,
    "completada": false
  }
];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState<'todas' | 'pendientes'>('todas'); // HU-04
  
  // --- ESTADOS DEL FORMULARIO ---
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDiff, setNewDiff] = useState<'baja' | 'media' | 'alta'>('media');
  const [newImp, setNewImp] = useState(3);

  // --- LÓGICA DE PROCESAMIENTO (Cerebro del Sistema) ---
  const data = useMemo<DashboardData>(() => {
    const now = new Date();
    let pendingCount = 0;
    let completedCount = 0;
    const urgentTasks: (Task & { hoursLeft: number })[] = [];
    const overdueTasks: Task[] = [];
    const groups: Record<string, Task[]> = {};

    tasks.forEach(task => {
      task.completada ? completedCount++ : pendingCount++;

      // Agrupación por cursos (HU-04)
      if (!groups[task.course_name]) groups[task.course_name] = [];
      groups[task.course_name].push(task);

      const dueDate = new Date(task.due_at);
      const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (!task.completada) {
        if (hoursDiff < 0) overdueTasks.push(task); // HU-05
        else if (hoursDiff <= 48) urgentTasks.push({ ...task, hoursLeft: hoursDiff }); // HU-10
      }
    });

    // Ordenar por importancia (HU-07) y luego por tiempo (HU-08)
    urgentTasks.sort((a, b) => b.importancia - a.importancia || a.hoursLeft - b.hoursLeft);
    
    return { pending: pendingCount, completed: completedCount, urgent: urgentTasks, overdue: overdueTasks, tasksByCourse: groups };
  }, [tasks]);

  // --- FUNCIONES MANEJADORAS ---
  const openEdit = (task: Task) => {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewCourse(task.course_name);
    setNewDate(new Date(task.due_at).toISOString().slice(0, 16));
    setNewDiff(task.dificultad);
    setNewImp(task.importancia);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
    setNewTitle(''); setNewCourse(''); setNewDate('');
    setNewDiff('media'); setNewImp(3);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const taskData = {
      title: newTitle,
      course_name: newCourse,
      due_at: new Date(newDate).toISOString(),
      dificultad: newDiff,
      importancia: newImp,
    };

    if (editingTask) {
      setTasks(tasks.map(t => t.id_canvas === editingTask.id_canvas ? { ...t, ...taskData } : t));
    } else {
      setTasks([...tasks, { ...taskData, id_canvas: Date.now().toString(), points_possible: 10, completada: false }]);
    }
    closeForm();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hola, Estudiante 👋</h1>
            <p className="text-slate-500 mt-1">Gestiona tus tareas y prioriza tu estudio.</p>
          </div>
          <button onClick={() => setIsFormOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-all active:scale-95 shadow-sm w-full sm:w-auto">
            + Nueva Tarea
          </button>
        </header>

        {/* HU-05: VISUALIZACIÓN DE TAREAS ATRASADAS */}
        {data.overdue.length > 0 && (
          <section className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-rose-700 font-bold flex items-center gap-2 mb-4 text-sm">
              <AlertTriangle size={18} /> TAREAS VENCIDAS (HU-05)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.overdue.map(t => (
                <div key={t.id_canvas} className="bg-white border border-rose-100 p-3 rounded-xl flex justify-between items-center shadow-xs">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t.title}</p>
                    <p className="text-xs text-slate-400">{t.course_name}</p>
                  </div>
                  <button onClick={() => setTasks(tasks.map(x => x.id_canvas === t.id_canvas ? {...x, completada: true} : x))} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg">
                    <CheckCircle size={20} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STATS DASHBOARD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 col-span-1 md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-indigo-500" /> Carga Académica Semanal
            </h2>
            <div className="flex justify-around items-center mb-6">
              <div className="text-center">
                <span className="block text-4xl font-bold text-slate-800">{data.pending}</span>
                <span className="text-sm font-medium text-slate-500">Pendientes</span>
              </div>
              <div className="w-px h-12 bg-slate-200"></div>
              <div className="text-center">
                <span className="block text-4xl font-bold text-emerald-600">{data.completed}</span>
                <span className="text-sm font-medium text-slate-500">Completadas</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(data.completed / ((data.pending + data.completed) || 1)) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-xl shadow-md p-6 text-white flex flex-col justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-5 h-5" /> Plan Sugerido (HU-09)</h2>
            <p className="text-xs text-indigo-100 leading-relaxed">
              Basado en tus prioridades, deberías empezar con:<br/>
              <strong className="text-white text-sm underline">{data.urgent[0]?.title || 'Sin tareas urgentes'}</strong>
            </p>
            <button className="mt-4 bg-white text-indigo-600 w-full py-2.5 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-sm text-xs">
              Ver Plan Diario (HU-11)
            </button>
          </div>
        </div>

        {/* HU-10: TAREAS URGENTES */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Prioridad Inmediata
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.urgent.map(task => (
              <div key={task.id_canvas} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative group hover:border-slate-300 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.importancia >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    Prioridad {task.importancia}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(task)} className="text-slate-400 hover:text-indigo-600"><Edit3 size={16}/></button>
                    <button onClick={() => setTasks(tasks.filter(t => t.id_canvas !== task.id_canvas))} className="text-slate-400 hover:text-rose-500"><Trash2 size={16}/></button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{task.title}</h3>
                <p className="text-xs text-slate-500 mb-5">{task.course_name}</p>
                <div className="flex items-center justify-between text-xs mt-auto">
                  <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                    <Clock className="w-4 h-4" />
                    Vence en {Math.ceil(task.hoursLeft)}h
                  </div>
                  <button onClick={() => setTasks(tasks.map(t => t.id_canvas === task.id_canvas ? {...t, completada: true} : t))} className="text-indigo-600 hover:text-indigo-700 font-bold">Completar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HU-04: ORGANIZACIÓN POR CURSOS */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">📚 Mis Cursos</h2>
            <div className="flex gap-2">
              <button onClick={() => setFilter('todas')} className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all ${filter === 'todas' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>TODAS</button>
              <button onClick={() => setFilter('pendientes')} className={`text-[10px] px-3 py-1 rounded-full font-bold transition-all ${filter === 'pendientes' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>PENDIENTES</button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(data.tasksByCourse).map(([course, courseTasks]) => (
              <div key={course} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-indigo-600 text-sm uppercase tracking-wider">{course}</h3>
                  <span className="text-[10px] font-bold text-slate-400">{courseTasks.length} Tareas</span>
                </div>
                <div className="space-y-2">
                  {courseTasks.filter(t => filter === 'todas' || (filter === 'pendientes' && !t.completada)).map(t => (
                    <div key={t.id_canvas} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${t.completada ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span className={`text-sm ${t.completada ? 'line-through text-slate-300' : 'text-slate-600 font-medium'}`}>{t.title}</span>
                      </div>
                      <button onClick={() => openEdit(t)} className="opacity-0 group-hover:opacity-100 text-slate-400"><Edit3 size={14}/></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MODAL DEL FORMULARIO COMPLETO (HU-01, HU-02, HU-03, HU-06, HU-07) */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-200">
              <button onClick={closeForm} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">
                {editingTask ? 'Editar Tarea' : 'Nueva Tarea Académica'}
              </h2>
              
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Título de la Tarea</label>
                  <input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} type="text" placeholder="Ej: Proyecto Final" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Nombre del Curso</label>
                  <input required value={newCourse} onChange={(e) => setNewCourse(e.target.value)} type="text" placeholder="Ej: Ingeniería de Software" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Fecha y Hora de Entrega</label>
                  <input required value={newDate} onChange={(e) => setNewDate(e.target.value)} type="datetime-local" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Dificultad (HU-06)</label>
                    <select value={newDiff} onChange={(e) => setNewDiff(e.target.value as any)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Importancia (1-5)</label>
                    <input required type="number" min="1" max="5" value={newImp} onChange={(e) => setNewImp(Number(e.target.value))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98] mt-2">
                  {editingTask ? 'Actualizar Información' : 'Registrar Tarea'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}