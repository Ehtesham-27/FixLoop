import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticket.service';
import { categoryService } from '../../services/category.service';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/feedback/Alert';
import { Category, TicketPriority } from '../../types';
import { Upload, X, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface FilePreview {
  file: File;
  previewUrl: string;
}

export const CreateTicketPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState('');
  const [building, setBuilding] = useState('');
  const [room, setRoom] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    if (!e.target.files) return;

    const incoming = Array.from(e.target.files);

    if (files.length + incoming.length > 3) {
      setFileError('You can attach a maximum of 3 photos per ticket.');
      return;
    }

    const validNewPreviews: FilePreview[] = [];

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError(`Invalid file "${file.name}". Only JPEG, PNG, and WebP images are allowed.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setFileError(`File "${file.name}" exceeds the 5MB maximum size limit.`);
        return;
      }

      validNewPreviews.push({
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }

    setFiles((prev) => [...prev, ...validNewPreviews]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

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
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('building', building.trim());
      formData.append('room', room.trim());
      formData.append('location', `${building.trim()} - ${room.trim()}`);
      formData.append('priority', priority);

      files.forEach((item) => {
        formData.append('images', item.file);
      });

      await ticketService.createTicket(formData);
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

        {/* Photo Upload Section */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Attach Photos (Optional)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Attach up to 3 photos (JPEG, PNG, WebP — max 5MB each) to help technicians locate and assess the issue.
          </p>

          {fileError && (
            <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Trigger button */}
          {files.length < 3 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-slate-400 hover:bg-slate-50/50 transition cursor-pointer flex flex-col items-center justify-center gap-1.5"
            >
              <Upload className="h-5 w-5 text-slate-400" />
              <span className="text-xs font-medium text-slate-700">Click to upload photos</span>
              <span className="text-[11px] text-slate-400">JPEG, PNG, WebP up to 5MB</span>
            </button>
          )}

          {/* Previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              {files.map((item, index) => (
                <div
                  key={index}
                  className="relative group border border-slate-200 rounded-lg overflow-hidden bg-slate-50 aspect-4/3 flex items-center justify-center"
                >
                  <img
                    src={item.previewUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="p-1.5 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[10px] truncate px-1 rounded text-center">
                    {(item.file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                </div>
              ))}
            </div>
          )}
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
