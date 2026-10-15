# Public Extraction Resistance Boundary

Infrastructure Product Works is intentionally demonstrable without publishing the implementation recipe.

## Increment 1: credential and artifact leakage

This first gate is intentionally narrow and additive. It does **not** remove, rewrite, score, or hide existing website content.

It fails closed on:
- conventional dotenv files and variants;
- private-key files and private-key signatures;
- GitHub, AWS, OpenAI, and Google API credential signatures, including bounded JSON-escaped representations;
- source maps;
- Terraform state and state backups;
- conventional machine-readable OpenAPI/Swagger specification filenames.

Later increments will separately address:
1. private implementation-repository/reference exposure; and
2. content, diagram, and demo-surface preservation.

Those concerns are intentionally split so each protection can be reviewed, merged, and verified independently without blocking the others.

Anything committed to this public repository must still be treated as disclosed.

## Regression evidence and limits

Run `python3 scripts/test_public_security_gates.py -v` to exercise the actual scanner processes with synthetic credentials, JSON escaping, chunk boundaries, binary assets, credential-bearing filenames/directories, restricted references in public paths, immutable CI baselines, and private-reference families. Fixtures construct fake values at runtime so no credential-looking values are committed. The extraction CI job runs these cases before scanning the repository.

The private-reference gate is a maintained deny list. Existing references are rejected as well as new ones; the immutable baseline is used only to preserve approved PDF bytes. It does not discover all repositories or certify repository visibility. The credential gate recognizes specific provider signatures and up to eight JSON-decoding passes; it does not prove arbitrary encoding, encryption, steganography, historical commits, or hosted output free of sensitive data. Anything published remains disclosed. Keep implementation details in restricted repositories and independently inspect published artifacts when changing a publishing path.

Security maintenance follows protected pull requests and exact-head checks. Sole-owner operation does not require a second human approver. These source checks confer no production execution authority on AI.

Credential signatures are checked in complete file views and in decoded published relative paths. Credential-bearing paths are masked in credential-gate diagnostics. Private-reference paths are compared against the immutable baseline independently of body format; filename extensions do not hide a restricted repository identifier.

## Public demonstration and implementation review

Public demos are intentionally synthetic examples. They are disclosed source, not an anti-copying control. Preserve their interaction, authority boundaries and accessible walkthroughs. Do not port private runtime algorithms, prompts, entitlement logic, fixtures or regression cases into the demos. New demo engines and substantive algorithm changes require an explicit publication disposition in the pull request: independently authored synthetic example, intentionally public contract, or sanitized projection. A sole owner can perform this review; no second human is required.

Portfolio telemetry v2 publishes product identities and domain-separated SHA-256 evidence commitments instead of restricted repository names or Git coordinates. Commitments preserve matching between the dashboard and roadmap; they are not signatures, authentication or retroactive secrecy. The producer retains the exact original coordinates in its restricted source record. The browser rejects legacy or mismatched feeds and retains its offline roadmap fallback.

## Supported publication representation

Owned references and explicit GitHub repository URLs are checked against complete approved organization/repository pairs in file bodies and published paths. Browser-equivalent separators are decoded before matching. Dot path components are rejected rather than normalized into an approved repository. Text that does not reach a stable representation within the supported normalization bound is rejected. Submodule configuration and opaque Git LFS pointers are not approved public-site publication formats. These checks do not certify arbitrary hidden data or repository visibility; perform the publication disposition before committing new material to a public repository.


## Portfolio text contract

The portfolio bundle has a stricter text boundary than the whole-site source audit. It checks object keys and values recursively, rejects unknown owner and repository pairs regardless of organization, and accepts schema identifiers only at their declared object paths. Validation runs before any bundle rendering; one invalid field rejects the complete bundle.

Approved public repository references are deliberately bounded: the repository root, a numeric issue or pull-request route, or a main-branch blob route with one filename. Raw-content references allow the root or main branch with one filename. Filenames start with an alphanumeric character, underscore or hyphen; remaining characters may also include dots. Nested paths, arbitrary refs, extra segments and dot-leading filenames are outside this telemetry contract. An approved repository prefix cannot authorize another coordinate hidden in its suffix. This restriction is specific to published telemetry text and does not prohibit ordinary website source links to reviewed public documentation.

The public App exception is the exact canonical web route only. Source markup closers must correspond to actual quoted URLs, HTML attributes, Markdown links or autolinks; encoded characters cannot manufacture a new lexical boundary. The JSON text boundary is stricter and accepts only whitespace or the end of text after that App route.

Domain-separated measure-source commitments retain source identity without exposing source paths. Evidence commitments are not publisher authentication. A bounded producer and consumer parity corpus and real producer-output validation supplement the tests; they do not prove equivalence for every possible input. The browser conservatively rejects unsupported named entities and malformed percent-encoded UTF-8.

When a live bundle is unavailable or invalid, the page labels its committed roadmap snapshot with its date and states that live telemetry is unavailable. Snapshot counts and synthetic content do not establish current operational progress or production readiness.

The bounded portfolio projection rejects encoded whitespace, control characters and numeric HTML entities that disappear during decoding before accepting a repository route. Browser-source scanning preserves original token and quoted-attribute boundaries. Its additional source-only links are an exact set of eight existing GitHub document, schema and advisory paths and two raw telemetry files; they do not expand the JSON feed grammar.
