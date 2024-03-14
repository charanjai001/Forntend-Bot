import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import VideoRecorder from "./VideoRecorder";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const getUserIdFromUrl = () => {
      const path = window.location.pathname;
      const userIdFromUrl = path.split("/").pop();
      if (userIdFromUrl) {
        setUserId(userIdFromUrl);
      }
    };
    getUserIdFromUrl();
  }, []);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      setIsSpeechRecognitionSupported(true);
      const recognitionInstance = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognitionInstance.maxAlternatives = 5;
      setRecognition(recognitionInstance);
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (recognition) {
      if (isTyping) {
        recognition.stop();
      } else {
        setIsTyping(true);

        const currentMessage = message;
        const uniqueWordsSet = new Set(currentMessage.toLowerCase().split(' '));

        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let newWords = "";

          var interimTranscripts = "";
          var finalTranscripts = "";
          for(var i=event.resultIndex; i<event.results.length; i++){
            var transcript = event.results[i][0].transcript;
            transcript.replace("\n", "<br>");
            if(event.results[i].isFinal){
              finalTranscripts = transcript;
            }
            else{
              interimTranscripts += transcript;
            }
          }

          setMessage(prevMessage => prevMessage + finalTranscripts);
          adjustTextareaHeight();
        };

        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onend = () => {
          setIsTyping(false);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsTyping(false);
        };

        recognition.start();
      }
    }
  };

  useEffect(() => {
    if (!isTyping) {
      setMessage("");
    }
  }, [isTyping]);

  const chat = async (e, message) => {
    e.preventDefault();
    if (!message) return;
    setIsTyping(true);
    scrollTo(0, 1e10);
    let msgs = chats;
    msgs.push({ role: "user", content: message });
    setChats(msgs);
    setMessage("");
    fetch("http://localhost:8000/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: userId,
        chats: chats,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        msgs.push(data.output);
        setChats(msgs);
        setIsTyping(false);
        scrollTo(0, 1e10);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chat(e, message);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <main>
      <h1>GenAI C.I.B</h1>
      <section>
        {chats && chats.length
          ? chats.map((chat, index) => (
              <p key={index} className={chat.role === "user" ? "user_msg" : ""}>
                <span>
                  <b>{chat.role.toUpperCase()}</b>
                </span>
                <span>:</span>
                <span>{chat.content}</span>
              </p>
            ))
          : ""}
      </section>
      <div className={isTyping ? "" : "hide"}>
        <p>
          <i>{isTyping ? "Typing" : ""}</i>
        </p>
      </div>
      <form action="" onSubmit={(e) => chat(e, message)}>
        <textarea
          ref={textareaRef}
          name="message"
          value={message}
          placeholder="Type a message here and hit Enter..."
          onChange={(e) => {
            setMessage(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="send-button">
          <img src="assets/right-arrow.png" alt="Send" className="send-icon" />
        </button>
        {isSpeechRecognitionSupported && (
          <div className="mic-button-container">
            <img
              src="assets/mic-icon.png"
              alt="Mic"
              className={`mic-button ${isTyping ? 'active' : ''}`}
              onClick={toggleSpeechRecognition}
            />
          </div>
        )}
      </form>
      <VideoRecorder />
    </main>
  );
}

export default App;
