import { ticketService } from '../services/ticket.service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { cloudinaryConfigured, uploadBufferToCloudinary } from '../config/cloudinary.js';

export const createTicket = asyncHandler(async (req, res) => {
  const uploadedFiles = [];
  if (req.files) {
    if (Array.isArray(req.files)) {
      uploadedFiles.push(...req.files);
    } else {
      if (req.files.images) uploadedFiles.push(...req.files.images);
      if (req.files.image) uploadedFiles.push(...req.files.image);
    }
  } else if (req.file) {
    uploadedFiles.push(req.file);
  }

  let images;

  if (cloudinaryConfigured && uploadedFiles.length > 0) {
    // Upload each buffer to Cloudinary; store the persistent secure_url
    const cloudinaryResults = await Promise.all(
      uploadedFiles.map((f) => uploadBufferToCloudinary(f.buffer, f.originalname, f.mimetype))
    );
    images = cloudinaryResults.map((result, i) => ({
      fileName: result.public_id,
      originalName: uploadedFiles[i].originalname,
      mimeType: uploadedFiles[i].mimetype,
      size: result.bytes,
      url: result.secure_url
    }));
  } else {
    // Development disk storage: build /uploads/ relative URL
    images = uploadedFiles.map((f) => ({
      fileName: f.filename,
      originalName: f.originalname,
      mimeType: f.mimetype,
      size: f.size,
      url: `/uploads/${f.filename}`
    }));
  }

  const ticketData = {
    ...req.body,
    images: images.length > 0 ? images : req.body.images || []
  };

  const ticket = await ticketService.createTicket(ticketData, req.user);

  res.status(201).json({
    success: true,
    message: 'Ticket created successfully',
    data: {
      ticket
    }
  });
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const { tickets, pagination } = await ticketService.getReporterTickets(req.user._id, req.query);

  res.status(200).json({
    success: true,
    data: {
      tickets,
      pagination
    }
  });
});

export const getAssignedTickets = asyncHandler(async (req, res) => {
  const { tickets, pagination } = await ticketService.getAssignedTickets(req.user._id, req.query);

  res.status(200).json({
    success: true,
    data: {
      tickets,
      pagination
    }
  });
});

export const getAllTickets = asyncHandler(async (req, res) => {
  const { tickets, pagination } = await ticketService.getAllTickets(req.query);

  res.status(200).json({
    success: true,
    data: {
      tickets,
      pagination
    }
  });
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: {
      ticket
    }
  });
});

export const assignTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.assignTechnician(req.params.id, req.body.technicianId, req.user);

  res.status(200).json({
    success: true,
    message: 'Technician assigned successfully',
    data: {
      ticket
    }
  });
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicketStatus(
    req.params.id,
    req.body.status,
    req.body.resolutionNote,
    req.user
  );

  res.status(200).json({
    success: true,
    message: 'Ticket status updated successfully',
    data: {
      ticket
    }
  });
});

export const updateTicketPriority = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicketPriority(req.params.id, req.body.priority, req.user);

  res.status(200).json({
    success: true,
    message: 'Ticket priority updated successfully',
    data: {
      ticket
    }
  });
});

export const getTicketActivity = asyncHandler(async (req, res) => {
  const activity = await ticketService.getTicketActivity(req.params.id, req.user);

  res.status(200).json({
    success: true,
    data: {
      activity
    }
  });
});
