import express from 'express';
import { Server, Socket } from 'socket.io';
import http from 'http';

import parser from 'body-parser';
import cors from 'cors';

import auth from './routes/auth.js';

const api = express();
const server = http.createServer(api);
const io = new Server(server, {
   cors: {
      origin: '*',
   },
});

api.use(cors());

api.use(parser.urlencoded({ extended: true }));
api.use(parser.json());

api.use(auth);

export { api, io, server };
