export function isAdmin(user) {
  if (!user) return false;

  const siteManagersStr = process.env.SITE_MANAGERS || process.env.NEXT_PUBLIC_SITE_MANAGERS || '{}';
  
  try {
    const siteManagers = JSON.parse(siteManagersStr);
    const admin = siteManagers?.admin;
    
    if (!admin) return false;

    // Check both user id and email to tighten it as requested
    return user.email === admin.email && user.id === admin.id;
  } catch (error) {
    console.error('Failed to parse SITE_MANAGERS for isAdmin check', error);
    return false;
  }
}
