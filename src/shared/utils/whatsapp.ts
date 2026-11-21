/**
 * Normaliza um telefone brasileiro e gera uma URL oficial do WhatsApp Web/App (wa.me).
 * Retorna null se o telefone nao tiver ao menos 10 digitos validos.
 */
export function buildWhatsAppUrl(
  phone: string | null | undefined,
  text: string
): string | null {
  if (!phone) {
    return null;
  }

  let digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }

  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
