import { Router } from 'express';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../types';
import * as authCtrl from '../controllers/authController';
import * as propertyCtrl from '../controllers/propertyController';
import * as leadCtrl from '../controllers/leadController';
import * as dashCtrl from '../controllers/dashboardController';

const router = Router();

// ─── Auth Routes ─────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/logout', authCtrl.logout);
router.get('/auth/me', protect, authCtrl.getMe);
router.put('/auth/me', protect, authCtrl.updateProfile);

// ─── Dashboard ───────────────────────────────────────────
router.get('/dashboard', protect, dashCtrl.getDashboardStats);

// ─── Property Routes ─────────────────────────────────────
router.get('/properties', propertyCtrl.getProperties);
router.get('/properties/nearby', propertyCtrl.getNearbyProperties);
router.get('/properties/stats/market', propertyCtrl.getMarketStats);
router.get('/properties/:id', propertyCtrl.getProperty);
router.post('/properties', protect, propertyCtrl.createProperty);
router.put('/properties/:id', protect, propertyCtrl.updateProperty);
router.delete('/properties/:id', protect, propertyCtrl.deleteProperty);

// ─── Lead Routes ─────────────────────────────────────────
router.get('/leads', protect, leadCtrl.getLeads);
router.get('/leads/search-by-location', protect, leadCtrl.searchLeadsByLocation);
router.get('/leads/stats/overview', protect, leadCtrl.getLeadStats);
router.get('/leads/:id', protect, leadCtrl.getLead);
router.post('/leads', protect, leadCtrl.createLead);
router.put('/leads/:id', protect, leadCtrl.updateLead);
router.post('/leads/:id/notes', protect, leadCtrl.addNote);
router.delete(
  '/leads/:id',
  protect,
  authorize(UserRole.ADMIN, UserRole.BROKER),
  leadCtrl.deleteLead
);

export default router;
