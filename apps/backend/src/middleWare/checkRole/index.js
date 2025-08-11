const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ message: 'Forbidden: User not authenticated' });
    }
    const role = req.user.role;
    console.log('User role:', role);
    if (roles.includes(role)) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  };
};

export default checkRole;
