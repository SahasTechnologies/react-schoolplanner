// Cloudflare Pages Function for sending feedback emails via Maileroo
// Endpoint: POST /api/feedback or POST /feedback

const MAX_PAYLOAD_BYTES = 10 * 1024; // 10KB
const MAX_TEXT_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 100;
const MAX_UA_LENGTH = 300;

// Simple in-memory rate limiter per edge instance
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.startTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { startTime: now, count: 1 });
    return false;
  }
  entry.count++;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  return false;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
    if (isRateLimited(clientIp)) {
      return new Response(JSON.stringify({ error: 'Too many requests. Please try again later.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const rawBody = await request.text();
    if (rawBody.length > MAX_PAYLOAD_BYTES) {
      return new Response(JSON.stringify({ error: 'Payload too large' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { rating, howToTen, anythingElse, wantsContact, contactEmail, userAgent } = body;

    // Validate rating strictly (integer between 0 and 10)
    const numRating = Number(rating);
    if (rating === undefined || rating === null || !Number.isInteger(numRating) || numRating < 0 || numRating > 10) {
      return new Response(JSON.stringify({ error: 'Rating must be an integer between 0 and 10' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sanitize string inputs
    const safeHowToTen = typeof howToTen === 'string' ? howToTen.slice(0, MAX_TEXT_LENGTH).trim() : '';
    const safeAnythingElse = typeof anythingElse === 'string' ? anythingElse.slice(0, MAX_TEXT_LENGTH).trim() : '';
    const safeWantsContact = Boolean(wantsContact);
    let safeContactEmail = '';
    if (safeWantsContact && typeof contactEmail === 'string') {
      safeContactEmail = contactEmail.slice(0, MAX_EMAIL_LENGTH).trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (safeContactEmail && !emailRegex.test(safeContactEmail)) {
        return new Response(JSON.stringify({ error: 'Invalid contact email address' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const safeUserAgent = typeof userAgent === 'string' ? userAgent.slice(0, MAX_UA_LENGTH).trim() : '';
    const serverTimestamp = new Date().toISOString();

    // Construct email content
    const subject = `SchoolPlanner Feedback - Rating: ${numRating}/10`;
    
    let htmlContent = `
      <h2>New SchoolPlanner Feedback</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Rating</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(String(numRating))}/10</td>
        </tr>
    `;

    if (numRating < 10 && safeHowToTen) {
      htmlContent += `
        <tr>
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">How to get to 10</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(safeHowToTen)}</td>
        </tr>
      `;
    }

    if (safeAnythingElse) {
      htmlContent += `
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Additional Comments</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(safeAnythingElse)}</td>
        </tr>
      `;
    }

    if (safeWantsContact && safeContactEmail) {
      htmlContent += `
        <tr>
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Contact Email</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(safeContactEmail)}</td>
        </tr>
      `;
    }

    htmlContent += `
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Timestamp</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(serverTimestamp)}</td>
        </tr>
    `;

    if (safeUserAgent) {
      htmlContent += `
        <tr>
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">User Agent</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(safeUserAgent)}</td>
        </tr>
      `;
    }

    htmlContent += `</table>`;

    // Send email via Maileroo
    const mailerooApiKey = env.MAILEROO_API_KEY;
    
    if (!mailerooApiKey) {
      return new Response(JSON.stringify({ error: 'Email service configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const mailerooResponse = await fetch('https://api.maileroo.com/v1/send', {
      method: 'POST',
      headers: {
        'X-API-Key': mailerooApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SchoolPlanner Feedback <feedback@shimpi.dev>',
        to: 'sahas@shimpi.dev',
        subject: subject,
        html: htmlContent
      })
    });

    if (!mailerooResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to deliver feedback' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Feedback sent successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to escape HTML special characters
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
