import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Login from './components/Login';
import Register from './components/Register';
import Notes from './components/Notes';
import './App.css';

// 1. CONFIGURACIÓN DE SUPABASE (Pega tus llaves aquí de nuevo)
const supabaseUrl = 'https://rzcisiutjxarimggylkb.supabase.co'
const supabaseKey = 'sb_publishable_SDBTUaCFiKL6MmqSxMDzTw_VLBRmObP'
const supabase = createClient(supabaseUrl, supabaseKey)

function App() {
  const [session, setSession] = useState(null);
  
  // 2. ESTADO NUEVO: Controla si mostramos el Registro o el Login
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  useEffect(() => {
    // Escuchar si el usuario entra o sale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 🚦 SEMÁFORO DE PANTALLAS (Aquí ocurre la magia de irARegistro) 🚦

  // A. Si NO hay usuario logueado (session es null)...
  if (!session) {
    
    // ...y el interruptor dice "Mostrar Registro":
    if (mostrarRegistro) {
      return (
        <Register 
          supabase={supabase} 
          irALogin={() => setMostrarRegistro(false)} // <--- Le prestamos la función para VOLVER
        />
      );
    }

    // ...si el interruptor está apagado, mostramos LOGIN:
    return (
      <Login 
        supabase={supabase} 
        irARegistro={() => setMostrarRegistro(true)} // <--- AQUÍ NACE "irARegistro"
      />
    );
  }

  // B. Si SÍ hay usuario, mostramos las Notas
  return (
    <div className="App">
       <button 
         onClick={() => supabase.auth.signOut()} 
         style={{position: 'fixed', top: '10px', right: '10px', zIndex: 99, padding: '10px', background:'red', color:'white', border:'none', borderRadius:'5px'}}
       >
         Cerrar Sesión
       </button>
       <Notes />
    </div>
  );
}

export default App;