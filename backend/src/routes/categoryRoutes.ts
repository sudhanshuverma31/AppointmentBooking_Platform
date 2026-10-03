import { Router } from 'express';
import {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { cacheMiddleware, invalidateCache } from '../middleware/cacheMiddleware.js';

const router = Router();

// Cache category list for 1 hour (3600s)
router.get('/', cacheMiddleware(3600, 'categories'), getCategories);
router.get('/admin', authenticate, authorize(['ADMIN']), cacheMiddleware(600, 'categories-admin'), getAllCategoriesAdmin);

// Mutations invalidate category caches
router.post('/', authenticate, authorize(['ADMIN']), invalidateCache('categories'), createCategory);
router.put('/:id', authenticate, authorize(['ADMIN']), invalidateCache('categories'), updateCategory);
router.delete('/:id', authenticate, authorize(['ADMIN']), invalidateCache('categories'), deleteCategory);

export default router;

