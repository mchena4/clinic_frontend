'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

interface Doctor {
  id: number;
  name: string;
  licenseNumber: string; 
  specialty: string;
  phoneNumber: string;
}

interface Appointment {
  id: number;
  date: string;
  status: string;
  doctorName: string;
  specialty: string;
}


export default function DashboardPage() {
  const router = useRouter();
  
  // States for doctors, appointments, loading and errors
  const [isLoading, setIsLoading] = useState(true);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [error, setError] = useState('');
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

  // States for the Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  const [appointmentDate, setAppointmentDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  
  const [bookingStatus, setBookingStatus] = useState<{ type: 'success' | 'error' | '', message: string }>({ type: '', message: '' });
  const [isBooking, setIsBooking] = useState(false);

  // Get appointments for the logged-in user 
  const fetchMyAppointments = async () => {
    try {
      const response = await api.get('/Appointments/MyAppointments');
      setMyAppointments(response.data);
    } catch (err) {
      console.error('Error cargando turnos:', err);
    }
  };

  // Verify token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Get doctors for the directory
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/Doctors'); 
        setDoctors(response.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        } else {
          setError('No se pudo cargar el directorio médico.');
        }
      }
    };

    // Charge the appointments and doctors at the same time
    Promise.all([fetchDoctors(), fetchMyAppointments()]).finally(() => {
      setIsLoading(false);
    });
  }, [router]);

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Reset states for booking
  const openBookingModal = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setAppointmentDate('');
    setAvailableSlots([]); 
    setSelectedTime('');
    setBookingStatus({ type: '', message: '' });
    setIsModalOpen(true);
  };

  // Get available slots when the date changes
  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setAppointmentDate(newDate);
    setSelectedTime(''); 
    
    if (!newDate || !selectedDoctor) return;

    setIsLoadingSlots(true);
    setBookingStatus({ type: '', message: '' });

    try {
      const response = await api.get(`/Appointments/AvailableSlots?doctorId=${selectedDoctor.id}&date=${newDate}`);
      setAvailableSlots(response.data);
      
      if (response.data.length === 0) {
        setBookingStatus({ type: 'error', message: 'El doctor no atiende en este día o no hay turnos libres.' });
      }
    } catch (err) {
      setBookingStatus({ type: 'error', message: 'Error al buscar los horarios disponibles.' });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Create appointment 
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !appointmentDate || !selectedTime) return;

    setIsBooking(true);
    setBookingStatus({ type: '', message: '' });

    try {
      const formattedDate = `${appointmentDate}T${selectedTime}:00`;
      
      await api.post('/Appointments', {
        doctorId: selectedDoctor.id,
        appointmentDate: formattedDate,
      });

      setBookingStatus({ type: 'success', message: '¡Turno agendado con éxito!' });
      
      // Actualize the appointments list immediately after booking
      fetchMyAppointments();
      
      setTimeout(() => {
        setIsModalOpen(false);
      }, 2000);

    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = typeof errorData === 'string' 
        ? errorData 
        : (errorData?.message || errorData?.title || 'Error al agendar el turno.');

      setBookingStatus({ 
        type: 'error', 
        message: errorMessage
      });
    } finally {
      setIsBooking(false);
    }
  };

  // Cancel appointment
  const handleCancelAppointment = async (appointmentId: number) => {
    const isConfirmed = window.confirm('¿Estás seguro de que deseas cancelar este turno? Esta acción liberará el horario.');
    if (!isConfirmed) return;

    try {
      await api.delete(`/Appointments/${appointmentId}/Cancel`);
      
      // Refresh the appointments list immediately after cancellation
      fetchMyAppointments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al cancelar el turno.');
    }
  };

  const formatearFecha = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', {
      timeZone: 'UTC', // 👈 ¡El antídoto contra el cambio de hora!
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold uppercase tracking-wider">Pendiente</span>;
      case 'Completed': return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold uppercase tracking-wider">Completado</span>;
      case 'Cancelled': return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider">Cancelado</span>;
      default: return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-900 font-medium">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <nav className="bg-white shadow-sm px-8 py-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">+</div>
          <h1 className="text-xl font-bold text-gray-800">Medical Clinic</h1>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-red-600 font-medium transition-colors">Cerrar Sesión</button>
      </nav>

      <main className="p-8 max-w-7xl mx-auto space-y-12">
        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

        {/* My appointments section*/}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            📅 Mis Próximos Turnos
          </h2>
          
          {myAppointments.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center shadow-sm">
              <p className="text-gray-500">No tienes turnos agendados en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAppointments.map((app) => (
                <div key={app.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-3 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start">
                    {getStatusBadge(app.status)}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 capitalize">
                      {formatearFecha(app.date)}
                    </h3>
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 font-medium">Dr. {app.doctorName}</p>
                    <p className="text-sm text-gray-500">{app.specialty}</p>
                  </div>

                {/* Cancel Button (only for pending appointments) */}
                {app.status === 'Pending' && (
                  <button 
                    onClick={() => handleCancelAppointment(app.id)}
                    className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 font-medium rounded-md transition-colors border border-transparent hover:border-red-200"
                  >
                    Cancelar
                  </button>
                )}
                </div>
              ))}
            </div>
          )}
        </section>

        <hr className="border-gray-200" />

        {/* Medical Directory */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Directorio Médico</h2>
            <p className="text-gray-500 mt-1">Profesionales disponibles para agendar nuevos turnos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc) => (
              <div key={doc.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{doc.name}</h3>
                  <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                    {doc.specialty}
                  </span>
                </div>
                {/* Book Button */}
                <button onClick={() => openBookingModal(doc)} className="mt-6 w-full py-2 bg-gray-50 hover:bg-blue-50 text-blue-700 font-medium rounded-lg border border-gray-200 transition-colors">
                  Ver Disponibilidad
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Booking Modal */}
      {isModalOpen && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">Agendar Turno</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-6">
                Consulta con <strong>{selectedDoctor.name}</strong> ({selectedDoctor.specialty}).
              </p>

              {bookingStatus.message && (
                <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${bookingStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {bookingStatus.message}
                </div>
              )}

              {/* Booking Form */}
              <form onSubmit={handleCreateAppointment} className="space-y-6">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">1. Selecciona el Día</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={handleDateChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700"
                  />
                </div>

                {/* Time */}
                {appointmentDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">2. Selecciona la Hora</label>
                    {isLoadingSlots ? (
                      <div className="text-sm text-blue-600">Buscando disponibilidad...</div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {availableSlots.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 text-sm font-medium rounded-md transition-colors border ${
                              selectedTime === time 
                                ? 'bg-blue-600 text-white border-blue-600' 
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No hay horarios disponibles para esta fecha.</p>
                    )}
                  </div>
                )}

                {/* Cancel buttons */}
                <div className="pt-4 flex gap-3 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                    Cancelar
                  </button>
                  {/* Confirm button */}
                  <button
                    type="submit"
                    disabled={isBooking || !selectedTime} 
                    className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${(isBooking || !selectedTime) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isBooking ? 'Agendando...' : 'Confirmar Turno'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}