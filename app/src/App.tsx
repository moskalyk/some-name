import { useState, useRef, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import '@urbit/sigil-js'
import './App.css'
import {ethers} from 'ethers'
import sequence from './SequenceEmbeddedWallet'
import { useOpenConnectModal } from '@0xsequence/kit'
import { useDisconnect, useAccount } from 'wagmi'
import EmojiPicker from 'emoji-picker-react';

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

const Sigil = ({ config }: any) => {
  return (
    // @ts-ignore
    <urbit-sigil {...config} />
  )
 }


const YourComponent = (props: any) => {
  const [scrollAmount, setScrollAmount] = useState(0); // Initial slow scroll amount
  const [emojis, setEmojis] = useState<any>(null);

  useEffect(() => {
    if (scrollAmount && props.emoji) {
      // When scrollAmount changes, update the emojis with the marquee
      setEmojis(
        <marquee
          style={{ height: "50px" }}
          direction="down"
          scrollAmount={scrollAmount} // Proper camelCase for JSX
        >
          {props.emoji}<span style={{fontSize: '10px'}}>x2</span>
        </marquee>
      );
    } 
    else {
      setEmojis(null);
    }
  }, [scrollAmount]);

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


const Chat = (props: any) => {
  const chatContainerRef: any = useRef(null);
  const [emojiPickerMessageId, setEmojiPickerMessageId] = useState(null); // Track which message is getting the emoji picker
  const [messages, setMessages] = useState([
    { text: '☆ ☆ ☆ Welcome ☆ ☆ ☆', id: 1, isUser: false, emoji: null },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const textareaRef: any = useRef(null);

  const handleSend = () => {
    if (newMessage.trim() !== '') {
      const newId = messages.length + 1;
      setMessages([...messages, { text: newMessage, id: newId, isUser: true, emoji: null }]);
      setNewMessage('');
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `10px`;
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
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.id === emojiPickerMessageId ? { ...message, emoji: emoji.emoji } : message
        )
      );
      setEmojiPickerMessageId(null); // Close the emoji picker
    }
  };

  useEffect(() => {

    // Connect to the Ethereum mainnet
    const provider = new ethers.providers.JsonRpcProvider(
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
          console.log(json.sessionTicket)
          const response = await sequence.signIn(
            {
              playFabTitleId: import.meta.env.VITE_PLAYFAB_TITLE_ID,
              playFabSessionTicket: json.sessionTicket
            },
            'playfab session'
          )

          props.setEmbeddedWalletAddress(response.wallet)
      });
    }
    
    // Replace with the Ethereum address you want to check
    const addressToCheck = '0xc48835421ce2651BC5F78Ee59D1e10244753c7FC';
    findUrbitId(addressToCheck);
    
  }, [])

  useEffect(() => {
    // Scroll to the bottom whenever messages are updated
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chat-container">
      <div className='messages-container' ref={chatContainerRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message-container ${message.isUser ? 'user' : 'other'}`}
          >
            {!message.isUser && (
              <>
                <div className='avatar'>
                  <Sigil config={config} />
                </div>
                <div className={`message-bubble ${message.isUser ? 'user-bubble' : 'other-bubble'}`}>
                  <span className="message-point-user">{config.point}</span>
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
                  onClick={() => setEmojiPickerMessageId(message.id)} // Set message ID to show EmojiPicker
                  className={`message-bubble ${message.isUser ? 'user-bubble' : 'other-bubble'}`}
                >
                  <span className="message-point">{props.sigil}</span>
                  {message.text}
                </div>
                <br />
                <YourComponent emoji={message.emoji} />
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
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};


const SignIn = (props: any) => {

  const { setOpenConnectModal } = useOpenConnectModal()
 
  const { isConnected } = useAccount()
  const { disconnect } = useDisconnect()

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
  <h2 style={{color: 'black'}}>some-name</h2>
  <p style={{color: 'black'}}>a public onchain chat with urbiters</p>
  <br/>
  <button onClick={handleSignIn}>Sign in</button>
  </>)
}

function App() {
  const [isSignedIn, setIsSignedIn] = useState(0)
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
      {embeddedWalletAddress}
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
