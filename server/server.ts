import 'dotenv/config'

// @ts-ignore
import PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFab.js";

// @ts-ignore
import PlayFabClient from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";

import express from 'express'
import cors from 'cors'

const PORT = 3001
const app = express()

const corsOptions = {
    origin: 'http://localhost:5173',
};

app.use(express.json());
app.use(cors(corsOptions))

app.post('/sessionTicket', async (req: any,res: any) => {
    const titleId = "";

    // Initialize the PlayFab SDK
    PlayFab.settings.titleId = titleId;
  
    // Login with a Custom ID (for demonstration purposes)
    const loginRequest = {
      TitleId: titleId,
      CustomId: req.body.sigil,
      CreateAccount: true,
    };
  
    PlayFabClient.LoginWithCustomID(loginRequest, (error: any, result: any) => {
      if (error) {
        console.error("Error logging in:", error);
        return;
      }
  
      // Successful login
      console.log("Logged in successfully!");
  
      // Retrieve the session ticket
      const sessionTicket = result.data.SessionTicket;
      console.log("Session Ticket:", sessionTicket);
      res.status(200).json({ sessionTicket: sessionTicket });
  
      // You can now use the session ticket for further API calls
    });
})



type Data = {
  sessionTicket: string;
};

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})