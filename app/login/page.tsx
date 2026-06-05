'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import Link from 'next/link'; 

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError('');
    setIsLoading(true);

    try {
      // Request to login api endpoint
      const response = await api.post('api/Auth/login', { email, password });
      
      //Save token
      const token = response.data.token;
      localStorage.setItem('token', token);
      
      // Redirect on successful login
      const userResponse = await api.get('/Auth/me')
      const userRole = userResponse.data.role;
      
      // Redirect based on user role
      switch (userRole) 
      {
        case 'Admin':
          router.push('/admin');
          break;

        case 'Doctor':
          router.push('/doctor');
          break;
          
        case 'Patient':
          router.push('/dashboard');
          break;

        case 'Receptionist':
          router.push('/receptionist');
          break;

        default:
          setError('Rol de usuario desconocido. Contacta al soporte.');
      }      
      
    } catch (err: any) {
      // Show the error message
      if (err.response?.status === 401) {
        setError('Credenciales incorrectas. Inténtalo de nuevo.');
      } else {
        setError(err.response?.data || 'Ocurrió un error al intentar iniciar sesión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-blue-900">Clinica Medica</h2>
          <p className="text-gray-500 mt-2">Ingresa a tu cuenta</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm text-center font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-black"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors
              ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
          
          {/* Register Link */}
          <button
          className="w-full py-3 px-4 rounded-lg text-blue-600 font-medium transition-colors hover:bg-gray-100">
          <Link href="/register">No tienes una cuenta? Regístrate aquí</Link>
          </button>
        </form>
      </div>
    </div>
  );
}