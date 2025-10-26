import React, { useState } from 'react';
import { CheckCircle, Circle, Trophy, MessageSquare, User, Settings, Home, Target, Zap, Usb, Mic, Upload, Sparkles, Clock, TrendingUp } from 'lucide-react';

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
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTranscript, setRecordedTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [groqApiKey, setGroqApiKey] = useState('');
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, subject: 'Mathematics', task: 'Complete exercises 5.1 to 5.3 from textbook', dueDate: 'Today', completed: false, priority: 'high' },
    { id: 2, subject: 'Science', task: 'Write lab report on photosynthesis experiment', dueDate: 'Tomorrow', completed: false, priority: 'high' },
    { id: 3, subject: 'English', task: 'Read Chapter 7 and answer comprehension questions', dueDate: 'Today', completed: true, priority: 'medium' },
    { id: 4, subject: 'History', task: 'Research and create timeline of World War II events', dueDate: 'Friday', completed: false, priority: 'medium' },
    { id: 5, subject: 'Competition Reminder', task: 'Science fair competition tomorrow at 9 AM', dueDate: 'Tomorrow', completed: false, priority: 'urgent' }
  ]);

  const productivityScore = 87;
  const totalPoints = 2450;
  const completedToday = tasks.filter(t => t.completed && t.dueDate === 'Today').length;
  const totalToday = tasks.filter(t => t.dueDate === 'Today').length;

  // Initialize speech recognition on component mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setRecordedTranscript(transcript);
        };

        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          alert(`Recording error: ${event.error}. Please make sure you're using Chrome/Edge/Safari and have granted microphone permissions.`);
          setIsRecording(false);
        };

        recognitionInstance.onend = () => {
          if (isRecording) {
            setIsRecording(false);
          }
        };

        setRecognition(recognitionInstance);
      }
    }
  }, []);

  const startRecording = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari. For this demo, you can use the "Sync Pin Device" button instead!');
      return;
    }
    
    try {
      setRecordedTranscript('');
      setIsRecording(true);
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      alert('Could not start recording. Please try the "Sync Pin Device" button to see the demo!');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      try {
        recognition.stop();
        setIsRecording(false);
        
        setTimeout(() => {
          if (recordedTranscript && recordedTranscript.trim().length > 0) {
            processRecording(recordedTranscript);
          } else {
            alert('No speech detected. Please try again or use the "Sync Pin Device" button to see the demo!');
          }
        }, 500);
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsRecording(false);
      }
    }
  };

  const processRecording = (transcript) => {
    if (!transcript || transcript.trim().length === 0) {
      alert('No speech detected. Please try recording again.');
      return;
    }

    // Check if we should use real AI or demo mode
    if (groqApiKey && groqApiKey.trim().length > 0) {
      processWithGroqAI(transcript);
    } else {
      // Fallback to simulated processing
      const extractedData = extractTasksFromTranscript(transcript);
      setShowAIAnimation(true);
      setAiAnimationStep(0);
      animateAIProcessingWithData(extractedData);
    }
  };

  const processWithGroqAI = async (transcript) => {
    setIsProcessingAI(true);
    setShowAIAnimation(true);
    setAiAnimationStep(0);

    try {
      // Step 1: Show transcript
      setTimeout(() => setAiAnimationStep(1), 1000);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are a helpful homework assistant. Extract tasks from the student's recording and return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "tasks": [
    {
      "subject": "Subject name",
      "task": "Description of the task",
      "dueDate": "Today/Tomorrow/Monday/Tuesday/Wednesday/Thursday/Friday/This Week",
      "priority": "urgent/high/medium/low"
    }
  ],
  "summary": "A helpful summary with study tips and encouragement"
}

Rules:
- If due today, priority is "urgent"
- If due tomorrow, priority is "high"  
- Extract clear, actionable tasks
- Be encouraging and helpful in the summary`
            },
            {
              role: 'user',
              content: `Here's what the student recorded: "${transcript}"\n\nExtract all homework tasks and reminders.`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Parse the JSON response
      let parsedData;
      try {
        // Remove markdown code blocks if present
        const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsedData = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiResponse);
        throw new Error('AI returned invalid format');
      }

      // Step 2: AI analyzing
      setTimeout(() => setAiAnimationStep(2), 3000);

      // Format the data for animation
      const extractedData = {
        transcript: transcript,
        extractedTasks: parsedData.tasks || [],
        aiSummary: parsedData.summary || "Tasks extracted successfully!",
        timestamp: new Date().toLocaleTimeString()
      };

      // Continue with animation
      window.currentRecordingData = extractedData;
      
      // Show tasks one by one
      extractedData.extractedTasks.forEach((task, index) => {
        setTimeout(() => {
          setAiAnimationStep(3 + index);
        }, 5000 + (index * 1000));
      });

      // Final steps
      const finalStep = 3 + extractedData.extractedTasks.length;
      setTimeout(() => {
        setAiAnimationStep(finalStep);
        
        // Add new tasks to the list
        const maxId = Math.max(...tasks.map(t => t.id), 0);
        const newTasks = extractedData.extractedTasks.map((task, idx) => ({
          ...task,
          id: maxId + idx + 1,
          completed: false
        }));
        setTasks(prev => [...newTasks, ...prev]);
        
        setChatMessages(prev => [...prev, 
          { type: 'bot', text: `🎤 Recording processed with AI at ${extractedData.timestamp}!` },
          { type: 'bot', text: `✨ ${extractedData.aiSummary}` }
        ]);
      }, 5000 + (extractedData.extractedTasks.length * 1000) + 1000);

      setTimeout(() => {
        setAiAnimationStep(finalStep + 1);
        setTimeout(() => {
          setShowAIAnimation(false);
          setAiAnimationStep(0);
          setRecordedTranscript('');
          setIsProcessingAI(false);
          delete window.currentRecordingData;
        }, 2000);
      }, 5000 + (extractedData.extractedTasks.length * 1000) + 3000);

    } catch (error) {
      console.error('Groq API Error:', error);
      alert(`AI Processing failed: ${error.message}. Using demo mode instead.`);
      setShowAIAnimation(false);
      setIsProcessingAI(false);
      
      // Fallback to demo mode
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
    const lowerTranscript = transcript.toLowerCase();
    
    const subjects = ['math', 'mathematics', 'science', 'chemistry', 'physics', 'english', 'history', 'art', 'biology'];
    const taskKeywords = ['homework', 'assignment', 'complete', 'write', 'read', 'study', 'practice', 'remember', 'bring'];
    
    const sentences = transcript.split(/[.!?,]+/).filter(s => s.trim().length > 0);
    
    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      
      let foundSubject = 'General';
      for (const subject of subjects) {
        if (lowerSentence.includes(subject)) {
          foundSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
          break;
        }
      }
      
      const hasTaskKeyword = taskKeywords.some(keyword => lowerSentence.includes(keyword));
      
      if (hasTaskKeyword && sentence.trim().length > 10) {
        let dueDate = 'This Week';
        if (lowerSentence.includes('today')) dueDate = 'Today';
        else if (lowerSentence.includes('tomorrow')) dueDate = 'Tomorrow';
        else if (lowerSentence.includes('monday')) dueDate = 'Monday';
        else if (lowerSentence.includes('tuesday')) dueDate = 'Tuesday';
        else if (lowerSentence.includes('wednesday')) dueDate = 'Wednesday';
        else if (lowerSentence.includes('thursday')) dueDate = 'Thursday';
        else if (lowerSentence.includes('friday')) dueDate = 'Friday';
        
        let priority = 'medium';
        if (dueDate === 'Today') priority = 'urgent';
        else if (dueDate === 'Tomorrow') priority = 'high';
        
        tasks.push({
          subject: foundSubject,
          task: sentence.trim(),
          dueDate: dueDate,
          priority: priority
        });
      }
    });
    
    if (tasks.length === 0) {
      tasks.push({
        subject: 'General',
        task: transcript.trim(),
        dueDate: 'This Week',
        priority: 'medium'
      });
    }
    
    return {
      transcript: transcript,
      extractedTasks: tasks,
      aiSummary: `I've analyzed your recording and found ${tasks.length} task${tasks.length > 1 ? 's' : ''}. ${tasks.length > 0 ? `Focus on ${tasks[0].subject} first since it's due ${tasks[0].dueDate}.` : ''} Great job recording your homework!`,
      timestamp: new Date().toLocaleTimeString()
    };
  };

  const animateAIProcessingWithData = (recordingData) => {
    window.currentRecordingData = recordingData;
    setAiAnimationStep(0);
    
    setTimeout(() => setAiAnimationStep(1), 1000);
    setTimeout(() => setAiAnimationStep(2), 3000);
    
    recordingData.extractedTasks.forEach((task, index) => {
      setTimeout(() => {
        setAiAnimationStep(3 + index);
      }, 5000 + (index * 1000));
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
        setRecordedTranscript('');
        delete window.currentRecordingData;
      }, 2000);
    }, 5000 + (recordingData.extractedTasks.length * 1000) + 3000);
  };

  const simulatedRecording = {
    transcript: "Hey Snap, I have homework for today. For Math, I need to complete page 45, questions 1 through 15, it's about quadratic equations. For Chemistry, I have to write a summary of Chapter 9 on chemical bonding, that's due on Wednesday. Oh, and I also need to remember to bring my art supplies tomorrow for the painting project. Over.",
    extractedTasks: [
      { subject: 'Mathematics', task: 'Complete page 45, questions 1-15 (quadratic equations)', dueDate: 'Today', priority: 'high' },
      { subject: 'Chemistry', task: 'Write summary of Chapter 9 on chemical bonding', dueDate: 'Wednesday', priority: 'high' },
      { subject: 'Art', task: 'Remember to bring art supplies for painting project', dueDate: 'Tomorrow', priority: 'medium' }
    ],
    aiSummary: "I've analyzed your recording and found 3 tasks. You have 2 homework assignments and 1 reminder. Priority: Focus on Math first since it's due today (about 30-40 minutes). Chemistry can wait until tomorrow. Here's a tip: For quadratic equations, remember the formula method is fastest for questions 1-10, but try factoring for 11-15 to practice!",
    timestamp: new Date().toLocaleTimeString()
  };

  const syncDevice = () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setShowSyncSuccess(false);
    setShowAIAnimation(false);
    setAiAnimationStep(0);
    
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSyncing(false);
            setShowSyncSuccess(true);
            
            setTimeout(() => {
              setShowAIAnimation(true);
              animateAIProcessing();
            }, 500);
            
            setTimeout(() => setShowSyncSuccess(false), 3000);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const animateAIProcessing = () => {
    window.currentRecordingData = simulatedRecording;
    setAiAnimationStep(0);
    setTimeout(() => setAiAnimationStep(1), 1000);
    setTimeout(() => setAiAnimationStep(2), 3000);
    setTimeout(() => setAiAnimationStep(3), 5000);
    setTimeout(() => setAiAnimationStep(4), 6000);
    setTimeout(() => setAiAnimationStep(5), 7000);
    
    setTimeout(() => {
      setAiAnimationStep(6);
      
      const maxId = Math.max(...tasks.map(t => t.id), 0);
      const newTasks = simulatedRecording.extractedTasks.map((task, idx) => ({
        ...task,
        id: maxId + idx + 1,
        completed: false
      }));
      setTasks(prev => [...newTasks, ...prev]);
      
      setChatMessages(prev => [...prev, 
        { type: 'bot', text: `📱 Device synced at ${simulatedRecording.timestamp}!` },
        { type: 'bot', text: `✨ ${simulatedRecording.aiSummary}` }
      ]);
    }, 9000);
    
    setTimeout(() => {
      setAiAnimationStep(7);
      setTimeout(() => {
        setShowAIAnimation(false);
        setAiAnimationStep(0);
        delete window.currentRecordingData;
      }, 2000);
    }, 11000);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const sendMessage = async () => {
    if (chatInput.trim()) {
      const userMessage = chatInput.trim();
      setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);
      setChatInput('');

      // Check if we should use real AI or demo mode
      if (groqApiKey && groqApiKey.trim().length > 0) {
        // Add "typing" indicator
        setChatMessages(prev => [...prev, { type: 'bot', text: '💭 Thinking...' }]);
        
        try {
          const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
              model: 'llama-3.1-70b-versatile',
              messages: [
                {
                  role: 'system',
                  content: `You are a helpful homework assistant for students. You help them:
- Track and remember their homework assignments
- Give study tips and time management advice
- Break down complex tasks into smaller steps
- Provide encouragement and motivation
- Answer questions about productivity and organization

Current tasks the student has:
${tasks.map(t => `- ${t.subject}: ${t.task} (Due: ${t.dueDate}, ${t.completed ? 'Completed' : 'Pending'})`).join('\n')}

Be friendly, encouraging, and concise. Use emojis occasionally to be engaging.`
                },
                {
                  role: 'user',
                  content: userMessage
                }
              ],
              temperature: 0.7,
              max_tokens: 300
            })
          });

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
          }

          const data = await response.json();
          const aiResponse = data.choices[0].message.content;

          // Remove "thinking" message and add real response
          setChatMessages(prev => {
            const filtered = prev.filter(msg => msg.text !== '💭 Thinking...');
            return [...filtered, { type: 'bot', text: aiResponse }];
          });

        } catch (error) {
          console.error('Chat AI Error:', error);
          // Remove "thinking" message and add fallback response
          setChatMessages(prev => {
            const filtered = prev.filter(msg => msg.text !== '💭 Thinking...');
            return [...filtered, { type: 'bot', text: `⚠️ AI temporarily unavailable. ${getAIResponse(userMessage)}` }];
          });
        }
      } else {
        // Use demo mode
        setChatMessages(prev => [...prev, { type: 'bot', text: getAIResponse(userMessage) }]);
      }
    }
  };

  const getAIResponse = (input) => {
    const lower = input.toLowerCase();
    if (lower.includes('homework') || lower.includes('tasks')) {
      const pendingTasks = tasks.filter(t => !t.completed);
      return `You have ${pendingTasks.length} pending tasks. Focus on completing your ${pendingTasks[0]?.subject || 'work'} first since it's due ${pendingTasks[0]?.dueDate || 'soon'}!`;
    } else if (lower.includes('help') || lower.includes('tips')) {
      return "Here's a tip: Break down large assignments into smaller sections. Start with the easiest part to build momentum!";
    } else if (lower.includes('score') || lower.includes('productivity')) {
      return `Your productivity score is ${productivityScore}%! Complete one more task today to boost your score. You're doing great!`;
    }
    return "I'm here to help! You can ask me about your homework, request study tips, or check your productivity score.";
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
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3) translateY(-100px); }
          50% { opacity: 1; transform: scale(1.05) translateY(0); }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
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
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-purple-500 hover:bg-purple-600 hover:shadow-xl transform hover:scale-105'
                }`}
              >
                <Mic className={`w-5 h-5 ${isRecording ? 'animate-pulse' : ''}`} />
                <span>{isRecording ? '⏹️ Stop Recording' : '🎤 Record Homework'}</span>
              </button>
              <button
                onClick={syncDevice}
                disabled={isSyncing}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${
                  isSyncing 
                    ? 'bg-blue-700 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600 hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isSyncing ? (
                  <>
                    <Upload className="w-5 h-5 animate-bounce" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Usb className="w-5 h-5" />
                    <span>🔌 Sync Pin Device</span>
                  </>
                )}
              </button>
              <div className="flex items-center space-x-2 bg-blue-800 px-4 py-2 rounded-lg">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <span className="font-semibold">{totalPoints} pts</span>
              </div>
              <button
                onClick={() => setShowApiSettings(!showApiSettings)}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg"
                title="API Settings"
              >
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

      {isRecording && (
        <div className="bg-red-500 text-white animate-pulse">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">🎤 Recording... Speak your homework now!</span>
              <span className="text-sm opacity-90">"{recordedTranscript}"</span>
            </div>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="bg-blue-600 text-white">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center space-x-3">
              <Mic className="w-5 h-5 animate-pulse" />
              <div className="flex-grow">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Uploading voice recording...</span>
                  <span className="text-sm font-medium">{syncProgress}%</span>
                </div>
                <div className="w-full bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-green-400 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${syncProgress}%` }}
                  ></div>
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
              <span className="font-medium">✨ Device synced successfully! AI is now processing your recording...</span>
            </div>
          </div>
        </div>
      )}

      {/* API Settings Panel */}
      {showApiSettings && (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
          <div className="container mx-auto px-6 py-4">
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Groq AI Settings</span>
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-grow w-full sm:w-auto">
                <input
                  type="password"
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder="Enter your Groq API key (optional - uses demo mode if empty)"
                  className="w-full px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (groqApiKey.trim()) {
                      alert('✅ API Key saved! Voice recordings will now use real AI processing.');
                    }
                    setShowApiSettings(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowApiSettings(false)}
                  className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            <p className="text-sm text-indigo-100 mt-2">
              {groqApiKey ? '🤖 Real AI Mode Active' : '🎭 Demo Mode Active - Get your free API key at groq.com'}
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
                  <h3 className="text-2xl font-bold text-white">SnapTask AI Assistant</h3>
                  <p className="text-purple-100">Processing your recording...</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {aiAnimationStep >= 0 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg flex-grow border border-purple-200">
                    <p className="text-gray-800">Hello! I've received your voice recording. Let me process it for you...</p>
                  </div>
                </div>
              )}

              {aiAnimationStep >= 1 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg flex-grow border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-2">📝 Your Recording:</p>
                    <p className="text-gray-700 italic">"{window.currentRecordingData?.transcript || ''}"</p>
                  </div>
                </div>
              )}

              {aiAnimationStep >= 2 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 animate-spin">
                    <Sparkles className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg flex-grow border border-yellow-200">
                    <p className="text-gray-800">🧠 Analyzing and extracting tasks...</p>
                  </div>
                </div>
              )}

              {aiAnimationStep >= 3 && window.currentRecordingData && window.currentRecordingData.extractedTasks.map((task, index) => {
                if (aiAnimationStep >= 3 + index) {
                  return (
                    <div key={index} className="flex items-start space-x-3 animate-slide-in">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg flex-grow border border-green-200">
                        <p className="font-semibold text-green-900 mb-2">✅ Task {index + 1} Found:</p>
                        <p className="text-gray-800"><strong>{task.subject}:</strong> {task.task}</p>
                        <p className="text-sm text-gray-600 mt-1">Due: {task.dueDate} | Priority: {task.priority.toUpperCase()}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}

              {aiAnimationStep >= 6 && window.currentRecordingData && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg flex-grow border border-indigo-200">
                    <p className="font-semibold text-indigo-900 mb-2">💡 AI Summary & Tips:</p>
                    <p className="text-gray-800">{window.currentRecordingData.aiSummary}</p>
                  </div>
                </div>
              )}

              {aiAnimationStep >= 7 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg flex-grow border border-green-200">
                    <p className="text-gray-800 font-semibold">✅ All tasks added to your dashboard! You can close this window now.</p>
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
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'dashboard' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>AI Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`flex items-center space-x-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'goals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
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
                  <div
                    key={task.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      task.completed ? 'bg-gray-50 border-gray-300 opacity-60' : 'bg-white border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />
                        )}
                      </button>
                      <div className="flex-grow">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-blue-600">{task.subject}</span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className={`text-gray-800 ${task.completed ? 'line-through' : ''}`}>
                          {task.task}
                        </p>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">💬 AI Assistant Chat</h2>
            <div className="border rounded-lg h-96 overflow-y-auto p-4 mb-4 bg-gray-50">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-3 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs rounded-lg p-3 ${
                      msg.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
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
              <button
                onClick={sendMessage}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </div>
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
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all"
                    style={{ width: `${(completedToday / totalToday) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {completedToday} of {totalToday} completed ({Math.round((completedToday / totalToday) * 100)}%)
                </p>
              </div>

              <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50">
                <h3 className="text-xl font-semibold text-purple-900 mb-2">Weekly Challenge</h3>
                <p className="text-gray-700 mb-4">Maintain 90%+ productivity score for 7 days</p>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div
                      key={day}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        day <= 4 ? 'bg-purple-500 text-white' : 'bg-purple-200 text-purple-400'
                      }`}
                    >
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
                <p className="text-sm text-gray-600 mt-4">
                  You have {totalPoints} points. Keep completing tasks to earn more rewards!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}