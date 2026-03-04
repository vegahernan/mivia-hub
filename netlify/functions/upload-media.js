exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { file, filename, type } = JSON.parse(event.body);
    
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const folder = `mivia-hub/${type || 'product'}`;
    const timestamp = Math.round(Date.now() / 1000);
    
    const crypto = require('crypto');
    const signature = crypto
      .createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex');

    const base64Data = file.replace(/^data:[^;]+;base64,/, '');
    
    const formData = [
      `file=data:${filename.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? 'image' : 'video'}/${filename.split('.').pop()};base64,${base64Data}`,
      `api_key=${apiKey}`,
      `timestamp=${timestamp}`,
      `folder=${folder}`,
      `signature=${signature}`
    ].join('&');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    const data = await response.json();

    if (data.secure_url) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          path: data.secure_url,
          size: data.bytes
        })
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: data.error?.message || 'Error subiendo archivo' })
      };
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
};
