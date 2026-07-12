/* Procedure → required photo angles.
 *
 * SINGLE SOURCE OF TRUTH for the Photo Guide. Oia never hard-codes angles in her
 * prompt — she just emits <PHOTOS procedure="..."/> and the widget reads this map,
 * so the angle list can be corrected by the clinical team in one place and can
 * never drift from what Oia says.
 *
 * `key` is a stable slug used to LABEL the stored photo (e.g. left_profile.jpg) so
 * the surgeon receives angle-labelled images, and so a future vision step has the
 * expected pose per file. `label` + `instruction` are what the patient sees.
 *
 * Angles below are standard pre-op photography defaults — DRAFT, pending the
 * clinical partners' sign-off. Adjust freely; the widget adapts to any length.
 */

export interface PhotoAngle {
  key: string;
  label: string;
  instruction: string;
}

// Views reused across face procedures.
const FRONT = { key: 'front', label: 'Front', instruction: 'Face the camera straight on, neutral expression' };
const LEFT_PROFILE = { key: 'left_profile', label: 'Left profile', instruction: 'Turn 90° to your right so we see your full left side' };
const RIGHT_PROFILE = { key: 'right_profile', label: 'Right profile', instruction: 'Turn 90° to your left so we see your full right side' };
const LEFT_THREE_Q = { key: 'left_three_quarter', label: 'Left three-quarter', instruction: 'Turn ~45° to your right — halfway between front and profile' };
const RIGHT_THREE_Q = { key: 'right_three_quarter', label: 'Right three-quarter', instruction: 'Turn ~45° to your left — halfway between front and profile' };

// Views reused across body procedures.
const BODY_FRONT = { key: 'front', label: 'Front', instruction: 'Stand facing the camera, relaxed, arms slightly away from your body' };
const BODY_BACK = { key: 'back', label: 'Back', instruction: 'Turn around so your back faces the camera' };
const BODY_LEFT = { key: 'left_side', label: 'Left side', instruction: 'Turn 90° to your right so we see your left side' };
const BODY_RIGHT = { key: 'right_side', label: 'Right side', instruction: 'Turn 90° to your left so we see your right side' };

// Keys are procedure slugs — the same ones used for <GALLERY procedure="..."/>.
export const PHOTO_ANGLES: Record<string, PhotoAngle[]> = {
  rhinoplasty: [FRONT, LEFT_PROFILE, RIGHT_PROFILE, LEFT_THREE_Q, RIGHT_THREE_Q],
  facelift: [FRONT, LEFT_THREE_Q, RIGHT_THREE_Q, LEFT_PROFILE, RIGHT_PROFILE],
  blepharoplasty: [
    { key: 'front_eyes_open', label: 'Eyes open', instruction: 'Face the camera, eyes open and relaxed' },
    { key: 'front_eyes_closed', label: 'Eyes closed', instruction: 'Face the camera, eyes gently closed' },
    LEFT_PROFILE,
    RIGHT_PROFILE,
  ],
  'breast-augmentation': [
    { key: 'front', label: 'Front', instruction: 'Face the camera, arms relaxed at your sides' },
    LEFT_THREE_Q,
    RIGHT_THREE_Q,
    LEFT_PROFILE,
    RIGHT_PROFILE,
  ],
  abdominoplasty: [
    { key: 'front', label: 'Front', instruction: 'Stand facing the camera, abdomen relaxed' },
    BODY_LEFT,
    BODY_RIGHT,
  ],
  liposuction: [BODY_FRONT, BODY_BACK, BODY_LEFT, BODY_RIGHT],
  'brazilian-butt-lift': [BODY_FRONT, BODY_BACK, BODY_LEFT, BODY_RIGHT],
};

// Fallback when the procedure isn't mapped (or Oia sends an unknown slug): a
// sensible generic set so the patient is never blocked.
export const DEFAULT_ANGLES: PhotoAngle[] = [FRONT, LEFT_PROFILE, RIGHT_PROFILE];

export function anglesFor(procedure?: string | null): PhotoAngle[] {
  if (!procedure) return DEFAULT_ANGLES;
  const slug = procedure.toLowerCase().trim();
  return PHOTO_ANGLES[slug] ?? DEFAULT_ANGLES;
}
