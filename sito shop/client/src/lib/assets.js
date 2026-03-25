import { API_URL } from "./api";

const API_ORIGIN = API_URL.replace(/\/api$/, "");

export function resolveAssetUrl(url) {
  if (!url) {
    return "";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${API_ORIGIN}${url}`;
}
