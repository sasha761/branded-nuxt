export function extractProductName(url) {
  if (!url) return;

  const parts = url.split("/");
  return parts[parts.length - 2];
}

export function stripSlug(url) {
  if (!url) return '';

  return url.split('/').filter(Boolean).pop();
}

export function stripLang(url) {
  if (!url) return '';

  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');

  // Если первый сегмент пути равен "uk", возвращаем его
  if (pathParts[1] === 'uk') return pathParts[1];

  return null;
}

export function stripDomain(url) {
  if (!url) return '';

  try {
    const urlObj = new URL(url);
    return urlObj.pathname; 
  } catch (e) {
    console.error("Invalid URL:", url);
    return url; 
  }
}
