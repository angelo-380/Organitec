import { useMemo, useState } from 'react';
import { Clock, BookOpen, CheckCircle, AlertTriangle, Calendar, X } from 'lucide-react';

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
}

const mockTasks: Task[] = [
  {
    "id_canvas": "12345",
    "title": "Proyecto Final de Programación",
    "course_name": "Programación Orientada a Objetos",
    "due_at": "2026-05-20T23:59:59Z",
    "points_possible": 20,
    "dificultad": "alta", 
    "importancia": 5,
    "completada": false
  },
  {
    "id_canvas": "12346",
    "title": "Control de Lectura 3",
    "course_name": "Ingeniería de Software",
    "due_at": "2026-05-15T23:59:59Z",
    "points_possible": 10,
    "dificultad": "media", 
    "importancia": 4,
    "completada": false
  }
];

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  
  // Estados para el Formulario (HU-01 y HU-02)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCourse, setNewCourse] = useState('');
  const [newDate, setNewDate] = useState('');

  const toggleTaskCompletion = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id_canvas === id ? { ...task, completada: !task.completada } : task
    ));
  };

  // Función para Guardar Tarea (HU-01)
  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id_canvas: Date.now().toString(),
      title: newTitle,
      course_name: newCourse,
      due_at: new Date(newDate).toISOString(), // HU-02
      points_possible: 10,
      dificultad: 'media',
      importancia: 3,
      completada: false
    };

    setTasks([...tasks, newTask]);
    setIsFormOpen(false);
    setNewTitle(''); setNewCourse(''); setNewDate('');
  };

  const { pending, completed, urgent } = useMemo<DashboardData>(() => {
    const now = new Date();
    let pendingCount = 0;
    let completedCount = 0;
    const urgentTasks: (Task & { hoursLeft: number })[] = [];

    tasks.forEach(task => {
      if (task.completada) {
        completedCount++;
      } else {
        pendingCount++;
        const dueDate = new Date(task.due_at);
        const hoursDiff = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff <= 48 && hoursDiff > -24) {
          urgentTasks.push({ ...task, hoursLeft: hoursDiff });
        }
      }
    });

    urgentTasks.sort((a, b) => a.hoursLeft - b.hoursLeft);
    return { pending: pendingCount, completed: completedCount, urgent: urgentTasks };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Hola, Estudiante 👋</h1>
            <p className="text-slate-500 mt-1">Gestiona tus tareas y reduce el estrés.</p>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-all active:scale-95 shadow-sm w-full sm:w-auto"
          >
            + Nueva Tarea
          </button>
        </header>

        {/* MODAL DEL FORMULARIO (HU-01 y HU-02) */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
              <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Nueva Tarea Académica</h2>
              <form onSubmit={addTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                  <input required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Parcial de Redes" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Curso</label>
                  <input required value={newCourse} onChange={(e) => setNewCourse(e.target.value)} type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Ej: Telecomunicaciones" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de entrega</label>
                  <input required value={newDate} onChange={(e) => setNewDate(e.target.value)} type="datetime-local" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">Guardar Tarea</button>
              </form>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 col-span-1 md:col-span-2">
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
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${(completed / ((pending + completed) || 1)) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-xl shadow-md p-6 text-white flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-indigo-100" /> Plan de Estudio
              </h2>
              <p className="text-indigo-100 text-sm mt-2 leading-relaxed">
                {urgent.length > 0 ? `Tienes ${urgent.length} urgentes hoy.` : '¡Todo despejado!'}
              </p>
            </div>
            <button className="mt-6 bg-white text-indigo-600 w-full py-2.5 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-sm">Ver Plan Sugerido</button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500" /> Tareas Urgentes (Próximas 48h)
          </h2>
          {urgent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {urgent.map(task => (
                <div key={task.id_canvas} className="bg-white rounded-xl p-5 border border-rose-200 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md">
                      Quedan {Math.max(0, Math.ceil(task.hoursLeft))}h
                    </span>
                    <button onClick={() => toggleTaskCompletion(task.id_canvas)} className="text-slate-300 hover:text-emerald-500 transition-colors">
                      <CheckCircle className="w-6 h-6" />
                    </button>
                  </div>
                  <h3 className="font-semibold text-slate-800 line-clamp-2 mb-1">{task.title}</h3>
                  <p className="text-sm text-slate-500 mb-5">{task.course_name}</p>
                  <div className="flex items-center justify-between text-sm mt-auto">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {new Date(task.due_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </div>
                    <button onClick={() => toggleTaskCompletion(task.id_canvas)} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">Completar →</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-700">¡Todo al día!</h3>
              <p className="text-slate-500 mt-1">No hay tareas urgentes pendientes.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}