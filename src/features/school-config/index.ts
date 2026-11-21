export {
  ALLOWED_LOGO_MIME_TYPES,
  BRAZILIAN_STATES,
  MAX_LOGO_BASE64_LENGTH,
  MAX_LOGO_UPLOAD_BYTES,
} from "./constants";
export { getSchoolConfig } from "./queries";
export {
  updateSchoolConfigSchema,
  type UpdateSchoolConfigInput,
} from "./validation";
export type { SchoolConfigData } from "./types";
