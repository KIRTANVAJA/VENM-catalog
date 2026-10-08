import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

const formatCampaign = (c) => ({
  ...c,
  festivalControls: {
    lights: Boolean(c.festivalLights),
    dandiya: Boolean(c.dandiya),
    chunri: Boolean(c.chunri),
    bangles: Boolean(c.bangles),
    festivalGlow: Boolean(c.festivalGlow)
  }
});

export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(campaigns.map(formatCampaign));
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH CAMPAIGNS', error: error.message });
  }
};

export const getActiveCampaign = async (req, res) => {
  try {
    const campaign = await prisma.campaign.findFirst({
      where: { status: 'ACTIVE' }
    });
    res.json(campaign ? formatCampaign(campaign) : null);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH ACTIVE CAMPAIGN', error: error.message });
  }
};

export const createCampaign = async (req, res) => {
  try {
    const body = { ...req.body };
    delete body.id;
    delete body.createdAt;
    delete body.updatedAt;

    if (!body.slug && body.name) {
      body.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    if (body.festivalControls) {
      if (body.festivalControls.lights !== undefined) body.festivalLights = Boolean(body.festivalControls.lights);
      if (body.festivalControls.dandiya !== undefined) body.dandiya = Boolean(body.festivalControls.dandiya);
      if (body.festivalControls.chunri !== undefined) body.chunri = Boolean(body.festivalControls.chunri);
      if (body.festivalControls.bangles !== undefined) body.bangles = Boolean(body.festivalControls.bangles);
      if (body.festivalControls.festivalGlow !== undefined) body.festivalGlow = Boolean(body.festivalControls.festivalGlow);
      delete body.festivalControls;
    }

    const created = await prisma.campaign.create({
      data: body
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

    res.status(201).json(formatCampaign(created));
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO CREATE CAMPAIGN', error: error.message });
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const body = { ...req.body };
    delete body.id;
    delete body.createdAt;
    delete body.updatedAt;

    if (body.festivalControls) {
      if (body.festivalControls.lights !== undefined) body.festivalLights = Boolean(body.festivalControls.lights);
      if (body.festivalControls.dandiya !== undefined) body.dandiya = Boolean(body.festivalControls.dandiya);
      if (body.festivalControls.chunri !== undefined) body.chunri = Boolean(body.festivalControls.chunri);
      if (body.festivalControls.bangles !== undefined) body.bangles = Boolean(body.festivalControls.bangles);
      if (body.festivalControls.festivalGlow !== undefined) body.festivalGlow = Boolean(body.festivalControls.festivalGlow);
      delete body.festivalControls;
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: body
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

    res.json(formatCampaign(updated));
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
