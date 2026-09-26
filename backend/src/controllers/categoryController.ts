import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import { memoryStore } from '../config/memoryStore.js';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      const categories = await Category.find({ isActive: true }).sort({ name: 1 });
      if (categories && categories.length > 0) {
        res.json(categories);
        return;
      }
    }
    res.json(memoryStore.categories);
  } catch (err: any) {
    res.json(memoryStore.categories);
  }
};

export const getAllCategoriesAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 1) {
      const categories = await Category.find().sort({ name: 1 });
      if (categories && categories.length > 0) {
        res.json(categories);
        return;
      }
    }
    res.json(memoryStore.categories);
  } catch (err: any) {
    res.json(memoryStore.categories);
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, icon, description } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Category name is required' });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    if (mongoose.connection.readyState === 1) {
      const existing = await Category.findOne({ slug });
      if (existing) {
        res.status(400).json({ message: 'Category with this name already exists' });
        return;
      }

      const category = await Category.create({
        name,
        slug,
        icon: icon || 'Stethoscope',
        description: description || '',
        isActive: true,
      });

      res.status(201).json(category);
      return;
    }

    const newCat = {
      _id: `cat_${Date.now()}`,
      name,
      slug,
      icon: icon || 'Stethoscope',
      description: description || '',
      isActive: true,
    };
    memoryStore.categories.push(newCat as any);
    res.status(201).json(newCat);
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to create category' });
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, icon, description, isActive } = req.body;

    if (mongoose.connection.readyState === 1) {
      const category = await Category.findById(id);
      if (category) {
        if (name) {
          category.name = name;
          category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        if (icon !== undefined) category.icon = icon;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();
        res.json(category);
        return;
      }
    }

    const cat = memoryStore.categories.find((c) => c._id === id);
    if (cat) {
      if (name) cat.name = name;
      if (description !== undefined) cat.description = description;
      if (isActive !== undefined) cat.isActive = isActive;
      res.json(cat);
      return;
    }

    res.status(404).json({ message: 'Category not found' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const category = await Category.findById(id);
      if (category) {
        category.isActive = false;
        await category.save();
        res.json({ message: 'Category disabled successfully' });
        return;
      }
    }

    const cat = memoryStore.categories.find((c) => c._id === id);
    if (cat) {
      cat.isActive = false;
      res.json({ message: 'Category disabled successfully' });
      return;
    }

    res.status(404).json({ message: 'Category not found' });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to delete category' });
  }
};
