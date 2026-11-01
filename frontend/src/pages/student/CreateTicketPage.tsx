import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticket.service';
import { categoryService } from '../../services/category.service';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/feedback/Alert';
import { Category, TicketPriority } from '../../types';

export const CreateTicketPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    categoryService
      .getCategories()
      .then((cats) => {
        setCategories(cats);
        if (cats.length > 0) {
          setCategory(cats[0].slug || cats[0]._id);
        }
      })
      .catch(() => {
        setError('Could not load categories. Please refresh.');
      })
      .finally(() => setIsLoadingCategories(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      setError('Please select a maintenance category');
      return;
    }

    if (!building.trim() || !room.trim()) {
      setError('Please specify both the building and room/location');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await ticketService.createTicket({
        title,
        description,
        category,
        building: building.trim(),
        room: room.trim(),
        location: `${building.trim()} - ${room.trim()}`,
        priority
      });

      navigate('/student/my-tickets');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to submit maintenance ticket. Please verify all fields.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Report Campus Issue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Provide accurate facility and location details to help maintenance staff resolve the problem quickly.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="title">
            Issue Summary / Title *
          </label>
          <input
            id="title"
            type="text"
            required
            minLength={5}
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="e.g., Broken projector in Computer Science Lab 2"
          />
          <span className="text-xs text-slate-400 mt-1 block">5 to 150 characters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="category">
              Maintenance Category *
            </label>
            <select
              id="category"
              disabled={isLoadingCategories}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              {categories.map((cat) => (
                <option key={cat._id} value={cat.slug || cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="priority">
              Suggested Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="LOW">Low (Cosmetic, non-urgent)</option>
              <option value="MEDIUM">Medium (Normal daily fault)</option>
              <option value="HIGH">High (Disrupts classes or lab work)</option>
              <option value="CRITICAL">Critical (Immediate safety or water hazard)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="building">
              Building Name *
            </label>
            <input
              id="building"
              type="text"
              required
              maxLength={100}
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Engineering Block B"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="room">
              Room or Precise Location *
            </label>
            <input
              id="room"
              type="text"
              required
              maxLength={100}
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Room 304 / 3rd Floor East Hall"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="description">
            Detailed Description *
          </label>
          <textarea
            id="description"
            rows={4}
            required
            minLength={10}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Describe the issue in detail: when was it noticed, symptoms, and anything relevant..."
          />
          <span className="text-xs text-slate-400 mt-1 block">10 to 2000 characters</span>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/student/dashboard')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Submit Ticket
          </Button>
        </div>
      </form>
    </div>
  );
};
