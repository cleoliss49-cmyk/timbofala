// PIX Payload Generator for Brazil
// Based on EMV QR Code specification for PIX

export interface PixPayload {
  pixKey: string;
  pixKeyType: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  merchantName: string;
  merchantCity: string;
  amount: number;
  txid?: string;
  description?: string;
}

function pad(id: string, value: string): string {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

function formatCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55')) return '+' + digits;
  return '+55' + digits;
}

function formatPixKey(key: string, keyType: PixPayload['pixKeyType']): string {
  switch (keyType) {
    case 'cpf':
      return formatCPF(key);
    case 'cnpj':
      return formatCNPJ(key);
    case 'phone':
      return formatPhone(key);
    case 'email':
      return key.toLowerCase();
    case 'random':
    default:
      return key;
  }
}

function crc16ccitt(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;
  
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
    crc &= 0xFFFF;
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function generatePixCode(payload: PixPayload): string {
  const formattedKey = formatPixKey(payload.pixKey, payload.pixKeyType);
  const merchantName = payload.merchantName.substring(0, 25).toUpperCase();
  const merchantCity = payload.merchantCity.substring(0, 15).toUpperCase();
  const txid = payload.txid || '***';
  
  // Build the PIX payload according to EMV QR Code specification
  let pixPayload = '';
  
  // Payload Format Indicator (ID 00)
  pixPayload += pad('00', '01');
  
  // Merchant Account Information - PIX (ID 26)
  let merchantAccountInfo = '';
  merchantAccountInfo += pad('00', 'br.gov.bcb.pix'); // GUI
  merchantAccountInfo += pad('01', formattedKey); // PIX Key
  if (payload.description) {
    merchantAccountInfo += pad('02', payload.description.substring(0, 72)); // Description
  }
  pixPayload += pad('26', merchantAccountInfo);
  
  // Merchant Category Code (ID 52)
  pixPayload += pad('52', '0000');
  
  // Transaction Currency (ID 53) - BRL = 986
  pixPayload += pad('53', '986');
  
  // Transaction Amount (ID 54)
  if (payload.amount > 0) {
    pixPayload += pad('54', payload.amount.toFixed(2));
  }
  
  // Country Code (ID 58)
  pixPayload += pad('58', 'BR');
  
  // Merchant Name (ID 59)
  pixPayload += pad('59', merchantName);
  
  // Merchant City (ID 60)
  pixPayload += pad('60', merchantCity);
  
  // Additional Data Field Template (ID 62)
  let additionalData = '';
  additionalData += pad('05', txid); // Reference Label (txid)
  pixPayload += pad('62', additionalData);
  
  // CRC16 placeholder (ID 63)
  pixPayload += '6304';
  
  // Calculate CRC16
  const crc = crc16ccitt(pixPayload);
  pixPayload += crc;
  
  return pixPayload;
}

export function formatPixKeyForDisplay(key: string, keyType: PixPayload['pixKeyType']): string {
  switch (keyType) {
    case 'cpf':
      const cpf = key.replace(/\D/g, '');
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    case 'cnpj':
      const cnpj = key.replace(/\D/g, '');
      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    case 'phone':
      const phone = key.replace(/\D/g, '');
      if (phone.length === 11) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
      return key;
    default:
      return key;
  }
}
