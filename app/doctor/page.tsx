'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

interface PatientAppointment {
  id: number;
  date: string;
  status: string;
  patientName: string;
}

export default function DoctorDashboardPage() {
  const router = useRouter();
  
  // States for appointments, loading, and error handling
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Get the doctor's schedule 
  const fetchSchedule = async () => {
    try {
      const response = await api.get('/Appointments/DoctorSchedule');
      setAppointments(response.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('No tienes permisos de Doctor para ver esta página.');
      } else {
        setError('No se pudo cargar la agenda médica.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication and fetch schedule 
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchSchedule();
  }, [router]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Function to mark an appointment as completed
  const handleCompleteAppointment = async (appointmentId: number) => {
    const isConfirmed = window.confirm('¿Confirmar que la consulta ha finalizado?');
    if (!isConfirmed) return;

    try {
      // Complete the appointment by updating its status to "Completed"
      await api.put(`/Appointments/${appointmentId}`, {
        statusId: 2 
      });
      
      // Refresh schedule
      fetchSchedule();
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

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-teal-900 font-medium">Cargando agenda médica...</div>;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold">⚕️</div>
          <h1 className="text-xl font-bold text-gray-800">Panel Médico</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors">Cerrar Sesión</button>
      </nav>

      <main className="p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Mi Agenda</h2>
          <p className="text-gray-500 mt-1">Tus próximos pacientes agendados.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* Show message if no appointments */}
        {!error && appointments.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
            <p className="text-gray-500 text-lg">No tienes pacientes agendados por el momento.</p>
            <p className="text-gray-400 text-sm mt-2">¡Aprovecha para tomarte un café! ☕</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appointments.map((app) => (
              <div key={app.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 hover:border-teal-300 transition-colors">
                <div className="flex justify-between items-start">
                  {getStatusBadge(app.status)}
                </div>
                
                {/* Date and Time */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 capitalize">
                    {formatearFecha(app.date)}
                  </h3>
                </div>

                {/* Patient Info */}
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                      {app.patientName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Paciente</p>
                      <p className="text-base font-bold text-gray-800">{app.patientName}</p>
                    </div>
                  </div>

                  {/* Complete Appointment Button */}
                  {app.status === 'Pending' && (
                    <button 
                      onClick={() => handleCompleteAppointment(app.id)}
                      className="text-sm px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Finalizar Consulta
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}