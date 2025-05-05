import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { PieChart } from 'react-minimal-pie-chart';
import { BudgetContext } from '../BudgetContext';
import ReportModal from './ReportModal';

const BudgetPage = ({ activities, reminders, projects }) => {
  const { budgets, assignBudget } = useContext(BudgetContext);

  // Temporary local state for sliders before assigning
  const [localBudgets, setLocalBudgets] = useState({
    Work: budgets.Work,
    Sleep: budgets.Sleep,
    Relax: budgets.Relax,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false); // State for report modal

  const totalHours = 168;
  const remainingHours = totalHours - (localBudgets.Work + localBudgets.Sleep + localBudgets.Relax);

  // Function to format hours into hh:mm
  const formatHours = (hours) => {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return `${h}h ${m}m`;
  };

  // Function to calculate percentage (rounded to nearest whole number)
  const calculatePercentage = (hours) => Math.round((hours / totalHours) * 100);

  // Function to handle slider change and ensure total doesn't exceed 168 hours
  const handleSliderChange = (key, value, others) => {
    const newValue = Math.max(0, Math.min(totalHours - others.reduce((a, b) => a + b, 0), value));
    setLocalBudgets(prev => ({ ...prev, [key]: newValue }));
  };

  // Function to handle discrete changes via buttons (in steps of 30 minutes)
  const handleButtonChange = (key, currentValue, others, increment) => {
    const newValue = currentValue + (increment ? 0.5 : -0.5);
    const maxAvailable = totalHours - others.reduce((a, b) => a + b, 0);
    const clampedValue = Math.max(0, Math.min(maxAvailable, newValue));
    setLocalBudgets(prev => ({ ...prev, [key]: clampedValue }));
  };

  // Function to assign the budget
  const handleAssignBudget = () => {
    assignBudget(localBudgets);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // Compute Performance Report Data
  // Define the date range for the last 7 days
  const currentDate = new Date('2025-05-01T00:00:00');
  const sevenDaysAgo = new Date(currentDate);
  sevenDaysAgo.setDate(currentDate.getDate() - 7);

  // Filter activities and reminders for the last 7 days
  const recentActivities = activities
    .filter(activity => !activity.deleted)
    .filter(activity => {
      const startDate = new Date(activity.startTime);
      return startDate >= sevenDaysAgo && startDate <= currentDate;
    });

  const recentReminders = reminders
    .filter(reminder => !reminder.deleted)
    .filter(reminder => {
      const endDate = new Date(reminder.endTime);
      return endDate >= sevenDaysAgo && endDate <= currentDate;
    });

  // Calculate Metrics for the Last 7 Days
  // Number of activities in the last 7 days
  const totalActivitiesLast7Days = recentActivities.length;

  // Calculate completion for each activity and categorize
  let overshotActivities = 0;
  let underutilisedActivities = 0;
  let metBudgetActivities = 0;

  recentActivities.forEach(activity => {
    const scheduledTime = (new Date(activity.endTime) - new Date(activity.startTime)) / (1000 * 60); // in minutes
    const actualTime = activity.status === 'Completed' ? (activity.timeSpent || 0) : 0;
    const completion = scheduledTime ? (actualTime / scheduledTime) * 100 : 0;

    if (completion > 100) {
      overshotActivities++;
    } else if (completion < 100 && completion > 0) {
      underutilisedActivities++;
    } else if (completion === 100) {
      metBudgetActivities++;
    }
  });

  // Calculate hours spent in each mode (Work, Relax, Sleep) in the last 7 days
  const hoursSpent = { Work: 0, Relax: 0, Sleep: 0 };
  recentActivities.forEach(activity => {
    if (activity.status === 'Completed' && activity.timeSpent) {
      hoursSpent[activity.mode] += activity.timeSpent / 60; // Convert minutes to hours
    }
  });

  // Milestones metrics
  const totalMilestonesDone = recentReminders.filter(reminder => reminder.status === 'Done').length;
  const totalMilestonesLapsed = recentReminders.filter(reminder => {
    if (reminder.status !== 'Done') return false;
    const endTime = new Date(reminder.endTime);
    const actualEndTime = new Date(reminder.actualEnd);
    return actualEndTime > endTime;
  }).length;

  // Budget Utilization
  const budgetGoals = {
    Work: budgets.Work,
    Sleep: budgets.Sleep,
    Relax: budgets.Relax,
  };
  const actualTime = { Work: 0, Sleep: 0, Relax: 0 };
  activities
    .filter(activity => !activity.deleted)
    .forEach(activity => {
      if (activity.status === 'Completed' && activity.timeSpent) {
        actualTime[activity.mode] += activity.timeSpent / 60; // Convert minutes to hours
      }
    });

  const budgetData = Object.keys(budgetGoals).map(mode => ({
    mode,
    goal: budgetGoals[mode],
    actual: actualTime[mode],
    utilisation: budgetGoals[mode] ? (actualTime[mode] / budgetGoals[mode]) * 100 : 0,
  }));

  // Activity Completion
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
          count: 0,
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
      completion: group.totalTimeSet ? (group.totalTimeSpent / group.totalTimeSet) * 100 : 0,
    }))
    .sort((a, b) => {
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  // Project Progress
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
        execution,
      };
    });

  // Report Content for Modal
  const reportContent = (
    <div className="space-y-6">
      {/* Overview Metrics for Last 7 Days */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Overview (Last 7 Days)</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Metric</th>
              <th className="border p-2 text-left">Value</th>
            </tr>
          </thead>
          <tbody>
          <tr>
              <td className="border p-2">Hours spent Working</td>
              <td className="border p-2">{formatHours(hoursSpent.Work)}</td>
            </tr>
            <tr>
              <td className="border p-2">Hours spent Relaxing</td>
              <td className="border p-2">{formatHours(hoursSpent.Relax)}</td>
            </tr>
            <tr>
              <td className="border p-2">Hours spent Sleeping</td>
              <td className="border p-2">{formatHours(hoursSpent.Sleep)}</td>
            </tr>
            <tr>
              <td className="border p-2">Total Activities</td>
              <td className="border p-2">{totalActivitiesLast7Days}</td>
            </tr>
            <tr>
              <td className="border p-2">Activities Overshot Budget {'>'}100%</td>
              <td className="border p-2">{overshotActivities}</td>
            </tr>
            <tr>
              <td className="border p-2">Activities Underutilised Budget {'<'}100%</td>
              <td className="border p-2">{underutilisedActivities}</td>
            </tr>
            <tr>
              <td className="border p-2">Activities Met Budget (=100%)</td>
              <td className="border p-2">{metBudgetActivities}</td>
            </tr>
            <tr>
              <td className="border p-2">Total Milestones Lapsed</td>
              <td className="border p-2">{totalMilestonesLapsed}</td>
            </tr>
            <tr>
              <td className="border p-2">Total Milestones Done</td>
              <td className="border p-2">{totalMilestonesDone}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Budget Utilization */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Budget Utilization</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Mode</th>
              <th className="border p-2">Goal (hrs)</th>
              <th className="border p-2">Actual (hrs)</th>
              <th className="border p-2">Utilisation</th>
            </tr>
          </thead>
          <tbody>
            {budgetData.map(item => (
              <tr key={item.mode}>
                <td className="border p-2">{item.mode}</td>
                <td className="border p-2">{item.goal.toFixed(1)}</td>
                <td className="border p-2">{item.actual.toFixed(1)}</td>
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

      {/* Activity Completion */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Activity Completion</h3>
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

      {/* Project Progress */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Project Progress</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">Project</th>
              <th className="border p-2">Time Set (min)</th>
              <th className="border p-2">Time Spent (min)</th>
              <th className="border p-2">Milestones</th>
              <th className="border p-2">Execution</th>
            </tr>
          </thead>
          <tbody>
            {projectData.map(project => (
              <tr key={project.name}>
                <td className="border p-2">{project.name}</td>
                <td className="border p-2">{project.timeSet}</td>
                <td className="border p-2">{project.timeSpent}</td>
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
  );

  // Define the base data for the pie chart
  const basePieData = [
    { title: 'Work', value: localBudgets.Work, color: '#779ECB' },
    { title: 'Sleep', value: localBudgets.Sleep, color: '#B29DD9' },
    { title: 'Relax', value: localBudgets.Relax, color: '#FE6B64' },
  ];

  // Filter out categories with value 0, then add 'Other' if applicable
  const pieData = [
    ...basePieData.filter(entry => entry.value > 0),
    ...(remainingHours > 0 ? [{ title: 'Other', value: remainingHours, color: '#E5E7EB' }] : [])
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Budgeting</h1>
      <Link to="/dashboard" className="mb-4 inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
        Back to Dashboard
      </Link>
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">
          A week has 168 hours / 10,080 mins. How will you spend it?
        </h2>
        <div className="flex flex-col items-center gap-4">
          {/* Pie Chart Section */}
          <div className="flex flex-col items-center">
            <h3 className="text-lg font-bold mb-2 text-center" style={{ color: '#2563eb' }}>
              Time Allocation
            </h3>
            <div className="w-[350px] h-[350px]">
              <PieChart
                data={pieData}
                label={({ dataEntry }) => dataEntry.title}
                labelStyle={{
                  fontSize: '5px',
                  fontWeight: 'bold',
                  fill: '#000000',
                }}
                labelPosition={70}
                radius={40}
                lineWidth={60}
                segmentsShift={1}
              />
            </div>
            {/* Legend Section */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className="w-4 h-4 mr-2"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span>{entry.title}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Sliders Section */}
          <div className="w-full max-w-md">
            {/* Work */}
            <div className="mb-4">
              <label className="block mb-1">
                Work: {formatHours(localBudgets.Work)} ({calculatePercentage(localBudgets.Work)}%)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max={totalHours}
                  step="0.5"
                  value={localBudgets.Work}
                  onChange={(e) => handleSliderChange('Work', parseFloat(e.target.value), [localBudgets.Sleep, localBudgets.Relax])}
                  className="flex-1"
                />
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={formatHours(localBudgets.Work)}
                    readOnly
                    className="w-20 p-2 border rounded text-center"
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleButtonChange('Work', localBudgets.Work, [localBudgets.Sleep, localBudgets.Relax], true)}
                      className="px-1 bg-gray-200 rounded-t hover:bg-gray-300 h-5"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleButtonChange('Work', localBudgets.Work, [localBudgets.Sleep, localBudgets.Relax], false)}
                      className="px-1 bg-gray-200 rounded-b hover:bg-gray-300 h-5"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Sleep */}
            <div className="mb-4">
              <label className="block mb-1">
                Sleep: {formatHours(localBudgets.Sleep)} ({calculatePercentage(localBudgets.Sleep)}%)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max={totalHours}
                  step="0.5"
                  value={localBudgets.Sleep}
                  onChange={(e) => handleSliderChange('Sleep', parseFloat(e.target.value), [localBudgets.Work, localBudgets.Relax])}
                  className="flex-1"
                />
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={formatHours(localBudgets.Sleep)}
                    readOnly
                    className="w-20 p-2 border rounded text-center"
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleButtonChange('Sleep', localBudgets.Sleep, [localBudgets.Work, localBudgets.Relax], true)}
                      className="px-1 bg-gray-200 rounded-t hover:bg-gray-300 h-5"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleButtonChange('Sleep', localBudgets.Sleep, [localBudgets.Work, localBudgets.Relax], false)}
                      className="px-1 bg-gray-200 rounded-b hover:bg-gray-300 h-5"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Relax */}
            <div className="mb-4">
              <label className="block mb-1">
                Relax: {formatHours(localBudgets.Relax)} ({calculatePercentage(localBudgets.Relax)}%)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max={totalHours}
                  step="0.5"
                  value={localBudgets.Relax}
                  onChange={(e) => handleSliderChange('Relax', parseFloat(e.target.value), [localBudgets.Work, localBudgets.Sleep])}
                  className="flex-1"
                />
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={formatHours(localBudgets.Relax)}
                    readOnly
                    className="w-20 p-2 border rounded text-center"
                  />
                  <div className="flex flex-col">
                    <button
                      onClick={() => handleButtonChange('Relax', localBudgets.Relax, [localBudgets.Work, localBudgets.Sleep], true)}
                      className="px-1 bg-gray-200 rounded-t hover:bg-gray-300 h-5"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleButtonChange('Relax', localBudgets.Relax, [localBudgets.Work, localBudgets.Sleep], false)}
                      className="px-1 bg-gray-200 rounded-b hover:bg-gray-300 h-5"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Success Message, Assign Budget Button, and Performance Report Button */}
          <div className="text-center space-y-4">
            {showSuccess && (
              <p className="text-green-500 mb-2 animate-fade-in">Budget Saved!</p>
            )}
            <button
              onClick={handleAssignBudget}
              className="px-6 py-3 bg-blue-500 text-white text-lg font-semibold rounded hover:bg-blue-600 active:scale-95 transition-transform duration-100"
            >
              Assign Budget!
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-6 py-3 bg-green-500 text-white text-lg font-semibold rounded hover:bg-green-600 active:scale-95 transition-transform duration-100"
            >
              Performance Report
            </button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportContent={reportContent}
      />
    </div>
  );
};

export default BudgetPage;