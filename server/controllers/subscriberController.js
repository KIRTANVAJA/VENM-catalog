import prisma from '../config/db.js';
import { maskEmail, anonymizeIp, generateCampaignHtml, sendEmail } from '../utils/emailService.js';
import { logActivity } from '../utils/activityLogger.js';

// Strict RFC 5322 compatible email validation
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * ----------------------------------------------------------------------
 * PUBLIC ENDPOINTS
 * ----------------------------------------------------------------------
 */

/**
 * POST /api/subscribers/subscribe
 * Opt-in to marketing emails with explicit affirmative consent.
 */
export const subscribe = async (req, res) => {
  try {
    const { email, marketingConsent, consentWording, consentSource = 'POPUP', honeypot } = req.body;

    // Honeypot spam defense: bots fill this field, real humans don't see it
    if (honeypot && String(honeypot).trim() !== '') {
      // Silently return 200 without saving
      return res.status(200).json({
        success: true,
        message: 'Thank you for your interest in VENM.'
      });
    }

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Require affirmative marketing consent
    if (marketingConsent !== true) {
      return res.status(400).json({
        error: 'Marketing consent checkbox must be affirmatively agreed to before subscribing.'
      });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const anonymized = anonymizeIp(ip);
    const userAgent = req.headers['user-agent']?.substring(0, 255) || 'Unknown Browser';

    const defaultWording = "I agree to receive promotional emails from VENM about new collections, product launches, campaigns and offers. I understand that I can unsubscribe at any time.";
    const activeWording = consentWording?.trim() || defaultWording;

    // Check if email already exists
    const existing = await prisma.emailSubscriber.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      if (existing.status === 'SUBSCRIBED') {
        return res.status(200).json({
          success: true,
          message: 'You are already subscribed to VENM drops & campaign updates.',
          alreadySubscribed: true
        });
      }

      // If previously unsubscribed or suppressed, reactivate on affirmative user action
      const reactivated = await prisma.emailSubscriber.update({
        where: { id: existing.id },
        data: {
          status: 'SUBSCRIBED',
          marketingConsent: true,
          consentTimestamp: new Date(),
          consentSource: consentSource || 'POPUP',
          consentWording: activeWording,
          consentVersion: '1.0',
          unsubscribedAt: null,
          unsubscribeReason: null,
          ipAddress: anonymized,
          userAgent
        }
      });

      await logActivity({
        adminUserId: 'system-subscriber',
        adminEmail: 'public-subscriber',
        action: 'EMAIL_RESUBSCRIBED',
        entityType: 'SUBSCRIBER',
        entityId: reactivated.id,
        entityName: maskEmail(reactivated.email),
        description: `Subscriber ${maskEmail(reactivated.email)} re-opted into promotional emails via ${consentSource}.`
      });

      return res.status(200).json({
        success: true,
        message: 'Welcome back! Your subscription to VENM drops has been reactivated.'
      });
    }

    // Create new subscriber
    const newSubscriber = await prisma.emailSubscriber.create({
      data: {
        email: cleanEmail,
        marketingConsent: true,
        consentTimestamp: new Date(),
        consentSource: consentSource || 'POPUP',
        consentWording: activeWording,
        consentVersion: '1.0',
        status: 'SUBSCRIBED',
        ipAddress: anonymized,
        userAgent
      }
    });

    await logActivity({
      adminUserId: 'system-subscriber',
      adminEmail: 'public-subscriber',
      action: 'EMAIL_SUBSCRIBED',
      entityType: 'SUBSCRIBER',
      entityId: newSubscriber.id,
      entityName: maskEmail(newSubscriber.email),
      description: `New email subscriber ${maskEmail(newSubscriber.email)} subscribed via ${consentSource}.`
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription confirmed. You are now on the list for exclusive VENM drops.'
    });

  } catch (error) {
    console.error('[SUBSCRIBE ERROR]:', error.message);
    return res.status(500).json({ error: 'Subscription request could not be processed at this time.' });
  }
};

/**
 * GET /api/subscribers/unsubscribe-info
 * Verify an unsubscribe token and return public masked subscriber info
 */
export const getUnsubscribeInfo = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Unsubscribe token is required.' });
    }

    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { unsubscribeToken: token }
    });

    if (!subscriber) {
      return res.status(404).json({ error: 'Invalid or expired unsubscribe link.' });
    }

    return res.json({
      valid: true,
      maskedEmail: maskEmail(subscriber.email),
      status: subscriber.status,
      unsubscribedAt: subscriber.unsubscribedAt
    });
  } catch (error) {
    console.error('[UNSUBSCRIBE INFO ERROR]:', error.message);
    return res.status(500).json({ error: 'Unable to verify unsubscribe link.' });
  }
};

/**
 * POST /api/subscribers/unsubscribe
 * Process visitor unsubscribe request
 */
export const unsubscribe = async (req, res) => {
  try {
    const { token, email, reason } = req.body;

    let subscriber = null;

    if (token) {
      subscriber = await prisma.emailSubscriber.findUnique({
        where: { unsubscribeToken: token }
      });
    } else if (email) {
      subscriber = await prisma.emailSubscriber.findUnique({
        where: { email: String(email).trim().toLowerCase() }
      });
    }

    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber record not found or link has expired.' });
    }

    if (subscriber.status === 'UNSUBSCRIBED') {
      return res.json({
        success: true,
        message: 'This email address is already unsubscribed from VENM promotional updates.',
        maskedEmail: maskEmail(subscriber.email)
      });
    }

    // Update status to UNSUBSCRIBED and revoke marketing consent
    const updated = await prisma.emailSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: 'UNSUBSCRIBED',
        marketingConsent: false,
        unsubscribedAt: new Date(),
        unsubscribeReason: reason ? String(reason).substring(0, 255) : 'USER_UNSUBSCRIBE'
      }
    });

    await logActivity({
      adminUserId: 'system-subscriber',
      adminEmail: 'public-visitor',
      action: 'EMAIL_UNSUBSCRIBED',
      entityType: 'SUBSCRIBER',
      entityId: updated.id,
      entityName: maskEmail(updated.email),
      description: `Subscriber ${maskEmail(updated.email)} opted out of marketing emails. Reason: ${reason || 'Direct request'}`
    });

    return res.json({
      success: true,
      message: 'You have been successfully unsubscribed. No further promotional emails will be sent.',
      maskedEmail: maskEmail(updated.email)
    });

  } catch (error) {
    console.error('[UNSUBSCRIBE ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to process unsubscribe request.' });
  }
};

/**
 * ----------------------------------------------------------------------
 * ADMIN ONLY ENDPOINTS (Protected by protectAdmin)
 * ----------------------------------------------------------------------
 */

/**
 * GET /api/admin/subscribers
 * Paginated list of subscribers with search and status filtering
 */
export const getAdminSubscribers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const { status, search } = req.query;

    const where = {};
    if (status && ['SUBSCRIBED', 'UNSUBSCRIBED', 'SUPPRESSED'].includes(status)) {
      where.status = status;
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.email = { contains: search.trim().toLowerCase(), mode: 'insensitive' };
    }

    const [subscribers, total] = await Promise.all([
      prisma.emailSubscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.emailSubscriber.count({ where })
    ]);

    // Aggregate stats
    const [totalContacts, activeSubscribers, unsubscribedContacts, suppressedContacts] = await Promise.all([
      prisma.emailSubscriber.count(),
      prisma.emailSubscriber.count({ where: { status: 'SUBSCRIBED', marketingConsent: true } }),
      prisma.emailSubscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
      prisma.emailSubscriber.count({ where: { status: 'SUPPRESSED' } })
    ]);

    return res.json({
      subscribers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total: totalContacts,
        active: activeSubscribers,
        unsubscribed: unsubscribedContacts,
        suppressed: suppressedContacts,
        consentRate: totalContacts > 0 ? Math.round((activeSubscribers / totalContacts) * 100) : 100
      }
    });

  } catch (error) {
    console.error('[ADMIN GET SUBSCRIBERS ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to load subscriber list.' });
  }
};

/**
 * GET /api/admin/subscribers/export
 * Download CSV of subscriber records for authorized administrators
 */
export const exportSubscribersCsv = async (req, res) => {
  try {
    const subscribers = await prisma.emailSubscriber.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const headers = [
      'Subscriber ID',
      'Email Address',
      'Subscription Status',
      'Marketing Consent',
      'Consent Timestamp',
      'Consent Source',
      'Consent Version',
      'Unsubscribed At',
      'Unsubscribe Reason',
      'Created At'
    ];

    const rows = subscribers.map((sub) => [
      `"${sub.id}"`,
      `"${sub.email}"`,
      `"${sub.status}"`,
      `"${sub.marketingConsent ? 'YES' : 'NO'}"`,
      `"${sub.consentTimestamp ? sub.consentTimestamp.toISOString() : ''}"`,
      `"${sub.consentSource || ''}"`,
      `"${sub.consentVersion || ''}"`,
      `"${sub.unsubscribedAt ? sub.unsubscribedAt.toISOString() : ''}"`,
      `"${(sub.unsubscribeReason || '').replace(/"/g, '""')}"`,
      `"${sub.createdAt.toISOString()}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

    const filename = `venm_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);

  } catch (error) {
    console.error('[CSV EXPORT ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to generate CSV export.' });
  }
};

/**
 * PATCH /api/admin/subscribers/:id/status
 * Manually update a subscriber's status (e.g. Suppress / Unsubscribe / Re-subscribe)
 */
export const updateSubscriberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['SUBSCRIBED', 'UNSUBSCRIBED', 'SUPPRESSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const data = {
      status,
      marketingConsent: status === 'SUBSCRIBED'
    };

    if (status === 'UNSUBSCRIBED' || status === 'SUPPRESSED') {
      data.unsubscribedAt = new Date();
      data.unsubscribeReason = reason || `ADMIN_${status}`;
    } else if (status === 'SUBSCRIBED') {
      data.unsubscribedAt = null;
      data.unsubscribeReason = null;
      data.consentTimestamp = new Date();
    }

    const updated = await prisma.emailSubscriber.update({
      where: { id },
      data
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.exe',
      action: `ADMIN_SUBSCRIBER_${status}`,
      entityType: 'SUBSCRIBER',
      entityId: updated.id,
      entityName: maskEmail(updated.email),
      description: `Admin updated status of ${maskEmail(updated.email)} to ${status}`
    });

    return res.json({ success: true, subscriber: updated });
  } catch (error) {
    console.error('[ADMIN STATUS UPDATE ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to update subscriber status.' });
  }
};

/**
 * POST /api/admin/subscribers/suppress
 * Manually add an email to suppression list
 */
export const suppressEmail = async (req, res) => {
  try {
    const { email, reason } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return res.status(400).json({ error: 'Valid email address required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await prisma.emailSubscriber.findUnique({
      where: { email: cleanEmail }
    });

    let record;
    if (existing) {
      record = await prisma.emailSubscriber.update({
        where: { id: existing.id },
        data: {
          status: 'SUPPRESSED',
          marketingConsent: false,
          unsubscribedAt: new Date(),
          unsubscribeReason: reason || 'MANUAL_ADMIN_SUPPRESSION'
        }
      });
    } else {
      record = await prisma.emailSubscriber.create({
        data: {
          email: cleanEmail,
          marketingConsent: false,
          status: 'SUPPRESSED',
          consentSource: 'ADMIN_SUPPRESSION',
          unsubscribedAt: new Date(),
          unsubscribeReason: reason || 'MANUAL_ADMIN_SUPPRESSION'
        }
      });
    }

    return res.json({ success: true, subscriber: record });
  } catch (error) {
    console.error('[SUPPRESS EMAIL ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to suppress email address.' });
  }
};

/**
 * ----------------------------------------------------------------------
 * EMAIL CAMPAIGN MANAGEMENT (Admin Only)
 * ----------------------------------------------------------------------
 */

/**
 * GET /api/admin/email-campaigns
 * List email campaigns
 */
export const getEmailCampaigns = async (req, res) => {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(campaigns);
  } catch (error) {
    console.error('[GET EMAIL CAMPAIGNS ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to fetch email campaigns.' });
  }
};

/**
 * POST /api/admin/email-campaigns
 * Create a new draft campaign
 */
export const createEmailCampaign = async (req, res) => {
  try {
    const {
      title,
      subject,
      previewText,
      campaignType = 'COLLECTION_ANNOUNCEMENT',
      contentHtml,
      contentText
    } = req.body;

    if (!title || !subject || !contentHtml) {
      return res.status(400).json({ error: 'Title, Subject line, and Campaign Content are required.' });
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        title: title.trim(),
        subject: subject.trim(),
        previewText: previewText?.trim() || '',
        campaignType,
        contentHtml,
        contentText: contentText || '',
        status: 'DRAFT'
      }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.exe',
      action: 'EMAIL_CAMPAIGN_CREATED',
      entityType: 'EMAIL_CAMPAIGN',
      entityId: campaign.id,
      entityName: campaign.title,
      description: `Drafted new email campaign: "${campaign.title}" (${campaignType})`
    });

    return res.status(201).json(campaign);
  } catch (error) {
    console.error('[CREATE EMAIL CAMPAIGN ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to create email campaign.' });
  }
};

/**
 * PUT /api/admin/email-campaigns/:id
 * Update an existing campaign draft
 */
export const updateEmailCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, previewText, campaignType, contentHtml, contentText } = req.body;

    const existing = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    if (existing.status === 'SENT') {
      return res.status(400).json({ error: 'Cannot modify a campaign that has already been dispatched.' });
    }

    const updated = await prisma.emailCampaign.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        subject: subject !== undefined ? subject.trim() : existing.subject,
        previewText: previewText !== undefined ? previewText.trim() : existing.previewText,
        campaignType: campaignType || existing.campaignType,
        contentHtml: contentHtml !== undefined ? contentHtml : existing.contentHtml,
        contentText: contentText !== undefined ? contentText : existing.contentText,
        // If content changed after approval, reset to DRAFT so it must be re-approved
        status: 'DRAFT',
        approvedBy: null,
        approvedAt: null
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('[UPDATE EMAIL CAMPAIGN ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to update email campaign.' });
  }
};

/**
 * POST /api/admin/email-campaigns/:id/approve
 * Explicit administrator review and approval step
 */
export const approveEmailCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const updated = await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: req.user?.email || 'admin@venm.exe',
        approvedAt: new Date()
      }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.exe',
      action: 'EMAIL_CAMPAIGN_APPROVED',
      entityType: 'EMAIL_CAMPAIGN',
      entityId: updated.id,
      entityName: updated.title,
      description: `Admin approved email campaign "${updated.title}" for transmission.`
    });

    return res.json({
      success: true,
      message: 'Campaign reviewed and approved for dispatch.',
      campaign: updated
    });
  } catch (error) {
    console.error('[APPROVE CAMPAIGN ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to approve campaign.' });
  }
};

/**
 * POST /api/admin/email-campaigns/:id/test
 * Send a preview test to the administrator
 */
export const testEmailCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const { testEmail } = req.body;

    const targetEmail = (testEmail || req.user?.email || 'venm1310@gmail.com').trim().toLowerCase();

    const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const html = generateCampaignHtml({
      title: campaign.title,
      previewText: campaign.previewText,
      subject: `[TEST PREVIEW] ${campaign.subject}`,
      campaignType: campaign.campaignType,
      contentHtml: campaign.contentHtml,
      unsubscribeToken: 'test-preview-token',
      clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
    });

    const result = await sendEmail({
      to: targetEmail,
      subject: `[TEST PREVIEW] ${campaign.subject}`,
      html,
      text: campaign.contentText || campaign.title
    });

    return res.json({
      success: true,
      message: `Test preview generated and dispatched to ${maskEmail(targetEmail)}.`,
      result
    });
  } catch (error) {
    console.error('[TEST CAMPAIGN ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to send test preview.' });
  }
};

/**
 * POST /api/admin/email-campaigns/:id/send
 * Dispatch campaign strictly to active contacts with valid marketing consent
 */
export const sendEmailCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    // Enforce approval requirement
    if (campaign.status !== 'APPROVED') {
      return res.status(400).json({
        error: 'Campaign must be explicitly reviewed and approved by an administrator before dispatching.'
      });
    }

    // Query ONLY active subscribers with marketingConsent = true
    const recipients = await prisma.emailSubscriber.findMany({
      where: {
        status: 'SUBSCRIBED',
        marketingConsent: true
      }
    });

    if (recipients.length === 0) {
      return res.status(400).json({
        error: 'No active subscribers with affirmative marketing consent were found.'
      });
    }

    // Set status to SENDING
    await prisma.emailCampaign.update({
      where: { id },
      data: { status: 'SENDING' }
    });

    let sentCount = 0;
    const errors = [];

    // Dispatch loop with individualized unsubscribe tokens
    for (const sub of recipients) {
      try {
        const html = generateCampaignHtml({
          title: campaign.title,
          previewText: campaign.previewText,
          subject: campaign.subject,
          campaignType: campaign.campaignType,
          contentHtml: campaign.contentHtml,
          unsubscribeToken: sub.unsubscribeToken,
          clientUrl: process.env.CLIENT_URL || 'http://localhost:5173'
        });

        await sendEmail({
          to: sub.email,
          subject: campaign.subject,
          html,
          text: campaign.contentText || campaign.title
        });

        sentCount += 1;
      } catch (err) {
        errors.push({ email: maskEmail(sub.email), error: err.message });
      }
    }

    // Update campaign to SENT
    const finalized = await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        recipientCount: sentCount
      }
    });

    await logActivity({
      adminUserId: req.user?.id || 'admin',
      adminEmail: req.user?.email || 'admin@venm.exe',
      action: 'EMAIL_CAMPAIGN_DISPATCHED',
      entityType: 'EMAIL_CAMPAIGN',
      entityId: finalized.id,
      entityName: finalized.title,
      description: `Dispatched campaign "${finalized.title}" to ${sentCount} active subscribers with marketing consent.`
    });

    return res.json({
      success: true,
      message: `Campaign dispatched to ${sentCount} active subscriber(s).`,
      sentCount,
      recipientCount: recipients.length,
      errorsCount: errors.length
    });

  } catch (error) {
    console.error('[SEND CAMPAIGN ERROR]:', error.message);
    return res.status(500).json({ error: 'Failed to dispatch email campaign.' });
  }
};

