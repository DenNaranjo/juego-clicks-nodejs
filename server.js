// --- Dependencias ---
// Express para crear el servidor web.
// http para que Express y Socket.io puedan trabajar juntos.
// socket.io para la comunicación en tiempo real.
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

// --- Inicialización ---
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

// --- Configuración de Archivos Estáticos ---
// Servimos el archivo principal del juego.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Lógica del Juego ---
// Guardamos el estado del juego en un objeto.
let gameState = {
  players: {}, // Almacenará los jugadores y sus puntajes
  dot: {       // Posición del punto a clickear
    x: 250,
    y: 250
  }
};

// Función para generar una nueva posición para el punto
function moveDot() {
  gameState.dot.x = Math.floor(Math.random() * 450) + 25; // Ancho del canvas - 50
  gameState.dot.y = Math.floor(Math.random() * 450) + 25; // Alto del canvas - 50
  
  // Enviamos la nueva posición a todos los jugadores conectados
  io.emit('updateState', gameState);
  console.log('Punto movido a:', gameState.dot);
}


// --- Conexión de Socket.io ---
io.on('connection', (socket) => {
  console.log(`Un jugador se ha conectado: ${socket.id}`);

  // 1. Añadir nuevo jugador al estado del juego
  gameState.players[socket.id] = {
    score: 0
  };

  // 2. Enviar el estado actual del juego al nuevo jugador
  socket.emit('updateState', gameState);

  // 3. Notificar a todos los demás jugadores sobre la actualización de jugadores
  io.emit('updateState', gameState);


  // 4. Escuchar cuando un jugador hace clic en el punto
  socket.on('dotClicked', () => {
    // Aumentar el puntaje del jugador que hizo clic
    if (gameState.players[socket.id]) {
      gameState.players[socket.id].score += 1;
      console.log(`Punto clickeado por ${socket.id}. Nuevo puntaje: ${gameState.players[socket.id].score}`);
      
      // Mover el punto a una nueva posición aleatoria
      moveDot();
    }
  });

  // 5. Escuchar cuando un jugador se desconecta
  socket.on('disconnect', () => {
    console.log(`Un jugador se ha desconectado: ${socket.id}`);
    
    // Eliminar al jugador del estado del juego
    delete gameState.players[socket.id];
    
    // Notificar a todos los demás jugadores que la lista de jugadores ha cambiado
    io.emit('updateState', gameState);
  });
});

// --- Iniciar el servidor ---
server.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}. Abre http://localhost:${PORT} en tu navegador.`);
});

// Mover el punto cada 3 segundos si nadie lo clickea
setInterval(moveDot, 3000);
