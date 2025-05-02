import { Router, Request, Response, NextFunction } from 'express';
import Project from '../models/Project';
import { auth } from '../middleware/auth';

const router = Router();

// Alle Projekte abrufen
router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await Project.find().populate('client', 'email').populate('freelancer', 'email');
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Neues Projekt anlegen
router.post('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, client, freelancer, status } = req.body;
    const project = new Project({ name, description, client, freelancer, status });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

export default router; 