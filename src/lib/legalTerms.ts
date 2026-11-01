// ponytail: reduced to constants stub after SaaS legal-gating removal.
// LegalTerms.tsx and LegalPrivacy.tsx now render static content directly.
// Upgrade path: restore DB-backed terms when self-hosted orgs need versioned legal docs.

export const TERMS_DOCUMENT_KEY = "platform_terms";
export const TERMS_DOCUMENT_TITLE = "Terms and Conditions";