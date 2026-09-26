import { Router } from 'express';
import {
  getCategories,
  getAllCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/', getCategories);
router.get('/admin', authenticate, authorize(['ADMIN']), getAllCategoriesAdmin);
router.post('/', authenticate, authorize(['ADMIN']), createCategory);
router.put('/:id', authenticate, authorize(['ADMIN']), updateCategory);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteCategory);

export default router;
