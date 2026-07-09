// Waitlist / capacity gate for the web concierge.
//
// Oia is currently at capacity (50 patients at a time). While WAITLIST_MODE is
// true, the web chat opens with the capacity message and collects only light
// "stay in touch" details (name, WhatsApp, age, procedure, notes) instead of
// running the full clinical intake + SmartMatch. Flip to false to reopen the
// full experience — no other change needed.
export const WAITLIST_MODE = true;

export const WAITLIST_GREETING =
  "Hello, I'm really happy to see you here, and I'd love to help you. At the moment, we are taking 50 patients at a time, and that capacity has currently been reached. As soon as we are able to welcome more patients, I would love to contact you and help you plan your journey.\n\nIn the meantime, could I take a few details so we can stay in touch and understand how we can best support you?";
