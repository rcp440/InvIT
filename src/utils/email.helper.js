const nodemailer = require('nodemailer');
const logger     = require('./logger');

const createTransport = () => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

    return nodemailer.createTransport({
        host:   SMTP_HOST,
        port:   parseInt(SMTP_PORT) || 587,
        secure: parseInt(SMTP_PORT) === 465,
        auth:   { user: SMTP_USER, pass: SMTP_PASS },
    });
};

const sendMail = async ({ to, subject, html }) => {
    const transport = createTransport();
    if (!transport) {
        logger.warn({ message: 'SMTP no configurado — email no enviado', to, subject });
        return false;
    }

    try {
        await transport.sendMail({
            from:    process.env.SMTP_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
        });
        return true;
    } catch (err) {
        logger.error({ message: 'Error al enviar email', error: err.message, to, subject });
        return false;
    }
};

const sendResetPassword = async ({ to, nombre, token, appUrl }) => {
    const url = `${appUrl}/#/reset-password?token=${token}`;
    return sendMail({
        to,
        subject: 'Restablecer contraseña — InventarioIT',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
                <h2 style="color:#2c3e50">Restablecer contraseña</h2>
                <p>Hola <strong>${nombre}</strong>,</p>
                <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                <p style="margin:24px 0">
                    <a href="${url}"
                       style="background:#2c3e50;color:#fff;padding:12px 24px;
                              border-radius:4px;text-decoration:none;font-weight:bold">
                        Restablecer contraseña
                    </a>
                </p>
                <p style="color:#666;font-size:13px">
                    Este enlace expira en <strong>1 hora</strong>.<br>
                    Si no solicitaste este cambio, ignorá este email.
                </p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
                <p style="color:#999;font-size:12px">InventarioIT SaaS</p>
            </div>
        `,
    });
};

module.exports = { sendMail, sendResetPassword };
