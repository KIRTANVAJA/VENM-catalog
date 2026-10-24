import prisma from '../config/db.js';
import { logActivity } from '../utils/activityLogger.js';

export const createInquiry = async (req, res) => {
  try {
    const {
      userId,
      clientName,
      clientContact,
      clientEmail,
      clientPhone,
      userMeta,
      productId,
      productSlug,
      productName,
      productImage,
      productPrice,
      collectionName,
      selectedSize,
      requestType,
      note
    } = req.body;

    if (!productName) {
      return res.status(400).json({ message: 'PRODUCT NAME IS REQUIRED FOR INQUIRY' });
    }

    const effectiveUserId = userId || req.user?.id || null;
    let registeredUser = null;
    if (effectiveUserId) {
      try {
        registeredUser = await prisma.user.findUnique({ where: { id: effectiveUserId } });
      } catch (e) {}
    }

    let validProductId = null;
    if (productId) {
      try {
        const prodExists = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
        if (prodExists) validProductId = prodExists.id;
      } catch (e) {}
    }

    const effectiveName = clientName || registeredUser?.name || req.user?.name || 'Registered Client';
    const effectiveEmail = clientEmail || registeredUser?.email || (clientContact?.includes('@') ? clientContact : null);
    const effectivePhone = clientPhone || registeredUser?.phone || (!clientContact?.includes('@') ? clientContact : null);
    const effectiveContact = clientContact || effectivePhone || effectiveEmail || 'Registered Client';

    const effectiveUserMeta = userMeta && typeof userMeta === 'string'
      ? userMeta
      : JSON.stringify({
          id: registeredUser?.id || effectiveUserId || null,
          name: effectiveName,
          email: effectiveEmail || registeredUser?.email || null,
          phone: effectivePhone || registeredUser?.phone || null,
          role: registeredUser?.role || 'CUSTOMER',
          registeredAt: registeredUser?.createdAt || new Date().toISOString()
        });

    const inquiry = await prisma.inquiry.create({
      data: {
        userId: registeredUser?.id || null,
        clientName: effectiveName,
        clientContact: effectiveContact,
        clientEmail: effectiveEmail || null,
        clientPhone: effectivePhone || null,
        userMeta: effectiveUserMeta,
        productId: validProductId,
        productSlug: productSlug || null,
        productName: productName.trim(),
        productImage: productImage || null,
        productPrice: productPrice || null,
        collectionName: collectionName || null,
        selectedSize: selectedSize || 'Custom',
        requestType: requestType || 'I have my garment',
        note: note || '',
        status: 'SUBMITTED'
      }
    });

    await logActivity({
      adminUserId: registeredUser?.id || effectiveUserId || 'visitor',
      adminEmail: effectiveEmail || effectiveContact,
      action: 'INQUIRY_CREATED',
      entityType: 'INQUIRY',
      entityId: inquiry.id,
      entityName: productName,
      description: `Inquiry submitted for "${productName}" by ${effectiveName} (${effectiveEmail ? `Email: ${effectiveEmail}, ` : ''}${effectivePhone ? `Phone: ${effectivePhone}` : effectiveContact})`
    }).catch(() => {});

    res.status(201).json({
      message: 'INQUIRY SUBMITTED SUCCESSFULLY',
      inquiry
    });
  } catch (error) {
    console.error('[CREATE INQUIRY ERROR]', error);
    res.status(500).json({ message: 'FAILED TO SUBMIT INQUIRY', error: error.message });
  }
};

export const getMyInquiries = async (req, res) => {
  try {
    const user = req.user;
    const { contact, userId } = req.query;

    const orConditions = [];

    if (user?.id) orConditions.push({ userId: user.id });
    if (userId) orConditions.push({ userId });

    const contactToMatch = contact || user?.email || user?.phone;
    if (contactToMatch) {
      orConditions.push({ clientContact: { contains: contactToMatch } });
    }
    if (user?.email) {
      orConditions.push({ clientContact: { contains: user.email } });
    }
    if (user?.phone) {
      orConditions.push({ clientContact: { contains: user.phone } });
    }

    const whereClause = orConditions.length > 0 ? { OR: orConditions } : {};

    const inquiries = await prisma.inquiry.findMany({
      where: whereClause,
      include: {
        product: {
          select: { id: true, name: true, slug: true, images: true, estimatedPrice: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(inquiries);
  } catch (error) {
    console.error('[GET MY INQUIRIES ERROR]', error);
    res.status(500).json({ message: 'FAILED TO FETCH INQUIRIES', error: error.message });
  }
};

export const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }
        },
        product: {
          select: { id: true, name: true, slug: true, images: true, estimatedPrice: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enriched = inquiries.map(inq => {
      let meta = {};
      try { meta = JSON.parse(inq.userMeta || '{}'); } catch (e) {}

      const matchedUser = inq.user;

      return {
        ...inq,
        clientUser: matchedUser || (meta.name ? meta : null),
        clientEmail: inq.clientEmail || matchedUser?.email || meta.email || (inq.clientContact?.includes('@') ? inq.clientContact : null),
        clientPhone: inq.clientPhone || matchedUser?.phone || meta.phone || (!inq.clientContact?.includes('@') ? inq.clientContact : null)
      };
    });

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO FETCH ALL INQUIRIES', error: error.message });
  }
};

export const deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.inquiry.delete({ where: { id } });
    res.json({ message: 'INQUIRY DELETED SUCCESSFULLY' });
  } catch (error) {
    res.status(500).json({ message: 'FAILED TO DELETE INQUIRY', error: error.message });
  }
};
