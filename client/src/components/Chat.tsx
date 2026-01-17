import React, { useState, useEffect, useRef } from 'react';

interface ChatProps {
  context: {
    region: string;
    variable: string;
    item: string;
  };
}

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
}

export const Chat: React.FC<ChatProps> = ({ context }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showHint, setShowHint] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'ai', text: 'Hello! I have access to the dashboard data. Ask me about trends, anomalies, or the geospatial map.' }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);
  useEffect(() => {
    if (isOpen) setShowHint(false);
    else setShowHint(true);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: input,
          context: context // sending { region, variable... } to backend
        })
      });

      const data = await response.json();
      
      const aiMsg: Message = { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: data.response || "I'm sorry, I couldn't process that." 
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now(), role: 'ai', text: "Error connecting to AI server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-4">
      
      {/* During closed*/}
      {!isOpen && showHint && (
        <div className="absolute bottom-2 right-20 w-48 bg-white p-3 rounded-xl shadow-lg border border-indigo-100 animate-fade-in-up flex items-center justify-between">
            <div className="relative">
                <p className="text-xs font-medium text-slate-600">
                    Your AI assistant is here! 
                    <br/>
                    <span className="text-indigo-500">Ask about anomalies...</span>
                </p>
            </div>
            <button 
                onClick={(e) => { e.stopPropagation(); setShowHint(false); }}
                className="text-slate-400 hover:text-slate-600 ml-2"
            >
                ✕
            </button>
        </div>
      )}

      {/* Messages*/}
      {isOpen && (
        <div className="bg-white w-96 h-125 rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in-up">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h2 className="font-semibold text-sm">AI Analyst</h2>
                <p className="text-xs text-indigo-200">Connected to Live Data</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-indigo-500 p-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white text-slate-700 rounded-bl-none border border-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-xs text-slate-400 ml-2">Thinking...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-slate-100">
            <div className="flex gap-2">
              <input
                className="flex-1 bg-slate-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom right floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${
          isOpen ? 'bg-slate-700' : 'bg-indigo-600 animate-bounce-subtle'
        } text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 relative`}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <span className="text-3xl">🤖</span>
        )}
      </button>

    </div>
  );
};