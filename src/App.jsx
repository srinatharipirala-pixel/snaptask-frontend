import React, { useState } from 'react';
import { CheckCircle, Circle, Trophy, MessageSquare, User, Settings, Home, Target, Upload, Sparkles, Clock, TrendingUp } from 'lucide-react';

export default function SnapTaskWebsite() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: "Hi! I'm your SnapTask AI assistant. Ask me about your homework or set your goals for today!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [showAIAnimation, setShowAIAnimation] = useState(false);
  const [aiAnimationStep, setAiAnimationStep] = useState(0);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [groqApiKey, setGroqApiKey] = useState('');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, subject: 'Mathematics', task: 'Complete exercises 5.1 to 5.3 from textbook', dueDate: 'Today', completed: false, priority: 'urgent' },
    { id: 2, subject: 'Science', task: 'Write lab report on photosynthesis experiment', dueDate: 'Tomorrow', completed: false, priority: 'high' },
    { id: 3, subject: 'English', task: 'Read Chapter 7 and answer comprehension questions', dueDate: 'Today', completed: true, priority: 'urgent' },
    { id: 4, subject: 'History', task: 'Research and create timeline of World War II events', dueDate: 'Friday', completed: false, priority: 'medium' },
    { id: 5, subject: 'Competition Reminder', task: 'Science fair competition tomorrow at 9 AM', dueDate: 'Tomorrow', completed: false, priority: 'high' }
  ]);

  const productivityScore = 87;
  const totalPoints = 2450;
  const completedToday = tasks.filter(t => t.completed && t.dueDate === 'Today').length;
  const totalToday = tasks.filter(t => t.dueDate === 'Today').length;

  React.useEffect(() => {
    try {
      const savedKey = localStorage.getItem('snaptask_groq_key');
      if (savedKey) setGroqApiKey(savedKey);
    } catch (error) {
      console.log('Could not load saved API key');
    }
  }, []);

  const saveApiKey = (key) => {
    setGroqApiKey(key);
    try {
      if (key && key.trim()) {
        localStorage.setItem('snaptask_groq_key', key.trim());
      } else {
        localStorage.removeItem('snaptask_groq_key');
      }
    } catch (error) {
      console.log('Could not save API key');
    }
  };

  const handlePinRecording = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file extension
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.flac', '.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.ogg', '.opus', '.wav', '.webm'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      alert('Please select an audio file. Supported formats: FLAC, MP3, MP4, MPEG, MPGA, M4A, OGG, OPUS, WAV, WEBM');
      return;
    }

    if (!groqApiKey || !groqApiKey.trim()) {
      alert('⚠️ Please add your Groq API key in Settings first! The same key works for both transcription and task extraction.');
      return;
    }

    setIsProcessingFile(true);
    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // Step 1: Convert to MP3 if it's a WAV file
      const uploadInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 40) {
            clearInterval(uploadInterval);
            return 40;
          }
          return prev + 8;
        });
      }, 200);

      let audioToUpload = file;
      let uploadFileName = file.name;
      
      if (fileName.endsWith('.wav')) {
        try {
          console.log('Converting WAV to MP3...');
          const mp3Blob = await convertWavToMp3(file);
          audioToUpload = new File([mp3Blob], file.name.replace('.wav', '.mp3'), { type: 'audio/mpeg' });
          uploadFileName = audioToUpload.name;
          console.log('Conversion successful!');
        } catch (conversionError) {
          console.error('MP3 conversion failed:', conversionError);
          // Try original file as fallback
          console.log('Using original WAV file...');
        }
      }

      clearInterval(uploadInterval);
      setSyncProgress(50);

      // Step 2: Transcribe audio using Groq Whisper
      const formData = new FormData();
      formData.append('file', audioToUpload, uploadFileName);
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'json');
      formData.append('language', 'en');
      formData.append('temperature', '0');

      const transcriptionResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: formData
      });

      setSyncProgress(75);

      if (!transcriptionResponse.ok) {
        const errorData = await transcriptionResponse.json();
        throw new Error(errorData.error?.message || `Transcription failed: ${transcriptionResponse.status}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcript = transcriptionData.text;

      if (!transcript || transcript.trim().length === 0) {
        throw new Error('No speech detected in the audio file. Please try recording again with clearer audio.');
      }

      setSyncProgress(100);

      setTimeout(() => {
        setIsSyncing(false);
        setShowSyncSuccess(true);

        setTimeout(() => {
          setShowSyncSuccess(false);
          // Step 3: Process with Groq AI to extract tasks
          processWithGroqAI(transcript);
        }, 1000);
      }, 500);

    } catch (error) {
      console.error('Error processing audio file:', error);
      alert(`❌ Error: ${error.message}\n\nPlease try:\n• Recording again with clearer audio\n• Checking your internet connection\n• Verifying your Groq API key`);
      setIsSyncing(false);
      setIsProcessingFile(false);
      setSyncProgress(0);
    }
  };

  // Convert WAV to MP3 using Web Audio API and lamejs
  const convertWavToMp3 = async (wavFile) => {
    return new Promise(async (resolve, reject) => {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const fileReader = new FileReader();

        fileReader.onload = async (e) => {
          try {
            const arrayBuffer = e.target.result;
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Convert to mono and resample to 44100 Hz for better compatibility
            const sampleRate = 44100;
            const numberOfChannels = 1; // Mono
            const length = audioBuffer.duration * sampleRate;
            
            const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);
            const source = offlineContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(offlineContext.destination);
            source.start(0);
            
            const renderedBuffer = await offlineContext.startRendering();
            
            // Get audio samples
            const samples = renderedBuffer.getChannelData(0);
            
            // Convert float samples to 16-bit PCM
            const pcmSamples = new Int16Array(samples.length);
            for (let i = 0; i < samples.length; i++) {
              const s = Math.max(-1, Math.min(1, samples[i]));
              pcmSamples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            // Encode to MP3 using lamejs (inline implementation)
            const mp3Data = encodeToMp3(pcmSamples, sampleRate);
            const mp3Blob = new Blob(mp3Data, { type: 'audio/mpeg' });
            
            resolve(mp3Blob);
          } catch (error) {
            reject(error);
          }
        };

        fileReader.onerror = () => reject(new Error('Failed to read audio file'));
        fileReader.readAsArrayBuffer(wavFile);
      } catch (error) {
        reject(error);
      }
    });
  };

  // Simple MP3 encoder (using lamejs library loaded from CDN)
  const encodeToMp3 = (samples, sampleRate) => {
    // Load lamejs from CDN if not already loaded
    if (!window.lamejs) {
      throw new Error('MP3 encoder not loaded');
    }
    
    const mp3encoder = new window.lamejs.Mp3Encoder(1, sampleRate, 128);
    const mp3Data = [];
    
    const sampleBlockSize = 1152;
    for (let i = 0; i < samples.length; i += sampleBlockSize) {
      const sampleChunk = samples.subarray(i, i + sampleBlockSize);
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    }
    
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
    
    return mp3Data;
  };

  // Load lamejs library
  React.useEffect(() => {
    if (!window.lamejs) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.min.js';
      script.async = true;
      script.onload = () => console.log('MP3 encoder loaded');
      script.onerror = () => console.warn('MP3 encoder failed to load');
      document.head.appendChild(script);
    }
  }, []);

  // Load lamejs library
  React.useEffect(() => {
    if (!window.lamejs) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.min.js';
      script.async = true;
      script.onload = () => console.log('MP3 encoder loaded');
      script.onerror = () => console.warn('MP3 encoder failed to load');
      document.head.appendChild(script);
    }
  }, []);

  const processWithGroqAI = async (transcript) => {
    setShowAIAnimation(true);
    setAiAnimationStep(0);
    setTimeout(() => setAiAnimationStep(1), 1000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `Extract tasks and return ONLY valid JSON: {"tasks": [{"subject": "Name", "task": "Description", "dueDate": "Today/Tomorrow/Day", "priority": "urgent/high/medium/low"}], "summary": "Helpful summary"}`
            },
            { role: 'user', content: `Recording: "${transcript}"` }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API Error');

      const cleaned = data.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedData = JSON.parse(cleaned);

      setTimeout(() => setAiAnimationStep(2), 2000);

      const extractedData = {
        transcript,
        extractedTasks: parsedData.tasks || [],
        aiSummary: parsedData.summary || "Tasks extracted!",
        timestamp: new Date().toLocaleTimeString()
      };

      window.currentRecordingData = extractedData;
      
      extractedData.extractedTasks.forEach((task, index) => {
        setTimeout(() => setAiAnimationStep(3 + index), 4000 + (index * 1000));
      });

      const finalStep = 3 + extractedData.extractedTasks.length;
      setTimeout(() => {
        setAiAnimationStep(finalStep);
        const maxId = Math.max(...tasks.map(t => t.id), 0);
        const newTasks = extractedData.extractedTasks.map((task, idx) => ({
          ...task,
          id: maxId + idx + 1,
          completed: false
        }));
        setTasks(prev => [...newTasks, ...prev]);
        setChatMessages(prev => [...prev, 
          { type: 'bot', text: `🎤 Recording processed at ${extractedData.timestamp}!` },
          { type: 'bot', text: `✨ ${extractedData.aiSummary}` }
        ]);
      }, 4000 + (extractedData.extractedTasks.length * 1000) + 1000);

      setTimeout(() => {
        setAiAnimationStep(finalStep + 1);
        setTimeout(() => {
          setShowAIAnimation(false);
          setAiAnimationStep(0);
          setIsProcessingFile(false);
          delete window.currentRecordingData;
        }, 2000);
      }, 4000 + (extractedData.extractedTasks.length * 1000) + 3000);

    } catch (error) {
      alert(`AI Error: ${error.message}. Using demo mode.`);
      setShowAIAnimation(false);
      const extractedData = extractTasksFromTranscript(transcript);
      setTimeout(() => {
        setShowAIAnimation(true);
        setAiAnimationStep(0);
        animateAIProcessingWithData(extractedData);
      }, 500);
    }
  };

  const extractTasksFromTranscript = (transcript) => {
    const tasks = [];
    const subjects = ['math', 'mathematics', 'science', 'chemistry', 'physics', 'english', 'history', 'art'];
    const sentences = transcript.split(/[.!?,]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase();
      let subject = 'General';
      for (const s of subjects) {
        if (lower.includes(s)) {
          subject = s.charAt(0).toUpperCase() + s.slice(1);
          break;
        }
      }
      
      if (lower.includes('homework') || lower.includes('complete') || lower.includes('write')) {
        let dueDate = 'This Week';
        let priority = 'medium';
        if (lower.includes('today')) { dueDate = 'Today'; priority = 'urgent'; }
        else if (lower.includes('tomorrow')) { dueDate = 'Tomorrow'; priority = 'high'; }
        
        tasks.push({ subject, task: sentence.trim(), dueDate, priority });
      }
    });
    
    return {
      transcript,
      extractedTasks: tasks.length > 0 ? tasks : [{ subject: 'General', task: transcript, dueDate: 'This Week', priority: 'medium' }],
      aiSummary: `Found ${tasks.length} task${tasks.length !== 1 ? 's' : ''}!`,
      timestamp: new Date().toLocaleTimeString()
    };
  };

  const animateAIProcessingWithData = (recordingData) => {
    window.currentRecordingData = recordingData;
    setAiAnimationStep(0);
    setTimeout(() => setAiAnimationStep(1), 1000);
    setTimeout(() => setAiAnimationStep(2), 3000);
    
    recordingData.extractedTasks.forEach((task, index) => {
      setTimeout(() => setAiAnimationStep(3 + index), 5000 + (index * 1000));
    });
    
    const finalStep = 3 + recordingData.extractedTasks.length;
    setTimeout(() => {
      setAiAnimationStep(finalStep);
      const maxId = Math.max(...tasks.map(t => t.id), 0);
      const newTasks = recordingData.extractedTasks.map((task, idx) => ({
        ...task,
        id: maxId + idx + 1,
        completed: false
      }));
      setTasks(prev => [...newTasks, ...prev]);
      setChatMessages(prev => [...prev, 
        { type: 'bot', text: `🎤 Recording processed at ${recordingData.timestamp}!` },
        { type: 'bot', text: `✨ ${recordingData.aiSummary}` }
      ]);
    }, 5000 + (recordingData.extractedTasks.length * 1000) + 1000);
    
    setTimeout(() => {
      setAiAnimationStep(finalStep + 1);
      setTimeout(() => {
        setShowAIAnimation(false);
        setAiAnimationStep(0);
        setIsProcessingFile(false);
        delete window.currentRecordingData;
      }, 2000);
    }, 5000 + (recordingData.extractedTasks.length * 1000) + 3000);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setChatInput('');

    if (groqApiKey && groqApiKey.trim().length > 0) {
      setChatMessages(prev => [...prev, { type: 'bot', text: '💭 Thinking...' }]);
      
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: `You are a helpful homework assistant. Current tasks:\n${tasks.map(t => `- ${t.subject}: ${t.task} (${t.dueDate}, ${t.completed ? 'Done' : 'Pending'})`).join('\n')}\n\nBe friendly and concise.`
              },
              { role: 'user', content: userMessage }
            ],
            temperature: 0.7,
            max_tokens: 300
          })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'API Error');

        setChatMessages(prev => {
          const filtered = prev.filter(msg => msg.text !== '💭 Thinking...');
          return [...filtered, { type: 'bot', text: data.choices[0].message.content }];
        });
      } catch (error) {
        setChatMessages(prev => {
          const filtered = prev.filter(msg => msg.text !== '💭 Thinking...');
          return [...filtered, { type: 'bot', text: `⚠️ Error: ${error.message}` }];
        });
      }
    } else {
      const lower = userMessage.toLowerCase();
      let response = "I'm here to help! Ask about homework, tips, or productivity.";
      if (lower.includes('homework') || lower.includes('task')) {
        const pending = tasks.filter(t => !t.completed);
        response = `You have ${pending.length} pending tasks. Focus on ${pending[0]?.subject || 'your work'} first!`;
      } else if (lower.includes('tip')) {
        response = "Break down large tasks into smaller steps. Start with the easiest!";
      }
      setChatMessages(prev => [...prev, { type: 'bot', text: response }]);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent': return 'bg-red-100 border-red-400 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'medium': return 'bg-blue-100 border-blue-400 text-blue-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      <style>{`
        @keyframes slide-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce-in { 0% { opacity: 0; transform: scale(0.3) translateY(-100px); } 50% { opacity: 1; transform: scale(1.05); } 100% { transform: scale(1); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-in { animation: slide-in 0.5s ease-out; }
        .animate-scale-in { animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>

      <header className="bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-8 h-8">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#C2410C" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#C2410C" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="15" fill="none" stroke="#C2410C" strokeWidth="8"/>
                  <circle cx="50" cy="50" r="6" fill="#C2410C"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold">SnapTask</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              <label className="flex items-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all shadow-lg bg-purple-500 hover:bg-purple-600 hover:shadow-xl transform hover:scale-105 cursor-pointer">
                <Upload className="w-5 h-5" />
                <span>📌 Pin Recording</span>
                <input type="file" accept="audio/*" onChange={handlePinRecording} className="hidden" disabled={isProcessingFile} />
              </label>
              <div className="flex items-center space-x-2 bg-blue-800 px-4 py-2 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold">{totalPoints} pts</span>
              </div>
              <button onClick={() => setShowApiSettings(!showApiSettings)} className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg">
                <Settings className="w-5 h-5" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {isSyncing && (
        <div className="bg-purple-600 text-white">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center space-x-3">
              <Upload className="w-5 h-5 animate-pulse" />
              <div className="flex-grow">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Processing Pin recording...</span>
                  <span className="text-sm font-medium">{syncProgress}%</span>
                </div>
                <div className="w-full bg-purple-800 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full transition-all duration-200" style={{ width: `${syncProgress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSyncSuccess && (
        <div className="bg-green-500 text-white">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">✨ Pin recording uploaded! AI processing...</span>
            </div>
          </div>
        </div>
      )}

      {showApiSettings && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="container mx-auto px-6 py-4">
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Groq AI Settings</span>
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                type="password"
                value={groqApiKey}
                onChange={(e) => setGroqApiKey(e.target.value)}
                placeholder="Enter Groq API key"
                className="flex-grow w-full px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    saveApiKey(groqApiKey);
                    alert(groqApiKey.trim() ? '✅ API Key saved!' : '⚠️ Key cleared.');
                    setShowApiSettings(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold"
                >
                  Save
                </button>
                <button onClick={() => setShowApiSettings(false)} className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold">
                  Cancel
                </button>
              </div>
            </div>
            <p className="text-sm text-indigo-100 mt-2">
              {groqApiKey ? '🤖 Real AI Active' : '🎭 Demo Mode - Get key at groq.com'}
            </p>
          </div>
        </div>
      )}

      {showAIAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">SnapTask AI</h3>
                  <p className="text-purple-100">Processing recording...</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {aiAnimationStep >= 0 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg flex-grow border border-purple-200">
                    <p className="text-gray-800">Received your recording!</p>
                  </div>
                </div>
              )}

              {aiAnimationStep >= 1 && window.currentRecordingData && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg flex-grow border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-2">📝 Transcript:</p>
                    <p className="text-gray-700 italic">"{window.currentRecordingData.transcript}"</p>
                  </div>
                </div>
              )}

              {aiAnimationStep >= 2 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center animate-spin">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg flex-grow border border-yellow-200">
                    <p className="text-gray-800">🧠 Extracting tasks...</p>
                  </div>
                </div>
              )}

              {window.currentRecordingData && window.currentRecordingData.extractedTasks.map((task, index) => {
                if (aiAnimationStep >= 3 + index) {
                  return (
                    <div key={index} className="flex items-start space-x-3 animate-slide-in">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg flex-grow border border-green-200">
                        <p className="font-semibold text-green-900 mb-2">✅ Task {index + 1}:</p>
                        <p className="text-gray-800"><strong>{task.subject}:</strong> {task.task}</p>
                        <p className="text-sm text-gray-600 mt-1">Due: {task.dueDate} | Priority: {task.priority.toUpperCase()}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {aiAnimationStep >= (3 + (window.currentRecordingData?.extractedTasks?.length || 0)) && window.currentRecordingData && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg flex-grow border border-indigo-200">
                    <p className="font-semibold text-indigo-900 mb-2">💡 AI Summary:</p>
                    <p className="text-gray-800">{window.currentRecordingData.aiSummary}</p>
                  </div>
                </div>
              )}

              {aiAnimationStep >= (4 + (window.currentRecordingData?.extractedTasks?.length || 0)) && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg flex-grow border border-green-200">
                    <p className="text-gray-800 font-semibold">✅ All tasks added to dashboard!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center space-x-2 px-6 py-4 font-semibold ${activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button onClick={() => setActiveTab('chat')} className={`flex items-center space-x-2 px-6 py-4 font-semibold ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
              <MessageSquare className="w-5 h-5" />
              <span>AI Chat</span>
            </button>
            <button onClick={() => setActiveTab('goals')} className={`flex items-center space-x-2 px-6 py-4 font-semibold ${activeTab === 'goals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}>
              <Target className="w-5 h-5" />
              <span>Goals</span>
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Productivity Score</p>
                    <p className="text-4xl font-bold">{productivityScore}%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Today's Progress</p>
                    <p className="text-4xl font-bold">{completedToday}/{totalToday}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-200" />
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Total Points</p>
                    <p className="text-4xl font-bold">{totalPoints}</p>
                  </div>
                  <Trophy className="w-12 h-12 text-purple-200" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📚 Your Tasks</h2>
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className={`border-2 rounded-lg p-4 transition-all ${task.completed ? 'bg-gray-50 border-gray-300 opacity-60' : 'bg-white border-gray-200 hover:shadow-md'}`}>
                    <div className="flex items-start space-x-3">
                      <button onClick={() => toggleTask(task.id)} className="mt-1 flex-shrink-0">
                        {task.completed ? <CheckCircle className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />}
                      </button>
                      <div className="flex-grow">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-blue-600">{task.subject}</span>
                          <span className={`text-xs px-3 py-1 rounded-full font-bold ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'urgent' ? '🔴 URGENT' : task.priority === 'high' ? '🟠 HIGH' : task.priority === 'medium' ? '🔵 MEDIUM' : '⚪ LOW'}
                          </span>
                        </div>
                        <p className={`text-gray-800 ${task.completed ? 'line-through' : ''}`}>{task.task}</p>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Due: {task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">💬 AI Assistant Chat</h2>
              {groqApiKey ? (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold">🤖 Real AI Active</span>
              ) : (
                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">🎭 Demo Mode</span>
              )}
            </div>
            <div className="border rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-gray-50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`mb-3 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-lg p-3 ${msg.type === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about your homework..."
                className="flex-grow border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={sendMessage} className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                Send
              </button>
            </div>
            {!groqApiKey && (
              <p className="text-sm text-gray-500 mt-2 text-center">💡 Add your Groq API key in Settings for real AI responses!</p>
            )}
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🎯 Your Goals</h2>
            <div className="space-y-6">
              <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50">
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Daily Goal</h3>
                <p className="text-gray-700 mb-4">Complete {totalToday} tasks today</p>
                <div className="w-full bg-blue-200 rounded-full h-4">
                  <div className="bg-blue-600 h-4 rounded-full transition-all" style={{ width: `${(completedToday / totalToday) * 100}%` }}></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{completedToday} of {totalToday} completed ({Math.round((completedToday / totalToday) * 100)}%)</p>
              </div>

              <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
                <h3 className="text-xl font-semibold text-purple-900 mb-2">Weekly Challenge</h3>
                <p className="text-gray-700 mb-4">Maintain 90%+ productivity score for 7 days</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div key={day} className={`w-10 h-10 rounded-full flex items-center justify-center ${day <= 4 ? 'bg-purple-500 text-white' : 'bg-purple-200 text-purple-400'}`}>
                      {day <= 4 ? '✓' : day}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">4 of 7 days completed</p>
              </div>

              <div className="border-2 border-yellow-200 rounded-lg p-6 bg-yellow-50">
                <h3 className="text-xl font-semibold text-yellow-900 mb-2">🏆 Rewards Available</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded border border-yellow-300">
                    <span className="text-gray-800">100 Robux Coupon</span>
                    <span className="text-sm text-gray-600">3,000 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border border-yellow-300">
                    <span className="text-gray-800">Custom Avatar Badge</span>
                    <span className="text-sm text-gray-600">1,500 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded border border-yellow-300">
                    <span className="text-gray-800">Premium Theme Unlock</span>
                    <span className="text-sm text-gray-600">2,000 pts</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">You have {totalPoints} points. Keep completing tasks to earn more rewards!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}