import React, { useState, useEffect } from 'react';

const FormModal = ({ type, onSubmit, onClose, projects, item }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    startTime: item?.startTime || '',
    endTime: item?.endTime || '',
    priority: item?.priority || 'Low',
    mode: item?.mode || 'Work',
    project: item?.project || '',
    frequency: item?.frequency || 'None',
    status: item?.status || (type === 'Reminder' ? 'Not Yet' : 'Pending'),
  });

  const currentDate = new Date('2025-05-01T00:00:00');
  const minDateTime = currentDate.toISOString().slice(0, 16);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        startTime: item.startTime || '',
        endTime: item.endTime || '',
        priority: item.priority || 'Low',
        mode: item.mode || 'Work',
        project: item.project || '',
        frequency: item.frequency || 'None',
        status: item.status || (type === 'Reminder' ? 'Not Yet' : 'Pending'),
      });
    }
  }, [item, type]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'startTime' || name === 'endTime') {
      const updatedFormData = { ...formData, [name]: value };
      const start = new Date(updatedFormData.startTime);
      const end = new Date(updatedFormData.endTime);

      if (updatedFormData.startTime && updatedFormData.endTime && start >= end) {
        alert('End Time must be after Start Time!');
        return;
      }
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name) {
      alert('Name is required!');
      return;
    }
    if ((type === 'Activity' || type === 'Reminder') && !formData.endTime) {
      alert('End Time is required!');
      return;
    }
    if (type === 'Activity' && !formData.startTime) {
      alert('Start Time is required!');
      return;
    }
    if (type === 'Activity' && formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (start >= end) {
        alert('End Time must be after Start Time!');
        return;
      }
    }

    const newItem = {
      id: item ? item.id : Date.now(),
      name: formData.name,
      ...(type === 'Activity' && { startTime: formData.startTime }),
      endTime: type !== 'Project' ? formData.endTime : undefined,
      priority: formData.priority,
      mode: formData.mode,
      project: formData.project || null,
      frequency: formData.frequency,
      status: type === 'Reminder' ? 'Not Yet' : 'Pending',
      ...(type === 'Activity' && { actualStart: item?.actualStart || null }),
      ...(type === 'Activity' || type === 'Reminder' ? { actualEnd: item?.actualEnd || null } : {}),
      ...(type === 'Activity' || type === 'Reminder' ? { timeSpent: item?.timeSpent || 0 } : {}),
      ...(type === 'Project' && { milestonesSet: item?.milestonesSet || 0 }),
      ...(type === 'Project' && { milestonesDone: item?.milestonesDone || 0 }),
    };

    onSubmit(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">{item ? `Edit ${type}` : `Add ${type}`}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {type === 'Activity' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime ? formData.startTime.slice(0, 16) : ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                min={minDateTime}
              />
            </div>
          )}

          {(type === 'Activity' || type === 'Reminder') && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime ? formData.endTime.slice(0, 16) : ''}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
                min={formData.startTime ? formData.startTime.slice(0, 16) : minDateTime}
              />
            </div>
          )}

          {(type === 'Activity' || type === 'Reminder') && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Mode</label>
            <select
              name="mode"
              value={formData.mode}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="Work">Work</option>
              <option value="Sleep">Sleep</option>
              <option value="Relax">Relax</option>
            </select>
          </div>

          {(type === 'Activity' || type === 'Reminder') && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Project</label>
              <select
                name="project"
                value={formData.project}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">None</option>
                {projects.map(project => (
                  <option key={project.id} value={project.name}>{project.name}</option>
                ))}
              </select>
            </div>
          )}

          {(type === 'Activity' || type === 'Reminder') && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="None">None</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              {item ? `Update ${type}` : `Add ${type}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;