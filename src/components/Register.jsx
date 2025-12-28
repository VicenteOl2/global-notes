import React, { useState } from 'react';
import './Register.css'; // <--- Ojo: Asegúrate de que el archivo CSS se llame así también

export default function Register({ supabase, irALogin }) {
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // MAGIA DE SUPABASE: CREAR USUARIO 🪄
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      alert("Error al registrar: " + error.message);
    } else {
      alert("¡Usuario Creado! 📧 Revisa tu correo para confirmar la cuenta.");
      irALogin(); // Nos devuelve al login automáticamente
    }
  };

  return (
    <div className="register-container">
      <h2>Crear Cuenta Nueva</h2>
      <form onSubmit={handleRegister}>
        
        <label>Correo Electrónico:</label>
        <input 
          type="email" 
          placeholder="tu@correo.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
        />

        <label>Contraseña:</label>
        <input 
          type="password" 
          placeholder="Mínimo 6 caracteres" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Registrarme</button>
      </form>

      <p className="switch-link">
        ¿Ya tienes cuenta? 
        {/* Al hacer click, ejecutamos la función que nos prestó App.jsx */}
        <span onClick={irALogin}> Inicia Sesión aquí</span>
      </p>
    </div>
  );
}