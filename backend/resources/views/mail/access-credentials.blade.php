<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Credenciales de acceso</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;overflow:hidden;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
                    <tr>
                        <td style="background:#059669;padding:24px 32px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:20px;">Sembrando Per&uacute;</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">Hola <strong>{{ $recipientName }}</strong>,</p>
                            <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.6;">
                                Tu correo para acceder al sistema es <strong>{{ $emailAddress }}</strong> y tu contrase&ntilde;a temporal es:
                            </p>
                            <div style="margin-bottom:24px;border:1px solid #e2e8f0;border-radius:8px;background:#f1f5f9;padding:14px 20px;text-align:center;">
                                <code style="color:#059669;font-size:18px;font-weight:700;letter-spacing:1px;">{{ $temporaryPassword }}</code>
                            </div>
                            <p style="margin:0 0 24px;text-align:center;">
                                <a href="{{ $loginUrl }}" style="display:inline-block;border-radius:8px;background:#059669;padding:12px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">Ir al sistema</a>
                            </p>
                            <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;text-align:center;">
                                Deber&aacute;s cambiar esta contrase&ntilde;a cuando ingreses por primera vez.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>