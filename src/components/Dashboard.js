import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import NotificationPane from './NotificationPane';
import FormModal from './FormModal';
import ConfirmModal from './ConfirmModal';
import { BudgetContext } from '../BudgetContext';

const Dashboard = ({ activities, reminders, projects, notifications, onAddActivity, onAddReminder, onAddProject, onUpdateActivity, onUpdateReminder }) => {
  const { budgets } = useContext(BudgetContext);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [isCountdownExpanded, setIsCountdownExpanded] = useState(false);
  const [isActivityCompletionExpanded, setIsActivityCompletionExpanded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format time to hh:mm
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Transform notifications into strings
  const formattedNotifications = notifications.map(notification => 
    `${formatTime(notification.timestamp)} - ${notification.message}`
  );

  // FullCalendar Events (Exclude Sleep Activities, Include All Reminders)
  const events = [
    ...activities
      .filter(activity => !activity.deleted)
      .filter(activity => activity.mode !== 'Sleep')
      .map(activity => ({
        title: `${formatTime(activity.startTime)} - ${activity.name}`,
        start: activity.startTime,
        end: activity.endTime,
        backgroundColor: activity.mode === 'Work' ? '#779ECB' : activity.mode === 'Sleep' ? '#B29DD9' : '#FE6B64'
      })),
    ...reminders
      .filter(reminder => !reminder.deleted)
      .map(reminder => ({
        title: `${formatTime(reminder.endTime)} - ${reminder.name}`,
        start: reminder.endTime,
        end: reminder.endTime,
        backgroundColor: reminder.mode === 'Work' ? '#779ECB' : reminder.mode === 'Sleep' ? '#B29DD9' : '#FE6B64'
      }))
  ];

  // Countdown
  const upcomingActivities = activities
    .filter(activity => !activity.deleted)
    .filter(activity => activity.status === 'Pending' && activity.mode !== 'Sleep')
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const upcomingReminders = reminders
    .filter(reminder => !reminder.deleted)
    .filter(reminder => reminder.status === 'Not Yet')
    .sort((a, b) => new Date(a.endTime) - new Date(b.endTime));

  const bedtimeReminders = upcomingReminders.filter(reminder => reminder.name.endsWith(' - Bedtime'));
  const wakeUpReminders = upcomingReminders.filter(reminder => reminder.name.endsWith(' - Wake Up'));
  const otherReminders = upcomingReminders.filter(
    reminder => !reminder.name.endsWith(' - Bedtime') && !reminder.name.endsWith(' - Wake Up')
  );

  const limitedReminders = [
    ...otherReminders,
    ...(bedtimeReminders.length > 0 ? [bedtimeReminders[0]] : []),
    ...(wakeUpReminders.length > 0 ? [wakeUpReminders[0]] : [])
  ].sort((a, b) => new Date(a.endTime) - new Date(b.endTime));

  const [activityCountdowns, setActivityCountdowns] = useState([]);
  const [reminderCountdowns, setReminderCountdowns] = useState([]);
  const [processedEvents, setProcessedEvents] = useState(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Calculate activity countdowns
      const newActivityCountdowns = upcomingActivities.map(activity => {
        if (!activity.startTime || !activity.name) {
          console.warn('Invalid activity data:', activity);
          return null;
        }

        const diff = new Date(activity.startTime) - now;
        const eventKey = `activity-${activity.id}`;

        if (diff <= 0 && diff > -1000 && !processedEvents.has(eventKey) && !isModalOpen) {
          setProcessedEvents(prev => new Set(prev).add(eventKey));
          setIsModalOpen(true);
          setConfirmMessage(`Activity "${activity.name}" is starting now. Start?`);
          setConfirmAction(() => ({
            onConfirm: () => {
              onUpdateActivity(activity.id, { actualStart: now.toISOString(), status: 'Pending' });
              setShowConfirmModal(false);
              setIsModalOpen(false);
            },
            onCancel: () => {
              onUpdateActivity(activity.id, { actualStart: now.toISOString(), actualEnd: now.toISOString(), status: 'Completed', timeSpent: 0 });
              setShowConfirmModal(false);
              setIsModalOpen(false);
            }
          }));
          setShowConfirmModal(true);
          return null;
        }

        if (diff <= 0) {
          return null;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const timeString = days > 0
          ? `${days.toString().padStart(2, '0')}d:${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m`
          : `${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m`;
        return {
          name: activity.name,
          time: timeString
        };
      }).filter(Boolean);

      // Calculate reminder countdowns with limited sleep reminders
      const newReminderCountdowns = limitedReminders.map(reminder => {
        if (!reminder.endTime || !reminder.name) {
          console.warn('Invalid reminder data:', reminder);
          return null;
        }

        const diff = new Date(reminder.endTime) - now;
        const eventKey = `reminder-${reminder.id}`;

        if (diff <= 0 && diff > -1000 && !processedEvents.has(eventKey) && !isModalOpen) {
          setProcessedEvents(prev => new Set(prev).add(eventKey));
          setIsModalOpen(true);
          setConfirmMessage(`Reminder "${reminder.name}" is due now. Mark as Done?`);
          setConfirmAction(() => ({
            onConfirm: () => {
              onUpdateReminder(reminder.id, { actualEnd: now.toISOString(), status: 'Done', timeSpent: 0 });
              setShowConfirmModal(false);
              setIsModalOpen(false);
            },
            onCancel: () => {
              onUpdateReminder(reminder.id, { status: 'Not Yet' });
              setShowConfirmModal(false);
              setIsModalOpen(false);
            }
          }));
          setShowConfirmModal(true);
          return null;
        }

        if (diff <= 0) {
          return null;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const timeString = days > 0
          ? `${days.toString().padStart(2, '0')}d:${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m`
          : `${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m`;
        return {
          name: reminder.name,
          time: timeString
        };
      }).filter(Boolean);

      setActivityCountdowns(newActivityCountdowns);
      setReminderCountdowns(newReminderCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [activities, limitedReminders, onUpdateActivity, onUpdateReminder, isModalOpen]);

  const groupedActivities = activities
    .filter(activity => !activity.deleted)
    .filter(activity => activity.mode !== 'Sleep')
    .reduce((acc, activity) => {
      const key = `${activity.name}|${activity.priority}|${activity.project || 'None'}`;
      if (!acc[key]) {
        acc[key] = {
          name: activity.name,
          priority: activity.priority,
          project: activity.project,
          totalTimeSet: 0,
          totalTimeSpent: 0,
          count: 0
        };
      }
      const totalTime = (new Date(activity.endTime) - new Date(activity.startTime)) / (1000 * 60);
      acc[key].totalTimeSet += totalTime;
      acc[key].totalTimeSpent += activity.status === 'Completed' ? (activity.timeSpent || 0) : 0;
      acc[key].count += 1;
      return acc;
    }, {});

  const sortedActivities = Object.values(groupedActivities)
    .map(group => ({
      name: group.count > 1 ? `${group.name} (${group.count})` : group.name,
      priority: group.priority,
      project: group.project || 'None',
      totalTimeSet: group.totalTimeSet,
      totalTimeSpent: group.totalTimeSpent,
      completion: group.totalTimeSet ? (group.totalTimeSpent / group.totalTimeSet) * 100 : 0
    }))
    .sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  // Use budgets from BudgetContext (in hours) instead of hardcoded budgetGoals (in minutes)
  const budgetGoals = {
    Work: budgets.Work * 60, // Convert hours to minutes
    Sleep: budgets.Sleep * 60,
    Relax: budgets.Relax * 60,
  };
  const actualTime = { Work: 0, Sleep: 0, Relax: 0 };
  activities
    .filter(activity => !activity.deleted)
    .forEach(activity => {
      if (activity.status === 'Completed' && activity.timeSpent) {
        actualTime[activity.mode] += activity.timeSpent;
      }
    });

  const budgetData = Object.keys(budgetGoals).map(mode => ({
    mode,
    goal: budgetGoals[mode] / 60, // Convert back to hours for display
    actual: actualTime[mode] / 60, // Convert minutes to hours
    utilisation: budgetGoals[mode] ? (actualTime[mode] / budgetGoals[mode]) * 100 : 0
  }));

  const projectData = projects
    .filter(project => !project.deleted)
    .map(project => {
      const timeSet = activities
        .filter(activity => !activity.deleted)
        .filter(activity => activity.project === project.name)
        .reduce((sum, activity) => sum + (new Date(activity.endTime) - new Date(activity.startTime)) / (1000 * 60), 0);
      const timeSpent = activities
        .filter(activity => !activity.deleted)
        .filter(activity => activity.project === project.name && activity.status === 'Completed')
        .reduce((sum, activity) => sum + (activity.timeSpent || 0), 0);
      const milestonesSet = reminders
        .filter(reminder => !reminder.deleted)
        .filter(reminder => reminder.project === project.name).length;
      const milestonesDone = reminders
        .filter(reminder => !reminder.deleted)
        .filter(reminder => reminder.project === project.name && reminder.status === 'Done').length;
      const timePercent = timeSet ? (timeSpent / timeSet) * 100 : 0;
      const milestonePercent = milestonesSet ? (milestonesDone / milestonesSet) * 100 : 0;
      const execution = (timePercent + milestonePercent) / 2;

      return {
        name: project.name,
        timeSet: Math.round(timeSet),
        timeSpent: Math.round(timeSpent),
        milestones: `${milestonesDone}/${milestonesSet}`,
        execution
      };
    });

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-green-800 text-white flex items-center justify-center rounded-lg mr-4">
          HeyBud
        </div>
        <div className="flex space-x-2">
          <Link to="/chatbot" className="px-4 py-2 bg-green-800 text-white rounded hover:bg-green-900">HeyBud</Link>
          <Link to="/budget" className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">Budget</Link>
          <Link to="/plan" className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">Plan</Link>
          <Link to="/settings" className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">Settings</Link>
        </div>
      </div>

      <div className="mb-4">
        <div className="p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Weekly Calendar</h2>
          <style>
            {`
              .fc-daygrid-event {
                display: flex;
                align-items: center;
                padding: 2px !important;
                margin-bottom: 2px !important;
                white-space: normal !important;
              }
              .fc-daygrid-event .fc-event-title {
                font-size: 10px !important;
                font-weight: normal !important;
                line-height: 1.2 !important;
                flex: 1;
              }
            `}
          </style>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridWeek"
            initialDate="2025-04-28"
            firstDay={1}
            events={events}
            headerToolbar={{
              left: '',
              center: 'title',
              right: ''
            }}
            height="200px"
            displayEventTime={false}
            dayCellDidMount={(info) => {
              info.el.addEventListener('dblclick', () => {
                setFormType('Activity');
                setShowAddForm(true);
              });
            }}
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <NotificationPane notifications={formattedNotifications} />
          <div className="mt-4 p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Monthly Calendar</h2>
            <style>
              {`
                .fc-daygrid-event {
                  display: flex;
                  align-items: center;
                  padding: 2px !important;
                  margin-bottom: 2px !important;
                  white-space: normal !important;
                }
                .fc-daygrid-event .fc-event-title {
                  font-size: 10px !important;
                  font-weight: normal !important;
                  line-height: 1.2 !important;
                  flex: 1;
                }
              `}
            </style>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={events}
              headerToolbar={{
                left: '',
                center: 'title',
                right: ''
              }}
              height="600px"
              displayEventTime={false}
              dayCellDidMount={(info) => {
                info.el.addEventListener('dblclick', () => {
                  setFormType('Activity');
                  setShowAddForm(true);
                });
              }}
            />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Daily Calendar</h2>
            <style>
              {`
                .fc-daygrid-event {
                  display: flex;
                  align-items: center;
                  padding: 2px !important;
                  margin-bottom: 2px !important;
                  white-space: normal !important;
                }
                .fc-daygrid-event .fc-event-title {
                  font-size: 10px !important;
                  font-weight: normal !important;
                  line-height: 1.2 !important;
                  flex: 1;
                }
              `}
            </style>
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridDay"
              events={events}
              headerToolbar={{
                left: '',
                center: 'title',
                right: ''
              }}
              height="300px"
              displayEventTime={false}
              dayCellDidMount={(info) => {
                info.el.addEventListener('dblclick', () => {
                  setFormType('Activity');
                  setShowAddForm(true);
                });
              }}
            />
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Countdown</h2>
              {isCountdownExpanded ? (
                <button
                  onClick={() => setIsCountdownExpanded(false)}
                  className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Less
                </button>
              ) : (
                <button
                  onClick={() => setIsCountdownExpanded(true)}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  More
                </button>
              )}
            </div>
            <div
              className={`overflow-y-auto transition-all duration-300 ${
                isCountdownExpanded ? '' : 'max-h-[275px]'
              }`}
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Activity</th>
                    <th className="border p-2">Time Until Start</th>
                    <th className="border p-2">Reminder</th>
                    <th className="border p-2">Time Until End</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(activityCountdowns.length, reminderCountdowns.length) }).map((_, index) => (
                    <tr key={index}>
                      <td className="border p-2">{activityCountdowns[index] ? activityCountdowns[index].name : ''}</td>
                      <td className="border p-2">{activityCountdowns[index] ? activityCountdowns[index].time : ''}</td>
                      <td className="border p-2">{reminderCountdowns[index] ? reminderCountdowns[index].name : ''}</td>
                      <td className="border p-2">{reminderCountdowns[index] ? reminderCountdowns[index].time : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">Activity Completion</h2>
              {isActivityCompletionExpanded ? (
                <button
                  onClick={() => setIsActivityCompletionExpanded(false)}
                  className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Less
                </button>
              ) : (
                <button
                  onClick={() => setIsActivityCompletionExpanded(true)}
                  className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  More
                </button>
              )}
            </div>
            <div
              className={`overflow-y-auto transition-all duration-300 ${
                isActivityCompletionExpanded ? '' : 'max-h-[275px]'
              }`}
            >
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Activity</th>
                    <th className="border p-2">Project</th>
                    <th className="border p-2">Priority</th>
                    <th className="border p-2">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedActivities.map((group, index) => (
                    <tr key={index}>
                      <td className="border p-2">{group.name}</td>
                      <td className="border p-2">{group.project || 'None'}</td>
                      <td className={`border p-2 ${group.priority === 'High' ? 'bg-red-200' : group.priority === 'Medium' ? 'bg-orange-200' : 'bg-yellow-200'}`}>
                        {group.priority}
                      </td>
                      <td className="border p-2">{group.completion.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Budget Utilisation</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Mode</th>
                  <th className="border p-2">Goal</th>
                  <th className="border p-2">Actual</th>
                  <th className="border p-2">Utilisation</th>
                </tr>
              </thead>
              <tbody>
                {budgetData.map(item => (
                  <tr key={item.mode}>
                    <td className="border p-2">{item.mode}</td>
                    <td className="border p-2">{item.goal.toFixed(1)}h</td>
                    <td className="border p-2">{item.actual.toFixed(1)}h</td>
                    <td className="border p-2">
                      <div className="w-full bg-gray-200 rounded">
                        <div
                          className="bg-cyan-500 h-4 rounded"
                          style={{ width: `${Math.min(item.utilisation, 100)}%` }}
                        ></div>
                      </div>
                      {item.utilisation.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Project Progress</h2>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Project</th>
                  <th className="border p-2">Time Set</th>
                  <th className="border p-2">Time Spent</th>
                  <th className="border p-2">Milestones</th>
                  <th className="border p-2">Execution</th>
                </tr>
              </thead>
              <tbody>
                {projectData.map(project => (
                  <tr key={project.name}>
                    <td className="border p-2">{project.name}</td>
                    <td className="border p-2">{project.timeSet}m</td>
                    <td className="border p-2">{project.timeSpent}m</td>
                    <td className="border p-2">{project.milestones}</td>
                    <td className="border p-2">
                      <div className="w-full bg-gray-200 rounded">
                        <div
                          className="bg-cyan-500 h-4 rounded"
                          style={{ width: `${Math.min(project.execution, 100)}%` }}
                        ></div>
                      </div>
                      {project.execution.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddForm && (
        <FormModal
          type={formType}
          onSubmit={
            formType === 'Activity' ? onAddActivity :
            formType === 'Reminder' ? onAddReminder :
            onAddProject
          }
          onClose={() => {
            setShowAddForm(false);
            setFormType('');
          }}
          projects={projects}
        />
      )}
      <ConfirmModal
        isOpen={showConfirmModal}
        message={confirmMessage || 'An event is due. Proceed?'}
        onConfirm={confirmAction ? confirmAction.onConfirm : () => {
          setShowConfirmModal(false);
          setIsModalOpen(false);
        }}
        onCancel={confirmAction ? confirmAction.onCancel : () => {
          setShowConfirmModal(false);
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Dashboard;