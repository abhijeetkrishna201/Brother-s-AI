/**
 * Email Service using FormSubmit.co and EmailJS
 * Free email services that send emails without backend
 */

interface FeedbackData {
  feedback: string;
  name?: string;
  contact?: string;
}

interface OTPEmailData {
  email: string;
  otpCode: string;
  userName?: string;
}

/**
 * Send OTP email using EmailJS
 * Setup required at https://www.emailjs.com/
 * 
 * SETUP INSTRUCTIONS:
 * Configure EmailJS credentials through Admin Settings → EmailJS tab
 * OR manually update them in App.tsx adminConfig state
 */
export async function sendOTPEmail(data: OTPEmailData): Promise<boolean> {
  try {
    // Validate email
    if (!data.email || !data.email.includes('@')) {
      return false;
    }
    
    // Get EmailJS credentials from localStorage (set via Admin Settings)
    const adminConfig = localStorage.getItem('brothers_ai_admin_config');
    let EMAILJS_SERVICE_ID = '';
    let EMAILJS_TEMPLATE_ID = '';
    let EMAILJS_PUBLIC_KEY = '';
    
    if (adminConfig) {
      try {
        const config = JSON.parse(adminConfig);
        EMAILJS_SERVICE_ID = config.emailJsServiceId || '';
        EMAILJS_TEMPLATE_ID = config.emailJsTemplateId || '';
        EMAILJS_PUBLIC_KEY = config.emailJsPublicKey || '';
      } catch (e) {
        // Silent error
      }
    }
    
    // Check if EmailJS is configured
    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      return false;
    }
    
    // Prepare template parameters
    const templateParams = {
      to_email: data.email,
      to_name: data.userName || 'User',
      otp_code: data.otpCode,
      app_name: "Brother's AI Chatbot",
      from_name: "Brother's AI Team",
      message: `Your verification code is: ${data.otpCode}`,
      year: new Date().getFullYear(),
      // Additional fields that EmailJS might need
      reply_to: data.email,
      user_email: data.email
    };
    
    // Send via EmailJS API
    const requestBody = {
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: templateParams
    };
    
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

export async function sendFeedbackEmail(data: FeedbackData): Promise<boolean> {
  try {
    const timestamp = new Date().toLocaleString();
    
    // Prepare the form data - ALL fields will be included in the email
    const formData = new FormData();
    formData.append('_subject', 'New Feedback - Brother\'s AI Chatbot');
    formData.append('_template', 'table'); // Format as nice HTML table
    formData.append('_captcha', 'false'); // Disable captcha for automated submissions
    formData.append('Feedback Message', data.feedback); // Main feedback
    formData.append('User Name', data.name || 'Anonymous User'); // Name field
    formData.append('Contact Info', data.contact || 'Not provided'); // Contact field
    formData.append('Submitted At', timestamp); // Timestamp
    formData.append('Source', 'Brother\'s AI Chatbot'); // Source identifier

    // Send to FormSubmit.co - this will deliver ALL the above fields to your Gmail
    const response = await fetch('https://formsubmit.co/ajax/abhibudhak@gmail.com', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const result = await response.json();
    
    return result.success === 'true' || result.success === true;
  } catch (error) {
    return false;
  }
}

/**
 * Fallback mailto link
 */
export function openMailtoLink(data: FeedbackData): void {
  const emailBody = `
Feedback:
${data.feedback}

Name: ${data.name || 'Anonymous User'}
Contact: ${data.contact || 'Not provided'}

---
Sent from Brother's AI Chatbot
  `.trim();

  const subject = encodeURIComponent('Feedback for Brother\'s AI Chatbot');
  const body = encodeURIComponent(emailBody);
  const mailtoLink = `mailto:abhibudhak@gmail.com?subject=${subject}&body=${body}`;
  
  window.open(mailtoLink, '_blank');
}
