const { asyncHandler } = require('../middleware/errorHandler');
const authService = require('../services/authService');

const COOKIE_NAME = 'refresh_token';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const result = await authService.login(email, password, req);
  res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
  res.json({ accessToken: result.accessToken, user: result.user });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[COOKIE_NAME];
  const result = await authService.refresh(refreshToken, req);
  res.cookie(COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
  res.json({ accessToken: result.accessToken });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[COOKIE_NAME];
  await authService.logout(refreshToken, req);
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ success: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json(user);
});

module.exports = { login, refresh, logout, me, COOKIE_NAME, COOKIE_OPTIONS };
