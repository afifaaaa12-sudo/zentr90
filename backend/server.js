import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import userModel from './models/user.model.js';
import { generateResult } from './services/ai.service.js';

const port = process.env.PORT || 3000;

async function startServer() {
  try {
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: '*',
      },
    });

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        console.log('Socket auth - ProjectId:', projectId);
        console.log('Socket auth - Token exists:', !!token);

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          console.log('Invalid projectId, allowing anyway for testing');
          socket.project = { _id: projectId || 'test-project' };
        } else {
          socket.project = await projectModel.findById(projectId);
          if (!socket.project) {
            return next(new Error('Project not found'));
          }
        }

        if (!token) {
          console.log('No token, allowing anyway for testing');
          socket.user = { id: 'test-user', email: 'test@test.com' };
        } else {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          socket.user = decoded;

          // For older tokens that don't have _id, fetch it from DB
          if (!socket.user._id) {
            const user = await userModel.findOne({ email: decoded.email });
            if (user) {
              socket.user._id = user._id.toString();
              socket.user.id = user._id.toString();
            }
          }
        }

        next();
      } catch (error) {
        console.log('Auth error:', error.message);
        next(error);
      }
    });

    io.on('connection', (socket) => {
      socket.roomId = socket.project?._id?.toString();
      if (!socket.roomId) {
        console.log('❌ Connection rejected: No roomId');
        socket.disconnect();
        return;
      }
      console.log(' a user connected to room:', socket.roomId);
      console.log(' User:', socket.user.email);

      socket.join(socket.roomId);
      console.log(' Joined room:', socket.roomId);

      socket.on('project-message', async (data, callback) => {
        const message = data.message;
        const aiIsPresentInMessage = message.includes('@ai');

        // Check if sender is project collaborator
        const project = await projectModel.findById(socket.roomId);
        const isCollaborator = project.users.some(
          (userId) => userId.toString() === socket.user.id || userId.toString() === socket.user._id
        );

        if (!isCollaborator) {
          console.log('❌ User not in project collaborators:', socket.user.email);
          if (callback) callback({ error: 'Not authorized to send messages' });
          return;
        }

        // Check room size
        const room = io.sockets.adapter.rooms.get(socket.roomId);
        const numClients = room ? room.size : 0;
        console.log(' Message from:', socket.user.email);
        console.log(' Room:', socket.roomId, 'Clients:', numClients);
        console.log(' Broadcasting to room:', socket.roomId);

        socket.broadcast.to(socket.roomId).emit('project-message', data);

        // Acknowledge receipt to sender
        if (callback) callback({ received: true });

        if (aiIsPresentInMessage) {
          const prompt = message.replace('@ai', '');
          try {
            const result = await generateResult(prompt);

            io.to(socket.roomId).emit('project-message', {
              message: result,
              sender: {
                _id: 'ai',
                email: 'AI',
              },
            });
          } catch (error) {
            console.error('AI Generation Error:', error);
            io.to(socket.roomId).emit('project-message', {
              message: JSON.stringify({
                text: `Failed to generate response: ${error.message}`,
              }),
              sender: {
                _id: 'ai',
                email: 'AI',
              },
            });
          }
          return;
        }
      });

      socket.on('user-removed', (data) => {
        console.log('User removed from project:', data);
        socket.broadcast.to(socket.roomId).emit('user-removed', data);
      });

      socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId);
      });
    });

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();