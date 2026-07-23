const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

function getUploadBaseUrl(req) {
  // Deploy config: prefer SERVER_URL for public upload URLs behind proxies/CDNs.
  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0];
  const publicServerUrl = process.env.SERVER_URL
    ? trimTrailingSlash(process.env.SERVER_URL)
    : `${forwardedProtocol || req.protocol}://${req.get("host")}`;

  return `${publicServerUrl}/uploads/`;
}

module.exports = { getUploadBaseUrl };
