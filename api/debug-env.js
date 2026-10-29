import loginHandler from './login.js';

export default async function handler(req, res) {
  let capturedStatus = 200;
  let capturedBody = null;

  const mockRes = {
    status(code) {
      capturedStatus = code;
      return this;
    },
    setHeader() {
      return this;
    },
    json(data) {
      capturedBody = data;
      return this;
    }
  };

  const mockReq = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '181.44.120.10'
    },
    body: { password: 'wrongpassword' }
  };

  let thrown = null;
  try {
    await loginHandler(mockReq, mockRes);
  } catch (err) {
    thrown = {
      message: err.message,
      stack: err.stack
    };
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    capturedStatus,
    capturedBody,
    thrown
  });
}
