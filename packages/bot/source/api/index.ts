import express from 'express';
import { Server } from 'socket.io';
import http from 'http';

import parser from 'body-parser';
import cors from 'cors';

import auth from './routes/auth.js';

const api = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';

// Wrapping api in a distinct handler to avoid no-misused-promises issues if express implies promise return
const server = http.createServer((req, res) => {
  api(req, res);
});

const io = new Server(server, {
  cors: {
    origin: clientUrl,
  },
});

api.use(cors({ origin: clientUrl }));

api.use(parser.urlencoded({ extended: true }));
api.use(parser.json());

api.use(auth);

export { api, io, server };
