'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    dateOfBirth: '',
    phoneNumber: '',
    email: '',
    password: ''
  });

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    try {
      await api.post('api/Auth/Register', {
        ...formData,
        dni: formData.dni, 
      });

      setStatusMsg({ type: 'success', text: '¡Cuenta creada con éxito! Redirigiendo al inicio de sesión...' });
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (err: any) {
      setStatusMsg({ 
        type: 'error', 
        text: err.response?.data?.message || err.response?.data || 'Error al registrar la cuenta. Verifica tus datos.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clase reutilizable para inputs con texto oscuro y legible
  const inputClass = "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white placeholder:text-gray-400";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center w-12 h-12 bg-blue-600 rounded-lg items-center text-white font-bold mx-auto mb-4 text-2xl">
          +
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Crea tu cuenta de Paciente
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          O{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
            inicia sesión si ya tienes una
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-200">
          
          {statusMsg.text && (
            <div className={`mb-6 p-4 rounded-lg font-medium border ${statusMsg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
              {statusMsg.text}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRegister}>
            {/* Datos Personales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input name="firstName" type="text" required value={formData.firstName} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input name="lastName" type="text" required value={formData.lastName} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI / Documento</label>
                <input name="dni" type="text" required value={formData.dni} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                <input name="dateOfBirth" type="date" required value={formData.dateOfBirth} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input name="phoneNumber" type="text" required value={formData.phoneNumber} onChange={handleChange} className={inputClass} />
            </div>

            <hr className="border-gray-100" />

            {/* Datos de Acceso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input name="email" type="email" required value={formData.email} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input name="password" type="password" required minLength={6} value={formData.password} onChange={handleChange} className={inputClass} />
              <p className="mt-1 text-xs text-gray-500">Debe tener al menos 6 caracteres.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white transition-colors ${
                isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {isSubmitting ? 'Creando cuenta...' : 'Registrarme'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

