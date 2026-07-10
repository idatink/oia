// Waitlist / capacity gate for the web concierge.
//
// Oia is at capacity (50 patients). While WAITLIST_MODE is true, the web chat
// opens with the capacity message and then shows a "Continue on WhatsApp" button.
// Capture happens on WhatsApp — the patient taps through and messages Oia first,
// so the thread is theirs (ban-safe) and Oia can warmly re-engage them when a
// place opens. Flip to false to reopen the full concierge experience.
export const WAITLIST_MODE = true;

export const WAITLIST_GREETING =
  "I'm so happy to see you here, and I'd be thrilled to help plan your journey. Right now I can care for 50 patients at a time, and we've just reached that number. But if you write to me by tapping the button below, I'll come straight back to you the moment a new space opens up. 🤍";

// Oia's WhatsApp number (personal facade). Patient taps → opens WhatsApp with a
// pre-filled message → they send first → Oia's replies are all within a thread
// they started (the ban-safe "open road" for re-engagement later).
export const WAITLIST_WHATSAPP_NUMBER = '447752991023';
export const WAITLIST_WHATSAPP_URL =
  `https://wa.me/${WAITLIST_WHATSAPP_NUMBER}?text=` +
  encodeURIComponent("Hi Oia, I'd love to join the waitlist ✨");
