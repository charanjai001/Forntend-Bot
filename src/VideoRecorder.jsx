import React, { useState, useRef } from 'react';
//import './VideoRecorder.css'; // Import CSS file
import videoIcon from './video-icon.png'; // Import the video icon image

const VideoRecorder = () => {
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [videoURL, setVideoURL] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef(null);

  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prevChunks) => [...prevChunks, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Error accessing webcam. Please make sure your webcam is connected and accessible.');
    }
  };

  const stopCapture = () => {
    videoRef.current.srcObject.getTracks().forEach(track => track.stop());

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    setVideoURL(url); // Set video URL for displaying as a link
    // Send recorded video data to backend
    saveVideoToBackend(blob);
  };

  const saveVideoToBackend = async (blob) => {
    try {
      const formData = new FormData();
      formData.append('video', blob, 'webcam-recorded-video.webm');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        console.log('Video uploaded successfully');
      } else {
        console.error('Failed to upload video');
      }
    } catch (error) {
      console.error('Error uploading video:', error);
    }
  };

  return (
    <div>
      <div className="Container">
        <video ref={videoRef} id="webcamVideo" autoPlay />
      </div>
      <div className="ButtonContainer">
        <button onClick={isRecording ? stopCapture : startCapture}>
          <img src={videoIcon} alt="Video Icon" />
        </button>
        {/* Display video link if recording is stopped and videoURL is available */}
        {!isRecording && videoURL && (
          <a className="download-link" href={videoURL} download="webcam-recorded-video.webm">
          Download Recorded Video
        </a>
        
        )}
      </div>
    </div>
  );
};

export default VideoRecorder;
