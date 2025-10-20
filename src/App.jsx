import React, { useState } from 'react';
import { CheckCircle, Circle, Trophy, MessageSquare, User, Settings, Home, Target, Zap, Usb, Mic, Upload, Sparkles } from 'lucide-react';

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
  const [tasks, setTasks] = useState([
    { id: 1, subject: 'Mathematics', task: 'Complete exercises 5.1 to 5.3 from textbook', dueDate: 'Today', completed: false, priority: 'high' },
    { id: 2, subject: 'Science', task: 'Write lab report on photosynthesis experiment', dueDate: 'Tomorrow', completed: false, priority: 'high' },
    { id: 3, subject: 'English', task: 'Read Chapter 7 and answer comprehension questions', dueDate: 'Today', completed: true, priority: 'medium' },
    { id: 4, subject: 'History', task: 'Research and create timeline of World War II events', dueDate: 'Friday', completed: false, priority: 'medium' },
    { id: 5, subject: 'Competition Reminder', task: 'Science fair competition tomorrow at 9 AM', dueDate: 'Tomorrow', completed: false, priority: 'urgent' }
  ]);

  const productivityScore = 87;
  const totalPoints = 2450;
  const completedToday = 1;
  const totalToday = 2;

  // Simulated recording data from the SnapTask Pin
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
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSyncing(false);
            setShowSyncSuccess(true);
            
            // Start AI animation after sync completes
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
    // Step 0: AI appears
    setAiAnimationStep(0);
    
    // Step 1: Show transcript after 1s
    setTimeout(() => {
      setAiAnimationStep(1);
    }, 1000);
    
    // Step 2: AI analyzing after 3s
    setTimeout(() => {
      setAiAnimationStep(2);
    }, 3000);
    
    // Step 3: Show extracted tasks one by one (5s, 6s, 7s)
    setTimeout(() => {
      setAiAnimationStep(3);
    }, 5000);
    
    setTimeout(() => {
      setAiAnimationStep(4);
    }, 6000);
    
    setTimeout(() => {
      setAiAnimationStep(5);
    }, 7000);
    
    // Step 6: Show AI summary and tips after 8s
    setTimeout(() => {
      setAiAnimationStep(6);
      
      // Add new tasks to the list
      const maxId = Math.max(...tasks.map(t => t.id));
      const newTasks = simulatedRecording.extractedTasks.map((task, idx) => ({
        ...task,
        id: maxId + idx + 1,
        completed: false
      }));
      setTasks(prev => [...newTasks, ...prev]);
      
      // Add messages to chat
      setChatMessages(prev => [...prev, 
        { type: 'bot', text: `📱 Device synced at ${simulatedRecording.timestamp}!` },
        { type: 'bot', text: `✨ ${simulatedRecording.aiSummary}` }
      ]);
    }, 9000);
    
    // Step 7: Complete animation after 11s
    setTimeout(() => {
      setAiAnimationStep(7);
      setTimeout(() => {
        setShowAIAnimation(false);
        setAiAnimationStep(0);
      }, 2000);
    }, 11000);
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const sendMessage = () => {
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, 
        { type: 'user', text: chatInput },
        { type: 'bot', text: getAIResponse(chatInput) }
      ]);
      setChatInput('');
    }
  };

  const getAIResponse = (input) => {
    const lower = input.toLowerCase();
    if (lower.includes('homework') || lower.includes('tasks')) {
      return "You have 4 pending tasks: Math exercises, Science lab report, History timeline, and don't forget the science fair tomorrow! Focus on completing your Math work first since it's due today.";
    } else if (lower.includes('help') || lower.includes('tips')) {
      return "Here's a tip: Break down your Science lab report into smaller sections. Start with observations, then move to analysis. This makes it less overwhelming!";
    } else if (lower.includes('score') || lower.includes('productivity')) {
      return "Your productivity score is 87%! Complete one more task today to reach 95%. You're doing great!";
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
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(-100px);
          }
          50% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold">SnapTask</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {/* Sync Device Button - Made MORE prominent */}
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
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sync Progress Bar */}
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

      {/* Sync Success Message */}
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

      {/* AI Processing Animation Modal */}
      {showAIAnimation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in">
            {/* AI Header */}
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
              {/* Step 0: AI Introduction */}
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

              {/* Step 1: Transcript */}
              {aiAnimationStep >= 1 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg flex-grow border border-blue-200">
                    <p className="font-semibold text-blue-900 mb-2">📝 Your Recording:</p>
                    <p className="text-gray-700 italic">"{simulatedRecording.transcript}"</p>
                  </div>
                </div>
              )}

              {/* Step 2: AI Analyzing */}
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

              {/* Step 3-5: Extracted Tasks */}
              {aiAnimationStep >= 3 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg flex-grow border border-green-200">
                    <p className="font-semibold text-green-900 mb-2">✅ Task 1 Found:</p>
                    <p className="text-gray-800"><strong>Mathematics:</strong> {simulatedRecording.extractedTasks[0].task}</p>
                    <p className="text-sm text-gray-600 mt-1">Due: {simulatedRecording.extractedTasks[0].dueDate} | Priority: {simulatedRecording.extractedTasks[0].priority.toUpperCase()}</p>
                  </div>
                </div>
              )}

              {aiAnimationStep >= 4 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg flex-grow border border-green-200">
                    <p className="font-semibold text-green-900 mb-2">✅ Task 2 Found:</p>
                    <p className="text-gray-800"><strong>Chemistry:</strong> {simulatedRecording.extractedTasks[1].task}</p>
                    <p className="text-sm text-gray-600 mt-1">Due: {simulatedRecording.extractedTasks[1].dueDate} | Priority: {simulatedRecording.extractedTasks[1].priority.toUpperCase()}</p>
                  </div>
                </div>
              )}

              {aiAnimationStep >= 5 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg flex-grow border border-green-200">
                    <p className="font-semibold text-green-900 mb-2">✅ Task 3 Found:</p>
                    <p className="text-gray-800"><strong>Art:</strong> {simulatedRecording.extractedTasks[2].task}</p>
                    <p className="text-sm text-gray-600 mt-1">Due: {simulatedRecording.extractedTasks[2].dueDate} | Priority: {simulatedRecording.extractedTasks[2].priority.toUpperCase()}</p>
                  </div>
                </div>
              )}

              {/* Step 6: AI Summary and Tips */}
              {aiAnimationStep >= 6 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg flex-grow border-2 border-purple-300">
                    <p className="font-semibold text-purple-900 mb-2">💡 AI Analysis & Tips:</p>
                    <p className="text-gray-800">{simulatedRecording.aiSummary}</p>
                  </div>
                </div>
              )}

              {/* Step 7: Complete */}
              {aiAnimationStep >= 7 && (
                <div className="flex items-start space-x-3 animate-slide-in">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg flex-grow border border-green-200">
                    <p className="text-gray-800 font-semibold">✨ All done! Your tasks have been added to your dashboard.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Close button appears at the end */}
            {aiAnimationStep >= 7 && (
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowAIAnimation(false);
                    setAiAnimationStep(0);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all"
                >
                  Got it! Let's get started 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'dashboard' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'chat' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Assistant</span>
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'goals' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Goals</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats */}
            <div className="lg:col-span-1 space-y-6">
              {/* Productivity Score */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Productivity Score</h3>
                <div className="flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#3b82f6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - productivityScore / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-blue-600">{productivityScore}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-gray-600 mt-4">Keep it up! You're almost at 90%</p>
              </div>

              {/* Today's Progress */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white">
                <h3 className="text-lg font-bold mb-4">Today's Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Completed Tasks</span>
                    <span className="font-bold text-xl">{completedToday}/{totalToday}</span>
                  </div>
                  <div className="w-full bg-blue-800 rounded-full h-3">
                    <div 
                      className="bg-yellow-400 h-3 rounded-full transition-all"
                      style={{ width: `${(completedToday / totalToday) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Leaderboard Preview */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                  Friend Leaderboard
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-yellow-600">1</span>
                      <span className="font-medium">Sarah K.</span>
                    </div>
                    <span className="font-bold text-yellow-600">2890 pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border-2 border-blue-500">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-blue-600">2</span>
                      <span className="font-medium">You</span>
                    </div>
                    <span className="font-bold text-blue-600">{totalPoints} pts</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-gray-600">3</span>
                      <span className="font-medium">Mike R.</span>
                    </div>
                    <span className="font-bold text-gray-600">2120 pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Tasks */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Your Tasks</h3>
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        task.completed 
                          ? 'bg-green-50 border-green-300' 
                          : 'bg-white border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className="mt-1 flex-shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          ) : (
                            <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />
                          )}
                        </button>
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                              {task.priority.toUpperCase()}
                            </span>
                            <span className="text-xs font-semibold text-blue-600">{task.subject}</span>
                          </div>
                          <p className={`text-gray-800 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.task}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">Due: {task.dueDate}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-blue-900 p-4">
                <h3 className="text-xl font-bold text-white">AI Assistant</h3>
                <p className="text-blue-200 text-sm">Ask me anything about your homework!</p>
              </div>
              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-2xl ${
                        msg.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your message..."
                    className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Set Your Goals</h3>
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-3">Daily Goal</h4>
                  <p className="text-gray-600 mb-4">Complete 2 tasks today</p>
                  <div className="w-full bg-blue-200 rounded-full h-4">
                    <div className="bg-blue-600 h-4 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">1 out of 2 tasks completed</p>
                </div>
                
                <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-3">Weekly Goal</h4>
                  <p className="text-gray-600 mb-4">Maintain 85%+ productivity score</p>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="text-green-700 font-medium">On track!</span>
                  </div>
                </div>

                <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-bold text-gray-800 mb-3">Rewards Progress</h4>
                  <p className="text-gray-600 mb-4">Reach 3000 points to unlock a reward coupon</p>
                  <div className="w-full bg-purple-200 rounded-full h-4">
                    <div className="bg-purple-600 h-4 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">2450 / 3000 points</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}