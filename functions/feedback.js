// Cloudflare Pages Function for sending feedback emails via Maileroo
// Endpoint: POST /api/feedback

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    // Parse the request body
    const body = await request.json();
    const { rating, howToTen, anythingElse, wantsContact, contactEmail, userAgent, timestamp } = body;

    // Validate required fields
    if (rating === undefined || rating === null) {
      return new Response(JSON.stringify({ error: 'Rating is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Construct email content
    const subject = `SchoolPlanner Feedback - Rating: ${rating}/10`;
    
    let htmlContent = `
      <h2>New SchoolPlanner Feedback</h2>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Rating</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${rating}/10</td>
        </tr>
    `;

    if (rating < 10 && howToTen) {
      htmlContent += `
        <tr>
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">How to get to 10</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(howToTen)}</td>
        </tr>
      `;
    }

    if (anythingElse) {
      htmlContent += `
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Additional Comments</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(anythingElse)}</td>
        </tr>
      `;
    }

    if (wantsContact && contactEmail) {
      htmlContent += `
        <tr>
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Contact Email</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(contactEmail)}</td>
        </tr>
      `;
    }

    htmlContent += `
        <tr style="background-color: #f8f9fa;">
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Timestamp</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${timestamp || new Date().toISOString()}</td>
        </tr>
    `;

    if (userAgent) {
      htmlContent += `
        <tr>
          <td style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">User Agent</td>
          <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(userAgent)}</td>
        </tr>
      `;
    }

    htmlContent += `</table>`;

    // Send email via Maileroo
    const mailerooApiKey = env.MAILEROO_API_KEY;
    
    if (!mailerooApiKey) {
      return new Response(JSON.stringify({ error: 'Maileroo API key not configured' }), {
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
      const errorData = await mailerooResponse.text();
      console.error('Maileroo API error:', errorData);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: errorData }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Feedback sent successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Feedback API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to escape HTML special characters
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
