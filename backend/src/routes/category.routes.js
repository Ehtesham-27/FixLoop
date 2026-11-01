import { Router } from 'express';
import { Category } from '../models/Category.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();

// Retrieve all active maintenance categories
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
      .select('name slug description')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });
  })
);

export default router;

