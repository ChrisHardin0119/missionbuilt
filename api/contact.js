const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, service, budget, message } = req.body;

    // Validate required fields
    if (!name || !email || !service || !budget || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'MissionBuilt.dev <onboarding@resend.dev>',
      to: 'chrishardin.als@gmail.com',
      subject: `New Project Inquiry: ${service}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">New Project Inquiry</h2>
            <p style="margin: 5px 0 0; opacity: 0.9;">from MissionBuilt.dev contact form</p>
          </div>
          <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; font-weight: bold; color: #374151; width: 140px; vertical-align: top;">Name:</td>
                <td style="padding: 10px 0; color: #111827;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold; color: #374151; vertical-align: top;">Email:</td>
                <td style="padding: 10px 0; color: #111827;"><a href="mailto:${email}" style="color: #4f46e5;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold; color: #374151; vertical-align: top;">Service:</td>
                <td style="padding: 10px 0; color: #111827;">${service}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold; color: #374151; vertical-align: top;">Budget:</td>
                <td style="padding: 10px 0; color: #111827;">${budget}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold; color: #374151; vertical-align: top;">Message:</td>
                <td style="padding: 10px 0; color: #111827; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 0.85rem; margin: 0;">
              Reply directly to this email to respond to ${name} at ${email}
            </p>
          </div>
        </div>
      `,
      replyTo: email
    });

    return res.status(200).json({ success: true, message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
};
