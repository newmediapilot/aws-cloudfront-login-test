// CloudFront Function for authentication check
// Redirects to /login if no 'auth' cookie is present

function handler(event) {
  const request = event.request;
  const headers = request.headers;

  const cookieHeader = headers.cookie ? headers.cookie.value : '';

  // Simple presence check for auth cookie
  if (!cookieHeader.includes('auth=')) {
    // Return redirect response
    return {
      statusCode: 302,
      statusDescription: 'Found',
      headers: {
        location: { value: '/login' },
      },
    };
  }

  // Authenticated – continue request
  return request;
}

exports.handler = handler;
