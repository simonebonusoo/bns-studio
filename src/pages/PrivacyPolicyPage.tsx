import { EditableStaticPage } from "./EditableStaticPage"
import { defaultPrivacyContent, PRIVACY_PAGE_SETTINGS_KEY } from "./static-page-content"

export function PrivacyPolicyPage() {
  return <EditableStaticPage settingsKey={PRIVACY_PAGE_SETTINGS_KEY} fallbackContent={defaultPrivacyContent} />
}
