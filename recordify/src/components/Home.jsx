import React, { useState, useRef, useEffect } from "react";
import hexaIcon from "../images/thehexatownlogo.jpg";
import { toast } from 'react-toastify';

const Home = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [startTimer, setStartTimer] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(5);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const recordingTimeoutRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    const getWebcamStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    getWebcamStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      clearInterval(recordingIntervalRef.current);
    };
  }, []);

  const startRecordingHandler = async () => {
    if (!streamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      } catch (error) {
        console.error("Error accessing webcam for recording:", error);
        return;
      }
    }

    setStartTimer(true);
    let count = 3;
    setCountdown(count);
    timerRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(timerRef.current);
        startMediaRecorder(streamRef.current);
      }
    }, 1000);
  };

  const startMediaRecorder = (stream) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp8,opus",
    });
    setMediaRecorder(recorder);

    const chunks = [];
    recorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const videoUrl = URL.createObjectURL(blob);

      setVideoBlob(blob);
      setVideoUrl(videoUrl);
      setIsRecording(false);
      setRecordingTimeLeft(10);
    };

    recorder.start();
    setIsRecording(true);
    setStartTimer(false);

    // Start the 5-min countdown
    setRecordingTimeLeft(5);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(recordingIntervalRef.current);
        }
        return prev - 1;
      });
    }, 1000);

    // Auto stop record
    recordingTimeoutRef.current = setTimeout(() => {
      stopRecordingHandler();
    }, 5000);
  };

  const stopRecordingHandler = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    clearTimeout(recordingTimeoutRef.current);
    clearInterval(recordingIntervalRef.current);
  };

  const reRecordHandler = async () => {
    setVideoBlob(null);
    setVideoUrl(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing webcam for re-record:", error);
    }
  };

  const submitHandler = async () => {
    if (!videoBlob) return;

    const videoFile = new File([videoBlob], "video.webm", {
      type: "video/webm",
    });

    const formData = new FormData();
    formData.append("video", videoFile);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.success("Video uploaded successfully!");

      } else {
        toast.error("Failed to upload video");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Error uploading video");
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  };
  

  return (
    <div className="min-h-screen bg-gray-200">
      <header className="bg-gray-600 text-white py-4">
        <div className="container mx-auto px-4 flex items-center space-x-2">
          <img src={hexaIcon} alt="Company Logo" className="h-9 w-9 rounded" />
          <h1 className="text-2xl font-bold">TheHexaTown</h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="col-span-1 bg-white shadow-md rounded-md p-4 ">
            <h2 className="text-xl text-center font-bold mb-4 ">Questionnaire</h2>
            <ul className="space-y-2">
              <li className="p-2 bg-gray-50 rounded-md shadow">Introduce yourself</li>
              <li className="p-2 bg-gray-50 rounded-md shadow">What is OOP</li>
              <li className="p-2 bg-gray-50 rounded-md shadow"> Describe DSA</li>
              <li className="p-2 bg-gray-50 rounded-md shadow">DB CRUD Queries</li>
              <li className="p-2 bg-gray-50 rounded-md shadow">REACT HOOKS</li>
              <li className="p-2 bg-gray-50 rounded-md shadow"> FYP Project</li>
            </ul>
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-white shadow-md rounded-md p-4 flex flex-col items-center justify-center">
            <div className="relative max-w-xl mx-auto">
              <video
                className={`rounded-md shadow ${
                  videoUrl && !isRecording ? "hidden" : ""
                }`}
                ref={videoRef}
                autoPlay
                playsInline
                muted
              />

              {startTimer && (
                <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center items-center bg-black bg-opacity-50 text-white text-4xl">
                  {countdown}
                </div>
              )}

              {isRecording && (
                <div className="absolute top-2 right-2 text-xl text-white bg-black bg-opacity-70 px-2 py-1 rounded">
                  Time Left: {formatTime(recordingTimeLeft)}
                </div>
              )}

              {videoUrl && !isRecording && (
                <div className="mt-4">
                  <video
                    src={videoUrl}
                    controls
                    className="rounded-md shadow"
                    width="100%"
                    height="auto"
                  />
                  <div className="flex justify-center space-x-4 mt-4">
                    <button
                      onClick={reRecordHandler}
                      className="bg-blue-600 text-white py-2 px-4 rounded"
                    >
                      Re-record
                    </button>
                    <button
                      onClick={submitHandler}
                      className="bg-green-600 text-white py-2 px-4 rounded"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              {isRecording ? (
                <button
                  onClick={stopRecordingHandler}
                  className="bg-red-600 text-white py-2 px-4 rounded"
                >
                  Stop Recording
                </button>
              ) : (
                !videoUrl && (
                  <button
                    onClick={startRecordingHandler}
                    className="bg-green-600 text-white py-2 px-4 rounded"
                  >
                    Start Recording
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
