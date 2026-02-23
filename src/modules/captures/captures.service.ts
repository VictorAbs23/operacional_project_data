import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { resend } from '../../config/resend.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { hashPassword } from '../../utils/hash.js';
import { generateTempPassword } from '../../utils/token.js';
import { generateFormInstance } from '../forms/formGenerator.service.js';
import { AppError } from '../../middleware/errorHandler.js';

interface DispatchResult {
  accessToken: string;
  clientLink: string;
  clientEmail: string;
  tempPassword?: string;
  emailSent: boolean;
}

export async function dispatchCapture(
  proposal: string,
  mode: 'EMAIL' | 'MANUAL_LINK',
  dispatchedBy: string,
  deadline?: string,
): Promise<DispatchResult> {
  // Verify proposal exists and is CONFIRMED
  const salesOrders = await prisma.salesOrder.findMany({
    where: { proposal },
  });

  if (salesOrders.length === 0) {
    throw new AppError('Proposal not found', 404);
  }

  const firstOrder = salesOrders[0];

  if (firstOrder.status !== 'CONFIRMED') {
    throw new AppError('Proposal is not confirmed. Current status: ' + firstOrder.status, 400, 'NOT_CONFIRMED');
  }

  if (!firstOrder.clientEmail) {
    throw new AppError('Client email is missing from Sales Log', 400, 'NO_EMAIL');
  }

  // Find or create client user
  let clientUser = await prisma.user.findUnique({
    where: { email: firstOrder.clientEmail },
  });

  let tempPassword: string | undefined;

  if (!clientUser) {
    tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    clientUser = await prisma.user.create({
      data: {
        email: firstOrder.clientEmail,
        name: firstOrder.clientName || 'Client',
        passwordHash,
        role: 'CLIENT',
        mustChangePassword: true,
      },
    });
  }

  // Check if access already exists for this user+proposal (re-dispatch scenario)
  const existingAccess = await prisma.clientProposalAccess.findUnique({
    where: {
      userId_proposal: {
        userId: clientUser.id,
        proposal,
      },
    },
    include: { formInstance: true },
  });

  let accessToken: string;
  let accessId: string;

  if (existingAccess) {
    // Re-dispatch: reuse existing access, update mode/deadline
    accessToken = existingAccess.accessToken;
    accessId = existingAccess.id;
    await prisma.clientProposalAccess.update({
      where: { id: existingAccess.id },
      data: {
        dispatchMode: mode,
        dispatchedBy,
        deadline: deadline ? new Date(deadline) : existingAccess.deadline,
        dispatchedAt: new Date(),
      },
    });

    // If no form instance exists yet, create one
    if (!existingAccess.formInstance) {
      await generateFormInstance(existingAccess.id, proposal);
    }
  } else {
    // First dispatch: create new access + form instance
    accessToken = crypto.randomUUID();
    const newAccess = await prisma.clientProposalAccess.create({
      data: {
        userId: clientUser.id,
        proposal,
        accessToken,
        dispatchMode: mode,
        dispatchedBy,
        deadline: deadline ? new Date(deadline) : null,
      },
    });
    accessId = newAccess.id;
    await generateFormInstance(newAccess.id, proposal);
  }

  const clientLink = `${env.FRONTEND_URL}/client`;

  // Send email if mode is EMAIL
  let emailSent = false;
  if (mode === 'EMAIL') {
    if (!resend) {
      logger.error('Resend client not configured — RESEND_API_KEY is missing');
      throw new AppError('Email service is not configured', 500, 'EMAIL_NOT_CONFIGURED');
    }

    try {
      await resend.emails.send({
        from: env.RESEND_FROM,
        to: firstOrder.clientEmail,
        subject: `AbsolutSport Forms — Proposta ${proposal}`,
        html: `
          <div style="font-family: 'Barlow', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #041628; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">AbsolutSport Forms</h1>
            </div>
            <div style="padding: 32px; background-color: #ffffff;">
              <h2 style="color: #0D1117; margin-bottom: 16px;">Olá ${firstOrder.clientName || 'Cliente'},</h2>
              <p style="color: #343A40; line-height: 1.6;">
                Sua proposta <strong>${proposal}</strong> está pronta para o preenchimento dos dados dos passageiros.
              </p>
              <p style="color: #343A40; line-height: 1.6;">
                Acesse o portal com as seguintes credenciais:
              </p>
              <div style="background-color: #F8F9FA; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Link:</strong> <a href="${clientLink}" style="color: #155F97;">${clientLink}</a></p>
                <p style="margin: 4px 0;"><strong>E-mail:</strong> ${firstOrder.clientEmail}</p>
                ${tempPassword ? `<p style="margin: 4px 0;"><strong>Senha temporária:</strong> <code style="background: #EBF3FB; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>` : ''}
              </div>
              ${deadline ? `<p style="color: #F59E0B;"><strong>Prazo limite:</strong> ${new Date(deadline).toLocaleDateString('pt-BR')}</p>` : ''}
              <p style="color: #6C757D; font-size: 14px; margin-top: 24px;">
                Você pode salvar seu progresso e retornar a qualquer momento.
              </p>
            </div>
            <div style="background-color: #F8F9FA; padding: 16px; text-align: center;">
              <p style="color: #ADB5BD; font-size: 12px; margin: 0;">AbsolutSport — World Cup 2026</p>
            </div>
          </div>
        `,
      });
      emailSent = true;
      logger.info(`Email sent to ${firstOrder.clientEmail} for proposal ${proposal}`);
    } catch (err) {
      logger.error('Failed to send email', { error: err, proposal });
      throw new AppError('Failed to send email. Please try again or use manual link.', 502, 'EMAIL_SEND_FAILED');
    }
  }

  return {
    accessToken,
    clientLink,
    clientEmail: firstOrder.clientEmail,
    tempPassword,
    emailSent,
  };
}

export async function getFormSchema(accessId: string) {
  const fieldDefs = await prisma.formFieldDefinition.findMany({
    orderBy: { order: 'asc' },
  });
  return fieldDefs;
}
