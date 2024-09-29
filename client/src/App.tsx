import { useState, useRef, useEffect } from 'react'
import '@urbit/sigil-js'
import './App.css'
import {ethers} from 'ethers'
import sequence from './SequenceEmbeddedWallet'
import { useOpenConnectModal } from '@0xsequence/kit'
import { useDisconnect, useAccount } from 'wagmi'
import EmojiPicker from 'emoji-picker-react';
import html2canvas from "html2canvas";
import base64js from "base64-js";
// import { SequenceIndexer, WebrpcError } from '@0xsequence/indexer'

// @ts-ignore
import ob from 'urbit-ob'

const config: any = {
  point: '~zod', // or 'zod'
  size: 30,
  background:'#FFFFFF', 
  foreground:'black',
  detail:'none',
  space:'none',
}

// const indexer = new SequenceIndexer('https://arbitrum-sepolia-indexer.sequence.app', 'AQAAAAAAAExvTNghWKVWJlmfiXZbHodfKGQ')
let scrolling = false
const Sigil = ({ config }: any) => {
  return (
    // @ts-ignore
    <urbit-sigil {...config} />
  )
 }

const EmojiTotem = (props: any) => {
  const [scrollAmount, setScrollAmount] = useState(0); // Initial slow scroll amount
  const [emojis, setEmojis] = useState<any>(null);

  useEffect(() => {
    if (scrollAmount && props.emojis) {
      // Aggregate emojis and their counts
      const emojiCounts = props.emojis.reduce((acc: Record<string, number>, emoji: string) => {
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
      }, {});

      // Create an array of JSX elements with emojis and their counts
      const aggregatedEmojis = Object.entries(emojiCounts).map(([emoji, count]: any, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "16px",
            marginBottom: "2px",
          }}
        >
          <span style={{ fontSize: "24px" }}>{emoji}</span>
          <span style={{ fontSize: "10px", marginLeft: "4px" }}>x{count.toString()}</span>
        </div>
      ));

      setEmojis(
        // @ts-ignore
        <marquee
          style={{ height: "50px" }}
          direction="down"
          scrollamount={scrollAmount} // Proper camelCase for JSX
        >
          {aggregatedEmojis}
        {/* @ts-ignore */}
        </marquee>
      );
    } else {
      setEmojis(null);
    }
  }, [scrollAmount, props.emojis]);

  return (
    <div
      className="marquee-container"
      style={{height: '50px', width: '100px'}}
      onMouseEnter={() => setScrollAmount(2)} // Faster scroll on hover
      onMouseLeave={() => setScrollAmount(0)} // Stop scrolling when mouse leaves
    >
      {emojis}
    </div>
  );
};

let clickTimeout: any;
let youShallNotPass = true

const SigilMarquee = (props: any) => {
  const [sigils, setSigils] = useState<any>(null); // State to control sigil visibility
  const [scrollAmount, setScrollAmount] = useState(0); // Initial slow scroll amount

  useEffect(() => {
    if (scrollAmount && props.sigils) {
      // Aggregate emojis and their count

      setSigils(
        /*@ts-ignore*/
        <marquee scrollamount={scrollAmount}>
          {props.sigils.map((sigil: string, index: number) => (
            <span key={index} style={{ marginRight: '10px' }}>
              {sigil}
            </span>
          ))}
        {/* @ts-ignore */}
        </marquee>
      )
    } else {
      setSigils(null);
    }
  }, [scrollAmount]);

  return (
    <div 
      className="message-point" 
      style={{ position: 'absolute', marginLeft: '40px', top: 'calc(94%)', bottom: '45px', width: '200px' }}
      onMouseEnter={() => setScrollAmount(3)}
      onMouseLeave={() => setScrollAmount(0)}
    >
      {sigils}
    </div>
  );
};

const Chat = (props: any) => {
  const captureRef = useRef(null); // Reference to the element to capture
  // const [imageSrc, setImageSrc] = useState(null);
  const chatContainerRef: any = useRef(null);
  const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<any>(null); // Track which message is getting the emoji picker
  const [messages, setMessages] = useState<any>([
    { text: '☆ ☆ ☆ Welcome ☆ ☆ ☆', id: 1, isUser: false, emojis: [] },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const textareaRef: any = useRef(null);
  const [obfsSigils, setObfsSigils] = useState<any>([]) 

  const handleSend = async () => {
    if (newMessage.trim() !== '') {
      // const newId = messages.length + 1;
      const res = await fetch('http://localhost:3005/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add other headers as needed
        },
        body: JSON.stringify({
          message: { sigil: props.sigil, time: new Date(), text: newMessage, isUser: true, emojis: [], sigils: obfsSigils },
        }),
      })

      const json = await res.json()
      console.log(json.message_id)
      setMessages([...messages, { text: newMessage, id: json.message_id, isUser: true, emojis: [], sigils: obfsSigils }]);
      scrolling = false;
      setNewMessage('');
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `50px`;
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleInputChange = (e: any) => {

    setNewMessage(e.target.value);
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  };

  const handleEmojiClick = async (emoji: any) => {
    if (emojiPickerMessageId !== null) {
      // Update the emoji for the specific message
      console.log(emojiPickerMessageId)
      setMessages((prevMessages: any) =>
        prevMessages.map((message: any) =>
          message.id === emojiPickerMessageId ? { ...message, emojis: [...message.emojis, emoji.emoji] } : message
        )
      );
      setEmojiPickerMessageId(null); // Close the emoji picker
    }
  };

  useEffect(() => {

    // Connect to the Ethereum mainnet
    const provider = new ethers.JsonRpcProvider(
      "https://nodes.sequence.app/mainnet"
    );
    
    // Azimuth contract address (this might need to be confirmed)
    const azimuthContractAddress = '0x223c067f8cf28ae173ee5cafea60ca44c335fecb';
    
    // ABI for the Azimuth contract (simplified for ownership query)
    const azimuthAbi = [
      'function getOwner(uint32 point) view returns (address)',
      'function getOwnedPoints(address owner) view returns (uint32[])',
    ];
    
    // Create a contract instance
    const azimuthContract = new ethers.Contract(azimuthContractAddress, azimuthAbi, provider);

    function pointToPatp(point: any) {
      return ob.patp(point);
    }

    async function findUrbitId(ethAddress: any) {
      // Query the contract for Urbit IDs owned by this address
      const urbitIds = await azimuthContract.getOwnedPoints(ethAddress);
    
      if (urbitIds.length === 0) {
        console.log('No Urbit ID associated with this address.');
        return;
      }
    
      console.log(`Urbit IDs associated with ${ethAddress}:`);

      urbitIds.forEach(async (id: any) => {
        console.log(`${id}`);

          // Example: Convert point to Urbit ID
          const point = id; // Replace with your actual point
          const urbitId = pointToPatp(point);

          console.log(`Urbit ID for point ${point}: ${urbitId}`);
          props.setSigil(urbitId)
          // fetch('', {})
          const res = await fetch('http://localhost:3005/sessionTicket', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Add other headers as needed
            },
            body: JSON.stringify({
              sigil: urbitId,
            }),
          })

          const json = await res.json()
          console.log(json)
          const response = await sequence.signIn(
            {
              playFabTitleId: import.meta.env.VITE_PLAYFAB_TITLE_ID,
              playFabSessionTicket: json.sessionTicket
            },
            'playfab session'
          )
          // setObfsSigils(json.sigils)
          // const updatedSigils = json.sigils.filter((sigil: any) => sigil !== urbitId);
          setObfsSigils(json.sigils)
          props.setEmbeddedWalletAddress(response.wallet)
      });
    }
    
    // Replace with the Ethereum address you want to check
    const addressToCheck = '0xc48835421ce2651BC5F78Ee59D1e10244753c7FC';
    findUrbitId(addressToCheck);
    return () => {}
  }, [])

  const [messageIds, setMessageIds] = useState(new Set());

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        // Fetch the log and index secrets files
        const res = await fetch('http://localhost:8000/♦/metadata/nova-host/messages/log.json');
        const resSecrets = await fetch(`http://localhost:8000/♦/metadata/nova-host/messages/index_secrets${props.sigil}.json`);
        
        // Parse JSON data
        const logs = await res.json();
        const indexes = await resSecrets.json();
        
        // Create a new Set to hold new message IDs
        const newMessageIds = new Set();

        // Iterate over the messages and map them with corresponding sigils and data
        const newMessages = logs.log.map((message: any) => {
          // Find the message_id entry in the index secrets that corresponds to this message
          const messageEntry = indexes.message_ids.find((entry: any) => entry.message_id === message.message_id);

          if (messageEntry) {
            // Extract the corresponding sigil from the message using the session_index
            const sessionIndex = messageEntry.session_index;
            const matchedSigil = message.message.sigils[sessionIndex];

            // Check if the matched sigil is the same as props.sigil
            const isUser = matchedSigil === props.sigil;

            // Add the new message ID to the set
            newMessageIds.add(messageEntry.message_id);

            // Return the structured message
            return {
              text: message.message.text,
              isUser,
              id: messageEntry.message_id,
              emojis: [], // Assuming emojis aren't used in this case
              sigils: message.message.sigils.filter((sigil: any) => sigil !== props.sigil),
            };
          }

          // Return null if messageEntry isn't found
          return null;
        }).filter(Boolean); // Filter out any null entries

        // Check if there are new messages to update
        if ([...newMessageIds].some(id => !messageIds.has(id))) {
          setMessages(newMessages);
          setMessageIds(newMessageIds); // Update the set of message IDs
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }, 1000);

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [props.sigil, messageIds]);
  
  useEffect(() => {
    const container = chatContainerRef.current;

    // Scroll to the bottom whenever messages are updated
    if (container && !scrolling) {
      container.scrollTop = container.scrollHeight;
    }

    const handleScroll = () => {
      scrolling = true
    };

    if (container) {
      container.addEventListener('scroll', handleScroll);
    }

    // Cleanup event listener on unmount or if container changes
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [messages, scrolling]);

  const dataURLToBuffer = (dataURL: any) => {
    const base64Data = dataURL.replace(/^data:image\/(png|jpg);base64,/, ""); // Remove data URL metadata
    const byteArray = base64js.toByteArray(base64Data); // Convert base64 to byte array
    return byteArray; // This is the buffer (Uint8Array)
  };

  const handleDoubleClick = (targetElement: HTMLElement) => {
    // Clear any pending single-click action
    if (clickTimeout) {
      console.log('current')
      clearInterval(clickTimeout);
    }
    // Find the element with id 'sigil' and 'bubble'
    const sigilElement = targetElement.querySelector("#sigil");
    const bubbleElement = targetElement.querySelector("#bubble");

    console.log('test')
  
    if (sigilElement) {
      // Hide the 'sigil' element
      (sigilElement as HTMLElement).style.visibility = "hidden";
    }
  
    if (bubbleElement) {
      // Adjust padding
      (bubbleElement as HTMLElement).style.paddingTop = "8px";
      (bubbleElement as HTMLElement).style.marginTop = "11px";
      (bubbleElement as HTMLElement).style.marginRight = "15px";
      (bubbleElement as HTMLElement).style.marginBottom = "15px";
    }
  
    const bufferToDataURL = (buffer: any) => {
      const base64String = base64js.fromByteArray(buffer); // Convert buffer back to base64
      return `data:image/png;base64,${base64String}`; // Return base64 string in data URL format
    };

    // Use html2canvas to capture the image of the specific target element
    html2canvas(targetElement).then((canvas: any) => {
      // Convert the canvas to a data URL (base64 encoded image)
      const dataURL = canvas.toDataURL("image/png");
  
      // Create a link element for downloading
      const link = document.createElement("a");
      link.href =  bufferToDataURL(dataURLToBuffer(dataURL));
      link.download = "captured_image.png"; // Set the file name
  
      // Append the link to the document, trigger the download, and remove the link
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      // Restore the visibility and padding
      if (sigilElement) {
        (sigilElement as HTMLElement).style.visibility = "visible";
      }
      if (bubbleElement) {
        (bubbleElement as HTMLElement).style.paddingTop = "25px";
        (bubbleElement as HTMLElement).style.marginTop = "0px";
        (bubbleElement as HTMLElement).style.marginRight = "0px";
        (bubbleElement as HTMLElement).style.marginBottom = "0px";
      }
      youShallNotPass = true

    });
  };

  const handleSingleClick = (messageId: any) => {
    // Perform the single-click action here
    setEmojiPickerMessageId(messageId); // Example: set the emoji picker for the clicked message
  };
  
  useEffect(() => {
    console.log(obfsSigils)
  }, [obfsSigils])
  return (
    <div className="chat-container">
      <div className='messages-container' ref={chatContainerRef}>
        {messages.map((message: any) => (
          <div
            ref={captureRef}
            // onClick={() => console.log('test')}
            onClick={() => {
              // Set a timeout to trigger single-click action
              clickTimeout = setTimeout(() => {
                if(youShallNotPass){
                  console.log('handle single click')
                  handleSingleClick(message.id);
                }
              }, 400) // Adjust the delay as needed
            }}
            onDoubleClick={(e) => {
              youShallNotPass = false
              if (clickTimeout) {
                clearInterval(clickTimeout); // Prevent single-click action
              }
              handleDoubleClick(e.currentTarget);
            }}
            key={message.id}
            style={{cursor: 'pointer', paddingTop: '5px', paddingLeft: '2px'}}
            className={`message-container ${message.isUser ? 'user' : 'other'}`}
          >
            {!message.isUser && (
              <>
                <div className='avatar'>
                  <Sigil config={config} />
                </div>
                <div  
                  id='bubble'
                  className={`message-bubble ${message.isUser ? 'user-bubble' : 'other-bubble'}`}>
                  <span id="sigil" className="message-point-user">{config.point}</span>
                  {message.text}
                </div>
              </>
            )}
            {message.isUser && (
              <>
                <div className='avatar'>
                  <Sigil config={{ ...config, point: props.sigil }} />
                </div>
                <div
                  // onClick={() => setEmojiPickerMessageId(message.id)} // Set message ID to show EmojiPicker
                  id='bubble'
                  // style={{cursor: 'pointer', paddingTop: '5px', paddingLeft: '2px'}}
                  className={`message-bubble ${message.isUser ? 'user-bubble' : 'other-bubble'}`}
                >
                  <span id="sigil" className="message-point">{props.sigil}</span>
                  {message.text}
                </div>
                <SigilMarquee sigils={message.sigils.filter((sigil: any) => sigil !== props.sigil)}/>
                <br />
                <EmojiTotem emojis={message.emojis} />
              </>
            )}
          </div>
        ))}
      </div>
  
      {emojiPickerMessageId && (
        <div className="emoji-picker-overlay">
          <EmojiPicker onEmojiClick={handleEmojiClick} /> {/* Handle emoji click */}
        </div>
      )}
  
      <div className="input-container">
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="message-input"
          onClick={() => setEmojiPickerMessageId(null)}
        />
        <button className='button-send' onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}


const SignIn = (props: any) => {

  const { setOpenConnectModal } = useOpenConnectModal()
 
  const { isConnected } = useAccount()
  useEffect(() => {
    if(isConnected){
      props.setIsSignedIn(true)
    }
  }, [isConnected])

  const handleSignIn = () => {
    console.log('signing in')
    setOpenConnectModal(true)
  }

  return(<>
  <h2 style={{color: 'black'}}>nova-host</h2>
  <p style={{color: 'black'}}>a public on-usb chat with urbiters</p>
  <br/>
  <button onClick={handleSignIn}>Sign in</button>
  </>)
}

function App() {
  const [_, setIsSignedIn] = useState(0)
  const [embeddedWalletAddress, setEmbeddedWalletAddress] = useState<any>('')
  const {address} = useAccount()
  const {disconnect} = useDisconnect()
  const [sigil, setSigil] = useState(null)

  return (
    <>
    {address && <p style={{ color: 'black', cursor: 'pointer',position:'fixed', top: '30px', right:'30px'}} onClick={() => {
      setEmbeddedWalletAddress(null)
      disconnect()}}>
      sign out
    </p>}
    {address && <p style={{ color: 'black', cursor: 'pointer',position:'fixed', top: '30px', left:'30px'}}>
      {embeddedWalletAddress.slice(0,10)}...{embeddedWalletAddress.slice(embeddedWalletAddress.length - 10,embeddedWalletAddress.length)}
    </p>}
      {!address ? 
        <SignIn setIsSignedIn={setIsSignedIn}/>
      :
        <Chat sigil={sigil} setEmbeddedWalletAddress={setEmbeddedWalletAddress} setSigil={setSigil} address={address}/>
      }
    </>
  )
}

export default App
