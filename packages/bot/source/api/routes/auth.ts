import { Router, Request, Response } from 'express';
import axios from 'axios';

const auth = Router();

auth.get('/auth', async (req, res) => {
   const code = req.query.code as string | undefined;
   const state = req.query.state as string | undefined;
   
   if (!code || !state) {
      res.status(400).send({ error: 'Invalid request!' });
      return;
   }

   const data = new URLSearchParams({
      client_id: process.env.DISCORD_ID || '',
      client_secret: process.env.DISCORD_SECRET || '',
      redirect_uri: `${process.env.DISCORD_REDIRECT}`,
      grant_type: 'authorization_code',
      scope: 'identify guilds',
      code,
   });

   try {
      const response = await axios.post('https://discord.com/api/oauth2/token', data);

      res.send({
         type: 'auth-success',
         token: response.data.access_token,
         refresh: response.data.refresh_token,
         expires: response.data.expires_in,
         state: state,
      });
   } catch (error: any) {
      res.status(500).json({
         error: true,
         message: error.message,
      });
   }
});

export default auth
