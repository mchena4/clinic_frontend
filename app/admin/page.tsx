'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

interface Specialty {
  id: number;
  name: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'doctor' | 'receptionist' | 'specialty' | 'user'>('doctor');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  
  // States for visual feedback
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [docForm, setDocForm] = useState({ email: '', password: '', firstName: '', lastName: '', licenseNumber: '', phoneNumber: '', specialtyId: '' });
  const [recForm, setRecForm] = useState({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '' });
  const [specForm, setSpecForm] = useState({ name: '' });
  const [userForm, setUserForm] = useState({ email: '', password: '', role: 'Admin' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    
    // Get specialties for doctor registration form
    const fetchSpecialties = async () => {
      try {
        const response = await api.get('/Admin/Specialties'); 
        setSpecialties(response.data);
      } catch (err) {
        console.error("No se pudieron cargar las especialidades", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSpecialties();
  }, [router]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Function for showing success/error messages
  const showMessage = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  
  // Handle doctor registration form submission 
  const handleRegisterDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/Admin/RegisterDoctor', {
        ...docForm,
        specialtyId: Number(docForm.specialtyId)
      });
      showMessage('success', 'Médico registrado exitosamente.');
      setDocForm({ email: '', password: '', firstName: '', lastName: '', licenseNumber: '', phoneNumber: '', specialtyId: '' });
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || err.response?.data || 'Error al registrar médico.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle receptionist registration form submission
  const handleRegisterReceptionist = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/Admin/RegisterReceptionist', recForm);
      showMessage('success', 'Recepcionista registrada exitosamente.');
      setRecForm({ email: '', password: '', firstName: '', lastName: '', phoneNumber: '' });
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || err.response?.data || 'Error al registrar recepcionista.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle creation of new specialty form submission
  const handleCreateSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/Admin/CreateSpecialty', specForm);
      showMessage('success', 'Especialidad creada exitosamente.');
      setSpecForm({ name: '' });
      // Recargar especialidades para el formulario de doctores
      const response = await api.get('/Admin/Specialties');
      setSpecialties(response.data);
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || err.response?.data || 'Error al crear especialidad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle creation of new generic user form submission
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/Admin/CreateUser', userForm);
      showMessage('success', `Usuario (${userForm.role}) creado exitosamente.`);
      setUserForm({ email: '', password: '', role: 'Admin' });
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || err.response?.data || 'Error al crear usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none text-gray-900 bg-white placeholder:text-gray-700";

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-medium">Cargando panel de administración...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-900 shadow-sm px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center text-white font-bold">⚙️</div>
          <h1 className="text-xl font-bold text-white">Panel de Administración</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-slate-300 hover:text-white font-medium transition-colors">Cerrar Sesión</button>
      </nav>

      <main className="p-8 max-w-4xl mx-auto">
        
        {/* Nav pages */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-xl shadow-sm border border-gray-200">
          {[
            { id: 'doctor', label: 'Alta Médico' },
            { id: 'receptionist', label: 'Alta Recepcionista' },
            { id: 'specialty', label: 'Nueva Especialidad' },
            { id: 'user', label: 'Usuario Genérico' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab.id ? 'bg-slate-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Feedback message */}
        {statusMsg.text && (
          <div className={`mb-6 p-4 rounded-lg border font-medium ${
            statusMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {statusMsg.text}
          </div>
        )}

        {/* Forms */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          
          {/* Medical form */}
          {activeTab === 'doctor' && (
            <form onSubmit={handleRegisterDoctor} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Registrar Nuevo Médico</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Nombre</label>
                  <input type="text" required value={docForm.firstName} onChange={e => setDocForm({...docForm, firstName: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Apellido</label>
                  <input type="text" required value={docForm.lastName} onChange={e => setDocForm({...docForm, lastName: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Matrícula (License)</label>
                  <input type="text" required value={docForm.licenseNumber} onChange={e => setDocForm({...docForm, licenseNumber: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Especialidad</label>
                  <select required value={docForm.specialtyId} onChange={e => setDocForm({...docForm, specialtyId: e.target.value})} className={inputClass}>
                    <option value="" disabled>Seleccionar...</option>
                    {specialties.map(spec => (
                      <option key={spec.id} value={spec.id}>{spec.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Teléfono</label>
                  <input type="text" required value={docForm.phoneNumber} onChange={e => setDocForm({...docForm, phoneNumber: e.target.value})} className={inputClass} />
                </div>
              </div>

              <hr className="my-6 border-gray-100" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input type="email" required value={docForm.email} onChange={e => setDocForm({...docForm, email: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal</label>
                  <input type="password" required minLength={6} value={docForm.password} onChange={e => setDocForm({...docForm, password: e.target.value})} className={inputClass} />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                {isSubmitting ? 'Registrando...' : 'Crear Perfil Médico'}
              </button>
            </form>
          )}

          {/* Receptionist Form */}
          {activeTab === 'receptionist' && (
            <form onSubmit={handleRegisterReceptionist} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Registrar Recepcionista</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input type="text" required value={recForm.firstName} onChange={e => setRecForm({...recForm, firstName: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input type="text" required value={recForm.lastName} onChange={e => setRecForm({...recForm, lastName: e.target.value})} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="text" required value={recForm.phoneNumber} onChange={e => setRecForm({...recForm, phoneNumber: e.target.value})} className={inputClass} />
                </div>
              </div>

              <hr className="my-6 border-gray-100" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input type="email" required value={recForm.email} onChange={e => setRecForm({...recForm, email: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña temporal</label>
                  <input type="password" required minLength={6} value={recForm.password} onChange={e => setRecForm({...recForm, password: e.target.value})} className={inputClass} />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                {isSubmitting ? 'Registrando...' : 'Crear Perfil Recepcionista'}
              </button>
            </form>
          )}

          {/* Specialty Form */}
          {activeTab === 'specialty' && (
            <form onSubmit={handleCreateSpecialty} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Añadir Especialidad Médica</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Especialidad</label>
                <input type="text" required placeholder="Ej: Cardiología, Pediatría..." value={specForm.name} onChange={e => setSpecForm({ name: e.target.value })} className={inputClass} />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                {isSubmitting ? 'Guardando...' : 'Crear Especialidad'}
              </button>

              {/* Specialties List */}
              <div className="mt-8">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Especialidades Actuales ({specialties.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {specialties.map(spec => (
                    <span key={spec.id} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200">
                      {spec.name}
                    </span>
                  ))}
                </div>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  );
}