import express from 'express';
import {
  subscribe,
  unsubscribe,
  getUnsubscribeInfo,
  getAdminSubscribers,
  exportSubscribersCsv,
  updateSubscriberStatus,
  suppressEmail,
  getEmailCampaigns,
  createEmailCampaign,
  updateEmailCampaign,
  approveEmailCampaign,
  testEmailCampaign,
  sendEmailCampaign
} from '../controllers/subscriberController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';
import { subscriberLimiter } from '../middleware/rateLimitMiddleware.js';

const publicRouter = express.Router();
const adminSubscriberRouter = express.Router();
const adminCampaignRouter = express.Router();

// Public Endpoints
publicRouter.post('/subscribe', subscriberLimiter, subscribe);
publicRouter.post('/unsubscribe', unsubscribe);
publicRouter.get('/unsubscribe-info', getUnsubscribeInfo);

// Admin Subscriber Endpoints (Protected)
adminSubscriberRouter.use(protectAdmin);
adminSubscriberRouter.get('/', getAdminSubscribers);
adminSubscriberRouter.get('/export', exportSubscribersCsv);
adminSubscriberRouter.patch('/:id/status', updateSubscriberStatus);
adminSubscriberRouter.post('/suppress', suppressEmail);

// Admin Campaign Endpoints (Protected)
adminCampaignRouter.use(protectAdmin);
adminCampaignRouter.get('/', getEmailCampaigns);
adminCampaignRouter.post('/', createEmailCampaign);
adminCampaignRouter.put('/:id', updateEmailCampaign);
adminCampaignRouter.post('/:id/approve', approveEmailCampaign);
adminCampaignRouter.post('/:id/test', testEmailCampaign);
adminCampaignRouter.post('/:id/send', sendEmailCampaign);

export { publicRouter, adminSubscriberRouter, adminCampaignRouter };
export default publicRouter;

