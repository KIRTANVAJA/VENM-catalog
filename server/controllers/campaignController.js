import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH CAMPAIGNS', error: error.message });
  }
};

export const getActiveCampaign = async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { status: 'ACTIVE' }
    });
    res.json(campaign || null);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH ACTIVE CAMPAIGN', error: error.message });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const created = await prisma.campaign.create({
      data: req.body
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'CAMPAIGN_CREATED',
      entityType: 'CAMPAIGN',
      entityId: created.id,
      entityName: created.name,
      description: `Created campaign "${created.name}"`
    });

    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO CREATE CAMPAIGN', error: error.message });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.campaign.update({
      where: { id },
      data: req.body
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'CAMPAIGN_UPDATED',
      entityType: 'CAMPAIGN',
      entityId: updated.id,
      entityName: updated.name,
      description: `Updated campaign "${updated.name}"`
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO UPDATE CAMPAIGN', error: error.message });
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.campaign.delete({ where: { id } });

    await logActivity({
      adminUserId: req.user?.id || 'admin-1',
      adminEmail: req.user?.email || 'venm1310@gmail.com',
      action: 'CAMPAIGN_DELETED',
      entityType: 'CAMPAIGN',
      entityId: id,
      description: `Deleted campaign ID "${id}"`
    });

    res.json({ message: 'CAMPAIGN DELETED SUCCESSFULLY' });
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO DELETE CAMPAIGN', error: error.message });
  }
};
