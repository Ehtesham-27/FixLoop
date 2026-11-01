import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticket.service';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/feedback/Alert';
import { TicketPriority } from '../../types';

export const CreateTicketPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await ticketService.createTicket({
        title,
        description,
        category,
        building,
        room,
        priority
      });
      navigate('/student/my-tickets');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to submit ticket. (Endpoint is in scaffold stage)';
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
          Provide accurate facility and location details to help technicians resolve it quickly.
        </p>
      </div>

      {error && <Alert type="error" message={error} />}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="title">
            Issue Title
          </label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="e.g., Broken projector in Computer Lab 3"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="Electrical">Electrical (Lights, Fans, Sockets)</option>
              <option value="Plumbing">Plumbing (Leakage, Restrooms)</option>
              <option value="HVAC">HVAC / Air Conditioning</option>
              <option value="Furniture">Furniture & Carpentry</option>
              <option value="IT / AV">IT / AV & Projectors</option>
              <option value="General">General Maintenance</option>
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
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="LOW">Low (Cosmetic, non-urgent)</option>
              <option value="MEDIUM">Medium (Normal fault)</option>
              <option value="HIGH">High (Disrupts classes)</option>
              <option value="CRITICAL">Critical (Safety hazard)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="building">
              Building Name
            </label>
            <input
              id="building"
              type="text"
              required
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Engineering Block B"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="room">
              Room or Location
            </label>
            <input
              id="room"
              type="text"
              required
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="e.g., Room 304 / 3rd Floor hallway"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="description">
            Detailed Description
          </label>
          <textarea
            id="description"
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="Describe the problem, when it started, and any symptoms observed..."
          />
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/student/dashboard')}
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

