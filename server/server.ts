import * as dotenv from "dotenv";

dotenv.config();
import fs from 'fs'

// @ts-ignore
import PlayFab from "playfab-sdk/Scripts/PlayFab/PlayFab.js";

// @ts-ignore
import PlayFabClient from "playfab-sdk/Scripts/PlayFab/PlayFabClient.js";

import express from 'express'
import cors from 'cors'

//@ts-ignore
import * as urb from 'urbit-ob'
import { ethers } from 'ethers';

const PORT = 3005
const app = express()
console.log(process.env.titleID)

const corsOptions = {
    origin: 'http://localhost:5173',
};

app.use(express.json());
app.use(cors(corsOptions))

function parseStringToScaledIntegers(inputString: any) {
  // Create a hash-like function to generate a number from the string
  let hashValue = 0;
  for (let i = 0; i < inputString.length; i++) {
      hashValue += inputString.charCodeAt(i);
  }
  console.log(hashValue);
  
  // Generate a random integer within the desired range using the hash value
  const scaleFactor = 25000000; // Target average value
  const offset = 20000000; // Adjust this to ensure the value is around 25 million
  const ran = Math.random()

  // Scale the hash value and ensure it's within bounds
  const scaledValue = Math.floor((Math.abs((hashValue * 100) % (scaleFactor)) + offset)*ran)

  // Output the result
  return [
    Math.floor(scaledValue*1/5),
    Math.floor(scaledValue*2/5),
    Math.floor(scaledValue*3/5),
    Math.floor(scaledValue*4/5),
    Math.floor(scaledValue*5/5),
    Math.floor(ran*5)
  ];
}

function shuffleArray(array: any) {
  for (let i = array.length - 1; i > 0; i--) {
    // Generate a random index from 0 to i
    const randomIndex = Math.floor(Math.random() * (i + 1));
    
    // Swap the elements at i and randomIndex
    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }
  return array;
}

const readFile = (path: string) => {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) {
        console.error(`Error reading file ${path}:`, err);
        return reject(err);
      }
      resolve(data);
    });
  });
};

const writeFile = (path: string, data: object) => {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(path, JSON.stringify(data, null, 4), (err) => {
      if (err) {
        console.error(`Error writing to file ${path}:`, err);
        return reject(err);
      }
      console.log(`File updated successfully at ${path}`);
      resolve();
    });
  });
};

const initializeFile = (path: string, initialData: object) => {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(path, JSON.stringify(initialData, null, 4), (err) => {
      if (err) {
        console.error(`Error writing to file ${path}:`, err);
        return reject(err);
      }
      console.log(`Initialized file at ${path}`);
      resolve();
    });
  });
};

app.post('/sessionTicket', async (req: any,res: any) => {
    const titleId = process.env.titleID;

    // Initialize the PlayFab SDK
    PlayFab.settings.titleId = titleId;
  
    // Login with a Custom ID (for demonstration purposes)
    const loginRequest = {
      TitleId: titleId,
      CustomId: req.body.sigil,
      CreateAccount: true,
    };
  
    PlayFabClient.LoginWithCustomID(loginRequest, async (error: any, result: any) => {
      if (error) {
        console.error("Error logging in:", error);
        return;
      }
  
      // Successful login
      console.log("Logged in successfully!");
  
      // Retrieve the session ticket
      const sessionTicket = result.data.SessionTicket;
      console.log("Session Ticket:", sessionTicket);
      const inputString = sessionTicket;
      const pats = parseStringToScaledIntegers(inputString);
      
      const unshuffled = [
        urb.hex2patq(String(pats[0])),
        urb.hex2patq(String(pats[1])),
        urb.hex2patq(String(pats[2])),
        urb.hex2patq(String(pats[3])),
        urb.hex2patq(String(pats[4])),
      ]

      const id = shuffleArray(unshuffled).findIndex((el: any) => el === req.body.sigil);
      const randomTokenIDSpace = ethers.toBigInt(ethers.hexlify(ethers.randomBytes(20)));
      const logSecretsFile = `/media${process.env.usb}/♦/metadata/nova-host/messages/index_secrets${req.body.sigil}.json`;

      try {
        let logSecrets: any = JSON.parse(await readFile(logSecretsFile));
        console.log(logSecrets)
        logSecrets.ids.push(pats[5])
        // Write the data to the file
        await fs.writeFile(logSecretsFile, JSON.stringify(logSecrets), () => {
          console.log(`Data written to file`);
        });
      } catch (error) {
        console.error("Error writing to the file:", error);
        await initializeFile(logSecretsFile, { ids: [pats[5]], message_ids: [] });
      }
      unshuffled.splice(pats[5], 0, req.body.sigil)
      res.status(200).json({ sessionTicket: sessionTicket, sigils: unshuffled});
    });
})

app.post('/send', (req: any, res: any) => {
  const payload = req.body;
  const randomTokenIDSpace = ethers.toBigInt(ethers.hexlify(ethers.randomBytes(20)));
  
  const counterFilePath = `/media${process.env.usb}/♦/metadata/nova-host/messages/counter.json`;
  const logFilePath = `/media${process.env.usb}/♦/metadata/nova-host/messages/log.json`;

  const updateCounterFile = async () => {
    try {
      let data = await readFile(counterFilePath);
      const obj = JSON.parse(data);
      obj.nonce = (obj.nonce || 0) + 1;
      await writeFile(counterFilePath, obj);
      return obj.nonce;
    } catch {
      await initializeFile(counterFilePath, { nonce: 0 });
      return 0;
    }
  };

  const updateLogFile = async (payload: any) => {

    try {
      let data = await readFile(logFilePath);
      const logData = JSON.parse(data);

      payload.message_id = randomTokenIDSpace.toString()

      async function updateFileWithMessageId(logFile: any, sessionIndex: any, messageId: any) {
        // Retrieve the existing data
        let secrets: any = JSON.parse(await readFile(logFile)); // Assuming you have a method to read the file
    
        // Create the new entry
        const newEntry = { session_index: sessionIndex, message_id: messageId };
    
        // Add the new entry to the message_ids array
        secrets.message_ids.push(newEntry);
    
        // Save the updated data back to the file
        await writeFile(logFile, secrets); // Assuming you have a method to write to the file
    }


      const logSecretsFile = `/media${process.env.usb}/♦/metadata/nova-host/messages/index_secrets${payload.message.sigil}.json`;
      let secrets = JSON.parse(await readFile(logSecretsFile))

      await updateFileWithMessageId(
          logSecretsFile,
          secrets.ids[secrets.ids.length - 1], // Assuming this is your `session_index`
          payload.message_id          // The message_id you want to add
      );

      delete payload.message.sigil
      logData.log.push(payload);

      await writeFile(logFilePath, logData);

    } catch (err){
      console.log(err)
      await initializeFile(logFilePath, { log: [payload] });
    }
  };

  const processFiles = async () => {
    try {
      const newNonce = await updateCounterFile();
      await updateLogFile(payload);
      console.log(`Process completed. Updated nonce: ${newNonce}`);
      console.log(randomTokenIDSpace.toString())
      res.send({message_id: randomTokenIDSpace.toString()});
    } catch (error) {
      console.error('Error during processing:', error);
      res.sendStatus(500);
    }
  };

  processFiles();
});

type Data = {
  sessionTicket: string;
};

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`)
})