import dns from 'dns/promises';

/**
 * Checks if an IPv4 or IPv6 string is private, loopback, link-local, or cloud metadata.
 */
export function isPrivateOrLoopbackIP(ip: string): boolean {
  // Normalize IPv6 mapped IPv4 e.g. ::ffff:127.0.0.1
  if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  // Check IPv6 loopback / unique local / link-local
  if (ip === '::1' || ip === '::' || ip.toLowerCase().startsWith('fe80:') || ip.toLowerCase().startsWith('fc') || ip.toLowerCase().startsWith('fd')) {
    return true;
  }

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return false; // not standard IPv4
  }

  const [a, b, c, d] = parts;

  // 0.0.0.0/8
  if (a === 0) return true;
  // 10.0.0.0/8 (Private)
  if (a === 10) return true;
  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;
  // 169.254.0.0/16 (Link Local & AWS/GCP Metadata 169.254.169.254)
  if (a === 169 && b === 254) return true;
  // 172.16.0.0/12 (Private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (Private)
  if (a === 192 && b === 168) return true;
  // 255.255.255.255 (Broadcast)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true;

  return false;
}

/**
 * Validates a target URL against SSRF threats.
 * Resolves DNS to ensure no private/loopback/cloud-metadata IP is targeted.
 */
export async function validateUrlForSSRF(urlString: string): Promise<{ valid: boolean; error?: string; url?: URL }> {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    return { valid: false, error: 'Malformed URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, error: `Disallowed protocol: ${parsed.protocol}. Only HTTP and HTTPS are permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block obvious localhost / internal hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '0.0.0.0' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  ) {
    return { valid: false, error: 'SSRF blocked: Access to localhost/internal addresses is strictly prohibited.' };
  }

  // If host is direct IP
  if (isPrivateOrLoopbackIP(hostname.replace(/^\[|\]$/g, ''))) {
    return { valid: false, error: `SSRF blocked: IP ${hostname} is private or loopback.` };
  }

  // Resolve hostname via DNS
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const record of addresses) {
      if (isPrivateOrLoopbackIP(record.address)) {
        return {
          valid: false,
          error: `SSRF blocked: Hostname ${hostname} resolves to protected IP ${record.address}.`
        };
      }
    }
  } catch (dnsErr: any) {
    return { valid: false, error: `DNS resolution failed for ${hostname}: ${dnsErr.message}` };
  }

  return { valid: true, url: parsed };
}
