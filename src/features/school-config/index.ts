export {
  ALLOWED_LOGO_MIME_TYPES,
  BRAZILIAN_STATES,
  DEFAULT_SCHOOL_PRIMARY_COLOR,
  HEX_COLOR_REGEX,
  MAX_LOGO_BASE64_LENGTH,
  MAX_LOGO_UPLOAD_BYTES,
  SCHOOL_COLOR_PRESETS,
  buildSchoolThemeStyle,
  darkenHexColor,
  hexToRgba,
  normalizeHexColor,
  type SchoolColorPreset,
} from "./constants";
export { getDefaultSchoolConfig, getSchoolConfig } from "./queries";
export {
  updateSchoolConfigSchema,
  type UpdateSchoolConfigInput,
} from "./validation";
export type { SchoolConfigData } from "./types";
