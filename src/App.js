import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import BudgetPage from './components/BudgetPage';
import PlanPage from './components/PlanPage';
import SettingsPage from './components/SettingsPage';
import ChatbotPage from './components/ChatbotPage'; // Import ChatbotPage
import { BudgetProvider } from './BudgetContext';

const App = () => {
  const [activities, setActivities] = useState([
    { id: 1, name: 'Sleep', startTime: '2025-04-28T23:00:00', endTime: '2025-04-29T07:00:00', priority: 'Medium', mode: 'Sleep', project: null, frequency: 'Daily', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 2, name: 'Sleep', startTime: '2025-04-29T23:00:00', endTime: '2025-04-30T07:00:00', priority: 'Medium', mode: 'Sleep', project: null, frequency: 'Daily', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 3, name: 'Sleep', startTime: '2025-04-30T23:00:00', endTime: '2025-05-01T07:00:00', priority: 'Medium', mode: 'Sleep', project: null, frequency: 'Daily', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 4, name: 'Sleep', startTime: '2025-05-01T23:00:00', endTime: '2025-05-02T07:00:00', priority: 'Medium', mode: 'Sleep', project: null, frequency: 'Daily', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 5, name: 'Sleep', startTime: '2025-05-02T23:00:00', endTime: '2025-05-03T07:00:00', priority: 'Medium', mode: 'Sleep', project: null, frequency: 'Daily', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 6, name: 'Sleep', startTime: '2025-05-03T00:00:00', endTime: '2025-05-03T09:00:00', priority: 'Medium', mode: 'Sleep', project: null, frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 7, name: 'Sleep', startTime: '2025-05-04T00:00:00', endTime: '2025-05-04T09:00:00', priority: 'Medium', mode: 'Sleep', project: null, frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 8, name: 'Calculus Class', startTime: '2025-04-28T10:00:00', endTime: '2025-04-28T12:00:00', priority: 'High', mode: 'Work', project: 'Academics', frequency: 'Weekly', status: 'Completed', actualStart: '2025-04-28T10:05:00', actualEnd: '2025-04-28T12:10:00', timeSpent: 125, deleted: false },
    { id: 9, name: 'Physics Class', startTime: '2025-04-29T10:00:00', endTime: '2025-04-29T12:00:00', priority: 'High', mode: 'Work', project: 'Academics', frequency: 'Weekly', status: 'Completed', actualStart: '2025-04-29T10:02:00', actualEnd: '2025-04-29T12:15:00', timeSpent: 133, deleted: false },
    { id: 10, name: 'Literature Class', startTime: '2025-04-30T10:00:00', endTime: '2025-04-30T12:00:00', priority: 'High', mode: 'Work', project: 'Academics', frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 11, name: 'History Class', startTime: '2025-05-01T10:00:00', endTime: '2025-05-01T12:00:00', priority: 'High', mode: 'Work', project: 'Academics', frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 12, name: 'Study', startTime: '2025-04-28T14:00:00', endTime: '2025-04-28T16:00:00', priority: 'Medium', mode: 'Work', project: 'Academics', frequency: 'Daily', status: 'Completed', actualStart: '2025-04-28T14:10:00', actualEnd: '2025-04-28T16:05:00', timeSpent: 115, deleted: false },
    { id: 13, name: 'Study', startTime: '2025-04-29T14:00:00', endTime: '2025-04-29T16:00:00', priority: 'Medium', mode: 'Work', project: 'Academics', frequency: 'Daily', status: 'Completed', actualStart: '2025-04-29T14:15:00', actualEnd: '2025-04-29T16:00:00', timeSpent: 105, deleted: false },
    { id: 14, name: 'Study', startTime: '2025-04-30T14:00:00', endTime: '2025-04-30T16:00:00', priority: 'Medium', mode: 'Work', project: 'Academics', frequency: 'Daily', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 15, name: 'Study', startTime: '2025-05-01T14:00:00', endTime: '2025-05-01T16:00:00', priority: 'Medium', mode: 'Work', project: 'Academics', frequency: 'Daily', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 16, name: 'Study', startTime: '2025-05-02T14:00:00', endTime: '2025-05-02T16:00:00', priority: 'Medium', mode: 'Work', project: 'Academics', frequency: 'Daily', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 17, name: 'Swim', startTime: '2025-05-02T17:00:00', endTime: '2025-05-02T18:00:00', priority: 'Low', mode: 'Relax', project: 'Sport', frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 18, name: 'Hang with Friends', startTime: '2025-05-03T11:00:00', endTime: '2025-05-03T14:00:00', priority: 'Low', mode: 'Relax', project: null, frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 19, name: 'Run', startTime: '2025-05-03T16:00:00', endTime: '2025-05-03T17:00:00', priority: 'Low', mode: 'Relax', project: 'Sport', frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 20, name: 'Family Time', startTime: '2025-05-03T18:00:00', endTime: '2025-05-03T21:00:00', priority: 'Low', mode: 'Relax', project: null, frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 21, name: 'Hang with Friends', startTime: '2025-05-04T11:00:00', endTime: '2025-05-04T15:00:00', priority: 'Low', mode: 'Relax', project: null, frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 22, name: 'Run', startTime: '2025-05-04T16:00:00', endTime: '2025-05-04T17:00:00', priority: 'Low', mode: 'Relax', project: 'Sport', frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 23, name: 'Family Time', startTime: '2025-05-04T18:00:00', endTime: '2025-05-04T21:00:00', priority: 'Low', mode: 'Relax', project: null, frequency: 'Weekly', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
    { id: 24, name: 'Morning Meeting', startTime: '2025-04-30T03:00:00', endTime: '2025-04-30T04:00:00', priority: 'High', mode: 'Work', project: 'Academics', frequency: 'None', status: 'Pending', actualStart: null, actualEnd: null, timeSpent: 0, deleted: false },
  ]);

  const [reminders, setReminders] = useState([
    { id: 1, name: 'Submit Calculus HW', endTime: '2025-04-30T17:00:00', priority: 'High', mode: 'Work', project: 'Academics', frequency: 'None', status: 'Not Yet', actualEnd: null, timeSpent: 0, deleted: false },
    { id: 2, name: 'Physics Lab Report Due', endTime: '2025-05-01T17:00:00', priority: 'High', mode: 'Work', project: 'Academics', frequency: 'None', status: 'Not Yet', actualEnd: null, timeSpent: 0, deleted: false },
    { id: 3, name: 'Literature Essay Draft', endTime: '2025-05-02T17:00:00', priority: 'Medium', mode: 'Work', project: 'Academics', frequency: 'None', status: 'Not Yet', actualEnd: null, timeSpent: 0, deleted: false },
    { id: 4, name: 'Prepare Meeting Notes', endTime: '2025-04-30T02:00:00', priority: 'High', mode: 'Work', project: 'Academics', frequency: 'None', status: 'Not Yet', actualEnd: null, timeSpent: 0, deleted: false },
  ]);

  const [projects, setProjects] = useState([
    { id: 1, name: 'Academics', mode: 'Work', status: 'Active', milestonesSet: 3, milestonesDone: 0, deleted: false },
    { id: 2, name: 'Sport', mode: 'Relax', status: 'Active', milestonesSet: 0, milestonesDone: 0, deleted: false }
  ]);

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newNotifications = [];
      const updatedReminders = reminders.map(reminder => {
        if (reminder.status === 'Not Yet' && new Date(reminder.endTime) <= now && !reminder.deleted) {
          newNotifications.push({
            id: Date.now(),
            message: `Reminder: ${reminder.name} is due now!`,
            timestamp: now.toISOString(),
          });
          return { ...reminder, status: 'Done', actualEnd: now.toISOString(), timeSpent: 0 };
        }
        return reminder;
      });
      setReminders(updatedReminders);
      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [reminders]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newNotifications = [];
      const updatedActivities = activities.map(activity => {
        if (activity.status === 'Pending' && new Date(activity.startTime) <= now && !activity.deleted) {
          newNotifications.push({
            id: Date.now(),
            message: `Activity: ${activity.name} is starting now!`,
            timestamp: now.toISOString(),
          });
          return { ...activity, actualStart: now.toISOString(), status: 'Pending' };
        }
        return activity;
      });
      setActivities(updatedActivities);
      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activities]);

  const addActivity = (activity) => {
    const newActivity = { ...activity, id: Date.now(), deleted: false };
    setActivities([...activities, newActivity]);
    if (activity.mode === 'Sleep') {
      const bedtimeReminder = {
        id: Date.now() + 1,
        name: `${activity.name} - Bedtime`,
        endTime: activity.startTime,
        priority: activity.priority,
        mode: activity.mode,
        project: activity.project || null,
        frequency: activity.frequency,
        status: 'Not Yet',
        actualEnd: null,
        timeSpent: 0,
        deleted: false
      };
      const wakeUpReminder = {
        id: Date.now() + 2,
        name: `${activity.name} - Wake Up`,
        endTime: activity.endTime,
        priority: activity.priority,
        mode: activity.mode,
        project: activity.project || null,
        frequency: activity.frequency,
        status: 'Not Yet',
        actualEnd: null,
        timeSpent: 0,
        deleted: false
      };
      setReminders([...reminders, bedtimeReminder, wakeUpReminder]);
    }
  };

  const addReminder = (reminder) => {
    setReminders([...reminders, { ...reminder, id: Date.now(), deleted: false }]);
  };

  const addProject = (project) => {
    setProjects([...projects, { ...project, id: Date.now(), deleted: false }]);
  };

  const updateActivity = (id, updates) => {
    setActivities(activities.map(activity => (activity.id === id ? { ...activity, ...updates } : activity)));
  };

  const updateReminder = (id, updates) => {
    setReminders(reminders.map(reminder => (reminder.id === id ? { ...reminder, ...updates } : reminder)));
  };

  const updateProject = (id, updates) => {
    setProjects(projects.map(project => (project.id === id ? { ...project, ...updates } : project)));
  };

  const deleteActivity = (id) => {
    setActivities(activities.map(activity => (activity.id === id ? { ...activity, deleted: true } : activity)));
  };

  const deleteReminder = (id) => {
    setReminders(reminders.map(reminder => (reminder.id === id ? { ...reminder, deleted: true } : reminder)));
  };

  const deleteProject = (id, option) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setProjects(projects.map(p => (p.id === id ? { ...p, deleted: true } : p)));
      if (option === 'delete') {
        setActivities(activities.map(activity => 
          (activity.project === project.name ? { ...activity, deleted: true } : activity)
        ));
        setReminders(reminders.map(reminder => 
          (reminder.project === project.name ? { ...reminder, deleted: true } : reminder)
        ));
      } else if (option === 'remove') {
        setActivities(activities.map(activity => 
          (activity.project === project.name ? { ...activity, project: null } : activity)
        ));
        setReminders(reminders.map(reminder => 
          (reminder.project === project.name ? { ...reminder, project: null } : reminder)
        ));
      }
    }
  };

  const restoreActivity = (id) => {
    setActivities(activities.map(activity => 
      (activity.id === id ? { ...activity, deleted: false } : activity)
    ));
  };

  const restoreReminder = (id) => {
    setReminders(reminders.map(reminder => 
      (reminder.id === id ? { ...reminder, deleted: false } : reminder)
    ));
  };

  return (
    <BudgetProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                activities={activities}
                reminders={reminders}
                projects={projects}
                notifications={notifications}
                onAddActivity={addActivity}
                onAddReminder={addReminder}
                onAddProject={addProject}
                onUpdateActivity={updateActivity}
                onUpdateReminder={updateReminder}
              />
            }
          />
          <Route
            path="/budget"
            element={
              <BudgetPage
                activities={activities}
                reminders={reminders}
                projects={projects}
              />
            }
          />
          <Route
            path="/plan"
            element={
              <PlanPage
                activities={activities}
                reminders={reminders}
                projects={projects}
                onAddActivity={addActivity}
                onAddReminder={addReminder}
                onAddProject={addProject}
                onUpdateActivity={updateActivity}
                onUpdateReminder={updateReminder}
                onUpdateProject={updateProject}
                onDeleteActivity={deleteActivity}
                onDeleteReminder={deleteReminder}
                onDeleteProject={deleteProject}
                onRestoreActivity={restoreActivity}
                onRestoreReminder={restoreReminder}
              />
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="/chatbot"
            element={
              <ChatbotPage
                activities={activities}
                reminders={reminders}
                projects={projects}
                onAddActivity={addActivity}
                onAddReminder={addReminder}
                onAddProject={addProject}
                onUpdateActivity={updateActivity}
                onUpdateReminder={updateReminder}
              />
            }
          />
        </Routes>
      </Router>
    </BudgetProvider>
  );
};

export default App;