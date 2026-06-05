'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
}

interface PatientAppointment {
  id: number;
  date: string;
  status: string;
  patientName: string;
}

export default function ReceptionistDashboardPage() {
  const router = useRouter();
  
  // States for doctors and appointments
  const [isLoading, setIsLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [error, setError] = useState('');

  // Check authentication and fetch doctors 
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Get doctors
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/Doctors');
        setDoctors(response.data);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          setError('No tienes permisos de Recepcionista para ver esta página.');
        } else {
          setError('No se pudo cargar el directorio médico.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, [router]);

  // Get doctors appointments when a doctor is selected
  const fetchDoctorAppointments = async (doctorId: number) => {
    setIsLoadingAppointments(true);
    try {
      // AQUÍ ESTÁ EL CAMBIO HACIA TU NUEVO ENDPOINT UNIFICADO
      const response = await api.get(`/Appointments/DoctorSchedule?DoctorId=${doctorId}`);
      setAppointments(response.data);
    } catch (err) {
      console.error('Error al cargar la agenda del doctor', err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Seek doctor appointments when selectedDoctorId changes
  useEffect(() => {
    if (!selectedDoctorId) {
      setAppointments([]);
      return;
    }
    fetchDoctorAppointments(selectedDoctorId);
  }, [selectedDoctorId]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Cancel appointment  
  const handleCancelAppointment = async (appointmentId: number) => {
    const isConfirmed = window.confirm('¿Confirmas la cancelación de este turno por solicitud del paciente/médico?');
    if (!isConfirmed) return;

    try {
      await api.delete(`/Appointments/${appointmentId}/Cancel`);
      if (selectedDoctorId) fetchDoctorAppointments(selectedDoctorId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cancelar el turno.');
    }
  };

  // Complete appointment
  const handleCompleteAppointment = async (appointmentId: number) => {
    const isConfirmed = window.confirm('¿Marcar este turno como Atendido?');
    if (!isConfirmed) return;

    try {
      await api.put(`/Appointments/${appointmentId}`, {
        statusId: 2 
      });
      if (selectedDoctorId) fetchDoctorAppointments(selectedDoctorId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar el turno.');
    }
  };


  const formatearFecha = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', {
      timeZone: 'UTC', 
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase tracking-wider">Pendiente</span>;
      case 'Completed': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase tracking-wider">Atendido</span>;
      case 'Cancelled': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider">Cancelado</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-violet-900 font-medium">Cargando sistema de recepción...</div>;

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold">📋</div>
          <h1 className="text-xl font-bold text-gray-800">Recepción</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors">Cerrar Sesión</button>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-8 gap-8">
        
        {/* Left column: Doctor selector */}
        <aside className="w-full md:w-1/3 lg:w-1/4">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-28">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Seleccionar Médico</h2>
            
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : (
              <div className="space-y-2">
                {doctors.map(doc => (
                  // Doctor button
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selectedDoctorId === doc.id 
                        ? 'bg-violet-50 border-violet-500 text-violet-800 font-bold' 
                        : 'bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50/50'
                    }`}
                  >
                    <div className="font-medium text-sm">{doc.name}</div>
                    <div className="text-xs text-gray-500 font-normal mt-0.5">{doc.specialty}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right column: Selected Doctor's Schedule */}
        <main className="w-full md:w-2/3 lg:w-3/4">
          {/* Show message if no doctor is selected */}
          {!selectedDoctorId ? (
            <div className="bg-white h-full min-h-100 flex flex-col items-center justify-center rounded-xl border border-gray-200 shadow-sm text-gray-400">
              <span className="text-4xl mb-3">👨‍⚕️</span>
              <p>Selecciona un médico en el panel izquierdo para ver su agenda.</p>
            </div>
          ) : (
            // Doctor's schedule and appointments
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Agenda de Turnos</h2>
                  <p className="text-gray-500">Dr. {selectedDoctor?.name} - {selectedDoctor?.specialty}</p>
                </div>
              </div>

              {/* Show loading, empty state, or list of appointments */}
              {isLoadingAppointments ? (
                <div className="text-center py-12 text-violet-600 font-medium">Cargando turnos...</div>
              ) : appointments.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
                  <p className="text-gray-500">Este médico no tiene turnos programados a partir de hoy.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {/* List of appointments */}
                  {appointments.map((app) => (
                    <div key={app.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        {getStatusBadge(app.status)}
                        <span className="text-sm font-bold text-gray-400">#{app.id}</span>
                      </div>
                      
                      {/* Formatted date and time of the appointment */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 capitalize">
                          {formatearFecha(app.date)}
                        </h3>
                      </div>

                      {/* Patient information */}
                      <div className="mt-2 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                            {app.patientName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Paciente</p>
                            <p className="text-sm font-bold text-gray-800">{app.patientName}</p>
                          </div>
                        </div>

                        {/* Action buttons for the receptionist */}
                        {app.status === 'Pending' && (
                          <div className="flex gap-2">
                            {/* Cancel Button */}
                            <button 
                              onClick={() => handleCancelAppointment(app.id)}
                              className="text-xs px-3 py-1.5 text-red-600 hover:bg-red-50 font-medium rounded border border-red-200 transition-colors"
                            >
                              Cancelar
                            </button>
                            {/* Complete Button */}
                            <button 
                              onClick={() => handleCompleteAppointment(app.id)}
                              className="text-xs px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded transition-colors shadow-sm"
                            >
                              Finalizar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}