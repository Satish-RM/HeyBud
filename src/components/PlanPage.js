import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import FormModal from './FormModal';
import ConfirmModal from './ConfirmModal';

const PlanPage = ({ activities, reminders, projects, onAddActivity, onAddReminder, onAddProject, onUpdateActivity, onUpdateReminder, onUpdateProject, onDeleteActivity, onDeleteReminder, onDeleteProject }) => {
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [currentTab, setCurrentTab] = useState('Active');
  const [activitySort, setActivitySort] = useState({ column: 'id', direction: 'asc' });
  const [reminderSort, setReminderSort] = useState({ column: 'id', direction: 'asc' });
  const [projectSort, setProjectSort] = useState({ column: 'id', direction: 'asc' });
  const [activityFilters, setActivityFilters] = useState({ status: '', priority: '', project: '', mode: '', frequency: '' });
  const [reminderFilters, setReminderFilters] = useState({ status: '', priority: '', project: '', mode: '', frequency: '' });
  const [projectFilters, setProjectFilters] = useState({ status: '', mode: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Custom Dropdown Component
  const CustomDropdown = React.memo(({ label, value, options, onChange, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const timerRef = useRef(null);
  
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          clearTimeout(timerRef.current);
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        clearTimeout(timerRef.current);
      };
    }, []);
  
    const handleToggle = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (!disabled) {
        if (!isOpen) {
          setIsOpen(true);
          timerRef.current = setTimeout(() => {
            setIsOpen(false);
          }, 5000); // 5 seconds
        } else {
          clearTimeout(timerRef.current);
          setIsOpen(false);
        }
      }
    };
  
    const handleOptionClick = (e, optionValue) => {
      e.stopPropagation();
      clearTimeout(timerRef.current);
      onChange(optionValue);
      setIsOpen(false);
    };
  
    return (
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <button
          type="button"
          onClick={handleToggle}
          className={`w-full p-2 border rounded text-left bg-white flex justify-between items-center ${
            disabled ? 'bg-gray-200 cursor-not-allowed' : 'hover:bg-gray-100'
          }`}
          disabled={disabled}
        >
          <span>{value || options[0].label}</span>
          <span className="ml-2">
            <span
              className={`inline-block border-4 border-transparent border-t-gray-600 transform transition-transform ${
                isOpen ? 'rotate-180' : 'rotate-0'
              }`}
            />
          </span>
        </button>
        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={(e) => handleOptionClick(e, option.value)}
                className="w-full p-2 text-left hover:bg-blue-100"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  });

  const handleEdit = (item, type) => {
    setEditItem(item);
    if (type === 'Activity') setShowActivityModal(true);
    if (type === 'Reminder') setShowReminderModal(true);
    if (type === 'Project') setShowProjectModal(true);
  };

  const handleDelete = (item, type) => {
    setDeleteItem(item);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const handleRestore = (item, type) => {
    if (type === 'Activity') {
      onUpdateActivity(item.id, { ...item, deleted: false });
    } else if (type === 'Reminder') {
      onUpdateReminder(item.id, { ...item, deleted: false });
    } else if (type === 'Project') {
      onUpdateProject(item.id, { ...item, deleted: false });
    }
  };

  const confirmDelete = () => {
    if (deleteType === 'Activity') {
      onUpdateActivity(deleteItem.id, { ...deleteItem, deleted: true });
    } else if (deleteType === 'Reminder') {
      const project = projects.find(p => p.name === deleteItem.project && !p.deleted);
      if (project) {
        const associatedReminders = reminders.filter(r => r.project === project.name && !r.deleted);
        const newMilestonesSet = associatedReminders.length - 1;
        const newMilestonesDone = associatedReminders.filter(r => r.status === 'Done' && r.id !== deleteItem.id).length;
        onUpdateProject(project.id, {
          ...project,
          milestonesSet: newMilestonesSet,
          milestonesDone: newMilestonesDone,
          status: newMilestonesSet === newMilestonesDone && newMilestonesSet > 0 ? 'Done' : 'Active',
        });
      }
      onUpdateReminder(deleteItem.id, { ...deleteItem, deleted: true });
    } else if (deleteType === 'Project') {
      onDeleteProject(deleteItem.id);
    }
    setShowDeleteModal(false);
    setDeleteItem(null);
    setDeleteType('');
  };

  const handleAddReminder = (newReminder) => {
    onAddReminder(newReminder);
    if (newReminder.project) {
      const project = projects.find(p => p.name === newReminder.project && !p.deleted);
      if (project) {
        const associatedReminders = reminders.filter(r => r.project === project.name && !r.deleted);
        const newMilestonesSet = associatedReminders.length + 1;
        onUpdateProject(project.id, {
          ...project,
          milestonesSet: newMilestonesSet,
          milestonesDone: project.milestonesDone || 0,
          status: 'Active',
        });
      }
    }
  };

  const handleUpdateReminder = (id, updatedReminder) => {
    const oldReminder = reminders.find(r => r.id === id);
    onUpdateReminder(id, updatedReminder);

    if (oldReminder.project !== updatedReminder.project) {
      if (oldReminder.project) {
        const oldProject = projects.find(p => p.name === oldReminder.project && !p.deleted);
        if (oldProject) {
          const associatedReminders = reminders.filter(r => r.project === oldProject.name && !r.deleted && r.id !== id);
          const newMilestonesSet = associatedReminders.length;
          const newMilestonesDone = associatedReminders.filter(r => r.status === 'Done').length;
          onUpdateProject(oldProject.id, {
            ...oldProject,
            milestonesSet: newMilestonesSet,
            milestonesDone: newMilestonesDone,
            status: newMilestonesSet === newMilestonesDone && newMilestonesSet > 0 ? 'Done' : 'Active',
          });
        }
      }
      if (updatedReminder.project) {
        const newProject = projects.find(p => p.name === updatedReminder.project && !p.deleted);
        if (newProject) {
          const associatedReminders = reminders.filter(r => r.project === newProject.name && !r.deleted && r.id !== id);
          const newMilestonesSet = associatedReminders.length + 1;
          const newMilestonesDone = associatedReminders.filter(r => r.status === 'Done').length + (updatedReminder.status === 'Done' ? 1 : 0);
          onUpdateProject(newProject.id, {
            ...newProject,
            milestonesSet: newMilestonesSet,
            milestonesDone: newMilestonesDone,
            status: newMilestonesSet === newMilestonesDone && newMilestonesSet > 0 ? 'Done' : 'Active',
          });
        }
      }
    } else if (updatedReminder.project) {
      const project = projects.find(p => p.name === updatedReminder.project && !p.deleted);
      if (project) {
        const associatedReminders = reminders.filter(r => r.project === project.name && !r.deleted);
        const newMilestonesSet = associatedReminders.length;
        const newMilestonesDone = associatedReminders.filter(r => (r.id === id ? updatedReminder.status : r.status) === 'Done').length;
        onUpdateProject(project.id, {
          ...project,
          milestonesSet: newMilestonesSet,
          milestonesDone: newMilestonesDone,
          status: newMilestonesSet === newMilestonesDone && newMilestonesSet > 0 ? 'Done' : 'Active',
        });
      }
    }
  };

  const sortData = (data, sort) => {
    const { column, direction } = sort;
    return [...data].sort((a, b) => {
      let valA = a[column];
      let valB = b[column];

      if (column === 'startTime' || column === 'endTime') {
        valA = new Date(valA);
        valB = new Date(valB);
      }
      if (column === 'priority') {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        valA = priorityOrder[valA] || 0;
        valB = priorityOrder[valB] || 0;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const handleSort = (table, column) => {
    if (table === 'activity') {
      setActivitySort(prev => ({
        column,
        direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    } else if (table === 'reminder') {
      setReminderSort(prev => ({
        column,
        direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    } else if (table === 'project') {
      setProjectSort(prev => ({
        column,
        direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
    return `${day}${suffix} ${month}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const applySearch = (data) => {
    if (!searchTerm) return data;
    return data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const filterActivities = (data) => {
    let filtered = applySearch(data);
    return filtered.filter(activity => (
      (!activityFilters.status || activity.status === activityFilters.status) &&
      (!activityFilters.priority || activity.priority === activityFilters.priority) &&
      (!activityFilters.project || activity.project === activityFilters.project) &&
      (!activityFilters.mode || activity.mode === activityFilters.mode) &&
      (!activityFilters.frequency || activity.frequency === activityFilters.frequency)
    ));
  };

  const filterReminders = (data) => {
    let filtered = applySearch(data);
    return filtered.filter(reminder => (
      (!reminderFilters.status || reminder.status === reminderFilters.status) &&
      (!reminderFilters.priority || reminder.priority === reminderFilters.priority) &&
      (!reminderFilters.project || reminder.project === reminderFilters.project) &&
      (!reminderFilters.mode || reminder.mode === reminderFilters.mode) &&
      (!reminderFilters.frequency || reminder.frequency === reminderFilters.frequency)
    ));
  };

  const filterProjects = (data) => {
    let filtered = applySearch(data);
    return filtered.filter(project => (
      (!projectFilters.status || project.status === projectFilters.status) &&
      (!projectFilters.mode || project.mode === projectFilters.mode)
    ));
  };

  const getActivitiesForTab = () => {
    if (currentTab === 'Active') {
      return activities.filter(activity => !activity.deleted && activity.status !== 'Completed');
    } else if (currentTab === 'Completed') {
      return activities.filter(activity => !activity.deleted && activity.status === 'Completed');
    } else if (currentTab === 'Deleted') {
      return activities.filter(activity => activity.deleted);
    }
    return [];
  };

  const getRemindersForTab = () => {
    if (currentTab === 'Active') {
      return reminders.filter(reminder => !reminder.deleted && reminder.status !== 'Done');
    } else if (currentTab === 'Completed') {
      return reminders.filter(reminder => !reminder.deleted && reminder.status === 'Done');
    } else if (currentTab === 'Deleted') {
      return reminders.filter(reminder => reminder.deleted);
    }
    return [];
  };

  const getProjectsForTab = () => {
    if (currentTab === 'Deleted') {
      return projects.filter(project => project.deleted);
    }
    return projects.filter(project => !project.deleted);
  };

  const ActivitiesTable = () => {
    const filteredActivities = filterActivities(getActivitiesForTab());
    const sortedActivities = sortData(filteredActivities, activitySort);

    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Activities</h2>
        <div className="flex flex-wrap space-x-4 mb-4">
          <CustomDropdown
            label="Filter by Status"
            value={activityFilters.status}
            options={[
              { value: '', label: 'All' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Completed', label: 'Completed' },
            ]}
            onChange={(value) => setActivityFilters({ ...activityFilters, status: value })}
            disabled={currentTab === 'Deleted'}
          />
          <CustomDropdown
            label="Filter by Priority"
            value={activityFilters.priority}
            options={[
              { value: '', label: 'All' },
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
            ]}
            onChange={(value) => setActivityFilters({ ...activityFilters, priority: value })}
            disabled={currentTab === 'Deleted'}
          />
          <CustomDropdown
            label="Filter by Project"
            value={activityFilters.project}
            options={[
              { value: '', label: 'All' },
              ...projects.map(project => ({ value: project.name, label: project.name })),
            ]}
            onChange={(value) => setActivityFilters({ ...activityFilters, project: value })}
            disabled={currentTab === 'Deleted'}
          />
          <CustomDropdown
            label="Filter by Mode"
            value={activityFilters.mode}
            options={[
              { value: '', label: 'All' },
              { value: 'Work', label: 'Work' },
              { value: 'Sleep', label: 'Sleep' },
              { value: 'Relax', label: 'Relax' },
            ]}
            onChange={(value) => setActivityFilters({ ...activityFilters, mode: value })}
            disabled={currentTab === 'Deleted'}
          />
          <CustomDropdown
            label="Filter by Frequency"
            value={activityFilters.frequency}
            options={[
              { value: '', label: 'All' },
              { value: 'None', label: 'None' },
              { value: 'Daily', label: 'Daily' },
              { value: 'Weekly', label: 'Weekly' },
            ]}
            onChange={(value) => setActivityFilters({ ...activityFilters, frequency: value })}
            disabled={currentTab === 'Deleted'}
          />
        </div>
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              {['id', 'name', 'startTime', 'endTime', 'priority', 'mode', 'project', 'frequency', 'status'].map(col => (
                <th
                  key={col}
                  className="py-2 px-4 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('activity', col)}
                >
                  {col === 'startTime' ? 'Start' : col === 'endTime' ? 'End' : col.charAt(0).toUpperCase() + col.slice(1)}
                  {activitySort.column === col ? (activitySort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedActivities.map(activity => (
              <tr key={activity.id}>
                <td className="py-2 px-4 border">{activity.id}</td>
                <td className="py-2 px-4 border">{activity.name}</td>
                <td className="py-2 px-4 border">{activity.startTime ? `${formatTime(activity.startTime)} ${formatDate(activity.startTime)}` : ''}</td>
                <td className="py-2 px-4 border">{activity.endTime ? `${formatTime(activity.endTime)} ${formatDate(activity.endTime)}` : ''}</td>
                <td className="py-2 px-4 border">{activity.priority}</td>
                <td className="py-2 px-4 border">{activity.mode}</td>
                <td className="py-2 px-4 border">{activity.project || 'None'}</td>
                <td className="py-2 px-4 border">{activity.frequency}</td>
                <td className="py-2 px-4 border">{activity.status}</td>
                <td className="py-2 px-4 border space-x-2">
                  {currentTab !== 'Deleted' && activity.status !== 'Completed' && (
                    <button
                      onClick={() => onUpdateActivity(activity.id, {
                        status: 'Completed',
                        actualStart: activity.startTime,
                        actualEnd: activity.endTime,
                        timeSpent: (new Date(activity.endTime) - new Date(activity.startTime)) / (1000 * 60)
                      })}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Complete
                    </button>
                  )}
                  {currentTab !== 'Deleted' && (
                    <button
                      onClick={() => handleEdit(activity, 'Activity')}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                  )}
                  {currentTab !== 'Deleted' && (
                    <button
                      onClick={() => handleDelete(activity, 'Activity')}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  )}
                  {currentTab === 'Deleted' && (
                    <button
                      onClick={() => handleRestore(activity, 'Activity')}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const RemindersTable = () => {
    const filteredReminders = filterReminders(getRemindersForTab());
    const sortedReminders = sortData(filteredReminders, reminderSort);

    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Reminders</h2>
        <div className="flex flex-wrap space-x-4 mb-4">
          <CustomDropdown
            label="Filter by Status"
            value={reminderFilters.status}
            options={[
              { value: '', label: 'All' },
              { value: 'Not Yet', label: 'Not Yet' },
              { value: 'Done', label: 'Done' },
            ]}
            onChange={(value) => setReminderFilters({ ...reminderFilters, status: value })}
            disabled={currentTab === 'Deleted'}
          />
          <CustomDropdown
            label="Filter by Priority"
            value={reminderFilters.priority}
            options={[
              { value: '', label: 'All' },
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
            ]}
            onChange={(value) => setReminderFilters({ ...reminderFilters, priority: value })}
            disabled={currentTab === 'Deleted'}
          />
          <CustomDropdown
            label="Filter by Project"
            value={reminderFilters.project}
            options={[
              { value: '', label: 'All' },
              ...projects.map(project => ({ value: project.name, label: project.name })),
            ]}
            onChange={(value) => setReminderFilters({ ...reminderFilters, project: value })}
            disabled={currentTab === 'Deleted'}
          />
          <CustomDropdown
            label="Filter by Mode"
            value={reminderFilters.mode}
            options={[
              { value: '', label: 'All' },
              { value: 'Work', label: 'Work' },
              { value: 'Sleep', label: 'Sleep' },
              { value: 'Relax', label: 'Relax' },
            ]}
            onChange={(value) => setReminderFilters({ ...reminderFilters, mode: value })}
            disabled={currentTab === 'Deleted'}
          />
          <CustomDropdown
            label="Filter by Frequency"
            value={reminderFilters.frequency}
            options={[
              { value: '', label: 'All' },
              { value: 'None', label: 'None' },
              { value: 'Daily', label: 'Daily' },
              { value: 'Weekly', label: 'Weekly' },
            ]}
            onChange={(value) => setReminderFilters({ ...reminderFilters, frequency: value })}
            disabled={currentTab === 'Deleted'}
          />
        </div>
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              {['id', 'name', 'endTime', 'priority', 'mode', 'project', 'frequency', 'status'].map(col => (
                <th
                  key={col}
                  className="py-2 px-4 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('reminder', col)}
                >
                  {col === 'endTime' ? 'End' : col.charAt(0).toUpperCase() + col.slice(1)}
                  {reminderSort.column === col ? (reminderSort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedReminders.map(reminder => (
              <tr key={reminder.id}>
                <td className="py-2 px-4 border">{reminder.id}</td>
                <td className="py-2 px-4 border">{reminder.name}</td>
                <td className="py-2 px-4 border">{reminder.endTime ? `${formatTime(reminder.endTime)} ${formatDate(reminder.endTime)}` : ''}</td>
                <td className="py-2 px-4 border">{reminder.priority}</td>
                <td className="py-2 px-4 border">{reminder.mode}</td>
                <td className="py-2 px-4 border">{reminder.project || 'None'}</td>
                <td className="py-2 px-4 border">{reminder.frequency}</td>
                <td className="py-2 px-4 border">{reminder.status}</td>
                <td className="py-2 px-4 border space-x-2">
                  {currentTab !== 'Deleted' && reminder.status !== 'Done' && (
                    <button
                      onClick={() => handleUpdateReminder(reminder.id, {
                        status: 'Done',
                        actualEnd: reminder.endTime,
                      })}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Done
                    </button>
                  )}
                  {currentTab !== 'Deleted' && (
                    <button
                      onClick={() => handleEdit(reminder, 'Reminder')}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                  )}
                  {currentTab !== 'Deleted' && (
                    <button
                      onClick={() => handleDelete(reminder, 'Reminder')}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  )}
                  {currentTab === 'Deleted' && (
                    <button
                      onClick={() => handleRestore(reminder, 'Reminder')}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const ProjectsTable = () => {
    const filteredProjects = filterProjects(getProjectsForTab());
    const sortedProjects = sortData(filteredProjects, projectSort);

    const projectData = filteredProjects.map(project => {
      const associatedReminders = reminders.filter(reminder => reminder.project === project.name && !reminder.deleted);
      const milestonesSet = associatedReminders.length;
      const milestonesDone = associatedReminders.filter(reminder => reminder.status === 'Done').length;
      const status = milestonesSet === milestonesDone && milestonesSet > 0 ? 'Done' : 'Active';

      return {
        ...project,
        milestonesSet,
        milestonesDone,
        status,
      };
    });

    const sortedProjectData = sortData(projectData, projectSort);

    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Projects</h2>
        {currentTab !== 'Deleted' && (
          <div className="flex space-x-4 mb-4">
            <CustomDropdown
              label="Filter by Status"
              value={projectFilters.status}
              options={[
                { value: '', label: 'All' },
                { value: 'Active', label: 'Active' },
                { value: 'Done', label: 'Done' },
              ]}
              onChange={(value) => setProjectFilters({ ...projectFilters, status: value })}
            />
            <CustomDropdown
              label="Filter by Mode"
              value={projectFilters.mode}
              options={[
                { value: '', label: 'All' },
                { value: 'Work', label: 'Work' },
                { value: 'Sleep', label: 'Sleep' },
                { value: 'Relax', label: 'Relax' },
              ]}
              onChange={(value) => setProjectFilters({ ...projectFilters, mode: value })}
            />
          </div>
        )}
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              {['id', 'name', 'mode', 'status', 'milestonesSet', 'milestonesDone'].map(col => (
                <th
                  key={col}
                  className="py-2 px-4 border cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('project', col)}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                  {projectSort.column === col ? (projectSort.direction === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedProjectData.map(project => (
              <tr key={project.id}>
                <td className="py-2 px-4 border">{project.id}</td>
                <td className="py-2 px-4 border">{project.name}</td>
                <td className="py-2 px-4 border">{project.mode}</td>
                <td className="py-2 px-4 border">{project.status}</td>
                <td className="py-2 px-4 border">{project.milestonesSet}</td>
                <td className="py-2 px-4 border">{project.milestonesDone}</td>
                <td className="py-2 px-4 border space-x-2">
                  {currentTab !== 'Deleted' && (
                    <button
                      onClick={() => handleEdit(project, 'Project')}
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                  )}
                  {currentTab !== 'Deleted' && (
                    <button
                      onClick={() => handleDelete(project, 'Project')}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  )}
                  {currentTab === 'Deleted' && (
                    <button
                      onClick={() => handleRestore(project, 'Project')}
                      className="bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Restore
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <Link to="/dashboard" className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800">
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold ml-4">Plan Page</h1>
      </div>
      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => setEditItem(null) || setShowActivityModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Activity
        </button>
        <button
          onClick={() => setEditItem(null) || setShowReminderModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Reminder
        </button>
        <button
          onClick={() => setEditItem(null) || setShowProjectModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Project
        </button>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Search by Name</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search activities, reminders, or projects..."
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-6 flex space-x-4">
        {['Active', 'Completed', 'Deleted'].map(tab => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            className={`px-4 py-2 rounded ${currentTab === tab ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <ActivitiesTable />
      <RemindersTable />
      <ProjectsTable />
      {showActivityModal && (
        <FormModal
          type="Activity"
          onSubmit={editItem ? onUpdateActivity : onAddActivity}
          onClose={() => { setShowActivityModal(false); setEditItem(null); }}
          projects={projects}
          item={editItem}
        />
      )}
      {showReminderModal && (
        <FormModal
          type="Reminder"
          onSubmit={editItem ? handleUpdateReminder : handleAddReminder}
          onClose={() => { setShowReminderModal(false); setEditItem(null); }}
          projects={projects}
          item={editItem}
        />
      )}
      {showProjectModal && (
        <FormModal
          type="Project"
          onSubmit={editItem ? onUpdateProject : onAddProject}
          onClose={() => { setShowProjectModal(false); setEditItem(null); }}
          projects={projects}
          item={editItem}
        />
      )}
      {showDeleteModal && (
        <ConfirmModal
          isOpen={showDeleteModal}
          message={`Are you sure you want to delete this ${deleteType.toLowerCase()}?`}
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
};

export default PlanPage;