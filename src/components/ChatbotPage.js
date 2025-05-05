import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const ChatbotPage = ({ activities, reminders, projects, onAddActivity, onAddReminder, onAddProject, onUpdateActivity, onUpdateReminder }) => {
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi, I am HeyBud! I can help you manage your schedule. Try asking about your upcoming activities or adding a new event.' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Format date and time for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Function to send a message to the Rasa server
  const sendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message to the chat
    setMessages(prev => [...prev, { sender: 'user', text: message }]);
    setUserInput('');
    setIsLoading(true);

    try {
      // Send message to Rasa server via REST API
      const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: 'user',
          message: message,
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      // Process Rasa responses
      if (data && data.length > 0) {
        data.forEach(botResponse => {
          const newMessage = { sender: 'bot' };

          // Handle text response
          if (botResponse.text) {
            newMessage.text = botResponse.text;
          }

          // Handle custom payloads (e.g., schedule query or add event)
          if (botResponse.custom) {
            const { action, data: customData } = botResponse.custom;

            if (action === 'query_schedule') {
              // Query upcoming activities and reminders
              const now = new Date();
              const upcomingActivities = activities
                .filter(activity => !activity.deleted)
                .filter(activity => new Date(activity.startTime) > now)
                .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                .slice(0, 3); // Limit to 3 for brevity
              const upcomingReminders = reminders
                .filter(reminder => !reminder.deleted)
                .filter(reminder => reminder.status === 'Not Yet')
                .filter(reminder => new Date(reminder.endTime) > now)
                .sort((a, b) => new Date(a.endTime) - new Date(b.endTime))
                .slice(0, 3);

              if (upcomingActivities.length === 0 && upcomingReminders.length === 0) {
                newMessage.text = 'You have no upcoming activities or reminders.';
              } else {
                newMessage.text = 'Here’s your upcoming schedule:';
                newMessage.schedule = { activities: upcomingActivities, reminders: upcomingReminders };
              }
            } else if (action === 'add_activity' && customData) {
              // Add a new activity
              const newActivity = {
                name: customData.name || 'New Activity',
                startTime: customData.startTime || new Date().toISOString(),
                endTime: customData.endTime || new Date(Date.now() + 60 * 60 * 1000).toISOString(), // Default to 1 hour later
                priority: customData.priority || 'Medium',
                mode: customData.mode || 'Work',
                project: customData.project || null,
                frequency: customData.frequency || 'None',
                status: 'Pending',
                actualStart: null,
                actualEnd: null,
                timeSpent: 0,
              };
              onAddActivity(newActivity);
              newMessage.text = `Added activity: ${newActivity.name} on ${formatDateTime(newActivity.startTime)}`;
            } else if (action === 'add_reminder' && customData) {
              // Add a new reminder
              const newReminder = {
                name: customData.name || 'New Reminder',
                endTime: customData.endTime || new Date().toISOString(),
                priority: customData.priority || 'Medium',
                mode: customData.mode || 'Work',
                project: customData.project || null,
                frequency: customData.frequency || 'None',
                status: 'Not Yet',
                actualEnd: null,
                timeSpent: 0,
              };
              onAddReminder(newReminder);
              newMessage.text = `Added reminder: ${newReminder.name} due on ${formatDateTime(newReminder.endTime)}`;
            }
          }

          // Add the bot message to the chat
          if (newMessage.text) {
            setMessages(prev => [...prev, newMessage]);
          }
        });
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I didn’t understand that.' }]);
      }
    } catch (error) {
      console.error('Error communicating with Rasa:', error);
      setIsLoading(false);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Oops, something went wrong. Please try again.' }]);
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(userInput);
  };

  // Handle button click (e.g., for confirmations)
  const handleButtonClick = (payload) => {
    sendMessage(payload);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">HeyBud Chatbot</h1>
      <Link to="/dashboard" className="mb-4 inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
        Back to Dashboard
      </Link>
      <div className="bg-white rounded-lg shadow p-4">
        {/* Chat Display */}
        <div className="h-96 overflow-y-auto mb-4 p-4 border rounded-lg bg-gray-50">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${
                  msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                }`}
              >
                {msg.text}
                {/* Display schedule if present */}
                {msg.schedule && (
                  <div className="mt-2">
                    {msg.schedule.activities.length > 0 && (
                      <div>
                        <strong>Upcoming Activities:</strong>
                        <ul className="list-disc pl-5">
                          {msg.schedule.activities.map((activity, idx) => (
                            <li key={idx}>
                              {activity.name} - {formatDateTime(activity.startTime)} to {formatDateTime(activity.endTime)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {msg.schedule.reminders.length > 0 && (
                      <div className="mt-2">
                        <strong>Upcoming Reminders:</strong>
                        <ul className="list-disc pl-5">
                          {msg.schedule.reminders.map((reminder, idx) => (
                            <li key={idx}>
                              {reminder.name} - Due {formatDateTime(reminder.endTime)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {/* Display buttons if present */}
                {msg.buttons && (
                  <div className="mt-2 flex gap-2">
                    {msg.buttons.map((button, btnIndex) => (
                      <button
                        key={btnIndex}
                        onClick={() => handleButtonClick(button.payload)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        {button.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="inline-block p-2 rounded-lg bg-gray-200 text-gray-800">
                Typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
            disabled={isLoading}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotPage;