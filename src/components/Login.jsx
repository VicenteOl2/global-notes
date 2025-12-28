import React, { useState } from 'react';
import './Login.css';
export default function Login( { supabase, irARegistro }) {

    const [email,setEmail]=useState("");
    const [password,setPassword]=useState("");

    // Esta es la función que conecta con Supabase
    const iniciarSesion = async (e) => {
        e.preventDefault(); // Evita que se recargue la página

        // Aquí ocurre la magia 🪄
        const { error } = await supabase.auth.signInWithPassword({
            email: email,       // Lo que escribiste en el input usuario
            password: password, // Lo que escribiste en el input contraseña
        });

        if (error) {
            alert("usuario o contraseña incorrectos");
        } else {
            // Si entra aquí, Supabase avisa a App.jsx automáticamente
            console.log("¡Login exitoso!");
        }
    
    
    // Aquí más adelante pondremos la llamada a Supabase...
}
    return (
        <div className="login-container">
            <h1>LOGIN PAGE</h1>
        <form onSubmit={iniciarSesion}>
        {/* 2. AQUÍ VAN LOS INPUTS (input) */}
        {/* Input de Usuario */}
        <input 
        type="text" 
        placeholder="Usuario"
        value={email}
        onChange={(e) => setEmail(e.target.value)} 
        />

        {/* Input de Contraseña */}
        <input 
        type="password" 
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)} 
        />


        {/* 3. AQUÍ VA EL BOTÓN (button) */}
        <button type="submit">Iniciar Sesión</button>

      </form>

      {/* 4. AQUÍ VA EL TEXTO DE REGISTRO (p o span) */}
      <p className="switch-link">
  ¿No tienes cuenta? 
  <span 
    onClick={irARegistro} 
    style={{
       color: '#6c1e91ff', 
       cursor: 'pointer', 
       fontWeight: 'bold', 
       marginLeft: '5px',
       textDecoration: 'underline'
    }}
  >
    Regístrate aquí
    
  </span>
</p>
    </div>
    )

}
